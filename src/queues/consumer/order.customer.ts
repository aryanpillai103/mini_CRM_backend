import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrderConsumer {
  private readonly logger = new Logger(OrderConsumer.name);

  constructor(
    private readonly rabbitMQ: RabbitMQService,
    private readonly prisma: PrismaService,
  ) {
    this.init();
  }

  private async init() {
    const queue = 'order-queue';
    const exchange = 'crm-exchange';
    const routingKey = 'order.created';

    // Bind queue to exchange
    await this.rabbitMQ.bindQueue(queue, exchange, routingKey);

    // Start consuming
    await this.rabbitMQ.consume(queue, async (message) => {
      try {
        await this.prisma.order.create({
          data: {
            customerId: message.customerId,
            amount: message.amount,
            items: message.items,
            status: message.status,
          },
        });
        this.logger.log(`Order created for ${message.customerId}`);
      } catch (error) {
        this.logger.error(`Order processing failed`, error.stack);
      }
    });
  }
}