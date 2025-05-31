import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../queues/rabbitmq.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    // Publish to RabbitMQ for async processing
    await this.rabbitMQService.publish(
      'crm-exchange',
      'customer.created',
      createCustomerDto,
    );
    return { status: 'Customer creation queued', data: createCustomerDto };
  }
}