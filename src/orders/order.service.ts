import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../queues/rabbitmq.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async create(createOrderDto: CreateOrderDto) {
    // Default status if not provided
    const orderData = {
      ...createOrderDto,
      status: createOrderDto.status || 'PENDING',
    };

    await this.rabbitMQService.publish(
      'order.created', // routingKey first
      orderData,       // message second
      undefined,       // options (optional)
      'crm-exchange'   // exchange (optional)
    );

    return {
      status: 'queued',
      data: orderData,
      timestamp: new Date().toISOString(),
    };
  }
}