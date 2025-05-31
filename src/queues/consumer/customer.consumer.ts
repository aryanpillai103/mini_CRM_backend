import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomerConsumer implements OnModuleInit {
  private readonly logger = new Logger(CustomerConsumer.name);

  constructor(
    private readonly rabbitMQ: RabbitMQService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    try {
      const queue = 'customer-queue';
      const exchange = 'crm-exchange';
      const routingKey = 'customer.*'; // Wildcard for all customer events

      if (typeof this.rabbitMQ.bindQueue !== 'function') {
        throw new Error('RabbitMQService.bindQueue is not a function');
      }

      // Call it like this (without exchange parameter):
await this.rabbitMQ.bindQueue(
  'customer-queue',  // queue name
  'customer.*',     // routing key
  { durable: true } // optional queue options
);

      await this.rabbitMQ.consume(queue, async (message) => {
        try {
          await this.prisma.customer.create({ data: message });
          this.logger.log(`Customer created: ${message.email}`);
        } catch (error) {
          this.logger.error(`Customer processing failed`, error.stack);
        }
      });
    } catch (error) {
      this.logger.error('Failed to initialize CustomerConsumer', error.stack);
      // Consider implementing a retry mechanism here
    }
  }
}