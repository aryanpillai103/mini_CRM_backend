import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { Channel, Connection } from 'amqplib';
import { EventEmitter } from 'events';
import { setTimeout } from 'timers/promises';
import * as net from 'net';

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private connection: Connection;
  private channel: Channel;
  private readonly logger = new Logger(RabbitMQService.name);
  private readonly emitter = new EventEmitter();
  private isInitialized = false;
  private isShuttingDown = false;
  
  private readonly exchangeType = process.env.RABBITMQ_EXCHANGE_TYPE || 'topic';
  private readonly exchangeName = process.env.RABBITMQ_EXCHANGE_NAME || 'crm-exchange';

  private readonly connectionOptions = {
    protocol: 'amqp',
    hostname: this.getEnvVariable('RABBITMQ_HOST', 'localhost'),
    port: parseInt(this.getEnvVariable('RABBITMQ_PORT', '5672')),
    username: this.getEnvVariable('RABBITMQ_USERNAME', 'guest'),
    password: this.getEnvVariable('RABBITMQ_PASSWORD', 'guest'),
    vhost: this.getEnvVariable('RABBITMQ_VHOST', '/'),
    heartbeat: 30,
    frameMax: 8192
  };

  private readonly retryOptions = {
    maxAttempts: 20,
    initialDelay: 1000,
    maxDelay: 30000,
    factor: 2
  };

  private getEnvVariable(name: string, defaultValue: string): string {
    return process.env[name] || defaultValue;
  }

  async onModuleInit(): Promise<void> {
    if (!await this.checkPortAvailability()) {
      throw new Error(`RabbitMQ unreachable at ${this.connectionOptions.hostname}:${this.connectionOptions.port}`);
    }
    await this.initializeConnection();
  }

  async onModuleDestroy(): Promise<void> {
    this.isShuttingDown = true;
    await this.closeConnection();
  }

  private async checkPortAvailability(): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(2000);
      
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });

      socket.once('error', () => {
        socket.destroy();
        resolve(false);
      });

      socket.connect(this.connectionOptions.port, this.connectionOptions.hostname);
    });
  }

private async initializeConnection(): Promise<void> {
  let attempt = 0;
  let delay = this.retryOptions.initialDelay;

  while (attempt < this.retryOptions.maxAttempts && !this.isShuttingDown) {
    attempt++;
    try {
      await this.connect();
      this.isInitialized = true;
      this.emitter.emit('ready');
      this.logger.log(`Connected to RabbitMQ (exchange: ${this.exchangeName}, type: ${this.exchangeType})`);
      return;
    } catch (error) {
      // Specific handling for exchange conflicts
      if (error.message.includes('PRECONDITION_FAILED') && 
          error.message.includes('inequivalent arg')) {
        this.logger.error(`Exchange configuration mismatch detected. Attempting resolution...`);
        await this.handleExchangeConflict();
        continue; // Skip the delay and retry immediately
      }
      
      this.logger.error(`Connection attempt ${attempt} failed: ${error.message}`);
      if (attempt >= this.retryOptions.maxAttempts) {
        throw new Error(`Failed after ${attempt} attempts. Last error: ${error.message}`);
      }
      delay = Math.min(delay * this.retryOptions.factor, this.retryOptions.maxDelay);
      await setTimeout(delay);
    }
  }
}

  private async connect(): Promise<void> {
    await this.cleanupExistingConnection();
    
    this.connection = await amqp.connect(this.connectionOptions);
    
    this.connection.on('close', () => this.handleConnectionLoss());
    this.connection.on('error', (err) => {
      if (!this.isShuttingDown) this.logger.error(`Connection error: ${err.message}`);
    });

    await this.createChannel();
    await this.setupExchange();
  }

  private async cleanupExistingConnection(): Promise<void> {
    try {
      if (this.channel) await this.channel.close().catch(() => {});
      if (this.connection) await this.connection.close().catch(() => {});
    } catch (err) {
      this.logger.warn('Cleanup error:', err.message);
    }
  }

  private async createChannel(): Promise<void> {
    this.channel = await this.connection.createConfirmChannel();
    
    this.channel.on('close', () => {
      if (!this.isShuttingDown) {
        this.logger.warn('Channel closed - recreating...');
        this.createChannel();
      }
    });

    this.channel.on('error', (err) => {
      if (!this.isShuttingDown) this.logger.error(`Channel error: ${err.message}`);
    });
  }

private async setupExchange(): Promise<void> {
  try {
    // First try to get the existing exchange info
    const checkExchange = await this.channel.checkExchange(this.exchangeName);
    this.logger.debug(`Exchange exists: ${JSON.stringify(checkExchange)}`);
    
    // If we get here, the exchange exists - now assert with correct params
    await this.channel.assertExchange(this.exchangeName, this.exchangeType, {
      durable: true,
      alternateExchange: 'amq.direct'
    });
  } catch (err) {
    if (err.code === 404) {
      // Exchange doesn't exist - create it fresh
      this.logger.log(`Creating new exchange ${this.exchangeName} of type ${this.exchangeType}`);
      await this.channel.assertExchange(this.exchangeName, this.exchangeType, {
        durable: true,
        alternateExchange: 'amq.direct'
      });
    } else if (err.code === 406) {
      // Parameter mismatch - handle conflict
      await this.handleExchangeConflict();
    } else {
      throw err;
    }
  }
}

private async handleExchangeConflict(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Production exchange conflict for ${this.exchangeName}. Manual intervention required.`);
  }

  this.logger.warn(`Attempting to resolve exchange conflict for ${this.exchangeName}`);
  
  try {
    // Step 1: Unbind all queues from this exchange
    const bindings = await this.getExchangeBindings();
    for (const binding of bindings) {
      await this.channel.unbindQueue(
        binding.queue, 
        this.exchangeName, 
        binding.routingKey,
        binding.args
      );
    }

    // Step 2: Delete the exchange
    await this.channel.deleteExchange(this.exchangeName);
    this.logger.log(`Successfully deleted conflicting exchange ${this.exchangeName}`);

    // Step 3: Recreate with correct parameters
    await this.channel.assertExchange(this.exchangeName, this.exchangeType, {
      durable: true,
      alternateExchange: 'amq.direct'
    });
    this.logger.log(`Successfully recreated exchange ${this.exchangeName} as type ${this.exchangeType}`);

    // Step 4: Rebind all queues
    for (const binding of bindings) {
      await this.channel.bindQueue(
        binding.queue,
        this.exchangeName,
        binding.routingKey,
        binding.args
      );
    }
  } catch (error) {
    this.logger.error(`Failed to resolve exchange conflict: ${error.message}`);
    throw new Error(`Cannot reconcile exchange parameters. Please check RabbitMQ manually.`);
  }
}

private async getExchangeBindings(): Promise<any[]> {
  // This requires RabbitMQ management plugin enabled
  const managementApiUrl = `http://${this.connectionOptions.hostname}:15672/api/bindings/${encodeURIComponent(this.connectionOptions.vhost)}`;
  const auth = Buffer.from(`${this.connectionOptions.username}:${this.connectionOptions.password}`).toString('base64');
  
  try {
    const response = await fetch(managementApiUrl, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    const allBindings = await response.json();
    return allBindings.filter(b => b.source === this.exchangeName);
  } catch (error) {
    this.logger.warn(`Could not fetch bindings from management API: ${error.message}`);
    return [];
  }
}

  private async handleConnectionLoss(): Promise<void> {
    if (this.isShuttingDown) return;
    
    this.isInitialized = false;
    await this.cleanupExistingConnection();
    
    if (await this.checkPortAvailability()) {
      this.logger.log('Attempting to reconnect...');
      await this.initializeConnection();
    } else {
      this.logger.error('RabbitMQ server unavailable - retrying...');
      await setTimeout(this.retryOptions.initialDelay);
      await this.handleConnectionLoss();
    }
  }

  private async ensureReady(): Promise<void> {
    if (this.isInitialized) return;
    return new Promise((resolve) => {
      this.emitter.once('ready', resolve);
    });
  }

  async bindQueue(
    queue: string,
    routingKey: string,
    queueOptions: amqp.Options.AssertQueue = { durable: true }
  ): Promise<void> {
    await this.ensureReady();
    try {
      await this.channel.assertQueue(queue, queueOptions);
      await this.channel.bindQueue(queue, this.exchangeName, routingKey);
      this.logger.debug(`Bound queue ${queue} to ${this.exchangeName} with key ${routingKey}`);
    } catch (error) {
      this.logger.error(`Queue binding failed: ${error.message}`);
      throw error;
    }
  }

async publish(
  routingKey: string,
  message: any,
  options?: amqp.Options.Publish,
  exchange?: string // Add exchange as optional parameter
): Promise<boolean> {
  await this.ensureReady();
  return new Promise((resolve) => {
    this.channel.publish(
      exchange || this.exchangeName, // Use provided exchange or default
      routingKey,
      Buffer.from(JSON.stringify(message)),
      options
    );
    resolve(true); // Consider adding error handling as in your commented code
  });
}

  async consume(
    queue: string,
    callback: (msg: any) => Promise<void>,
    queueOptions: amqp.Options.AssertQueue = { durable: true },
    consumeOptions: amqp.Options.Consume = { noAck: false }
  ): Promise<void> {
    await this.ensureReady();
    try {
      await this.channel.assertQueue(queue, queueOptions);
      await this.channel.consume(queue, async (msg) => {
        if (!msg) return;
        
        try {
          const content = JSON.parse(msg.content.toString());
          await callback(content);
          this.channel.ack(msg);
        } catch (error) {
          this.logger.error(`Message processing failed: ${error.message}`);
          this.channel.nack(msg, false, false);
        }
      }, consumeOptions);
      this.logger.log(`Consuming queue: ${queue}`);
    } catch (error) {
      this.logger.error(`Consume setup failed: ${error.message}`);
      throw error;
    }
  }

  async closeConnection(): Promise<void> {
    this.isShuttingDown = true;
    await this.cleanupExistingConnection();
    this.logger.log('RabbitMQ connection closed gracefully');
  }
}