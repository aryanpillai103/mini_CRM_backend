import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../queues/rabbitmq.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    // Publish to RabbitMQ for async processing
    await this.rabbitMQService.publish(
      'customer.created', // routingKey
      createCustomerDto,  // message
      undefined,         // options (optional)
      'crm-exchange'     // exchange (optional, as it's already set in RabbitMQService)
    );
    
    return { status: 'Customer creation queued', data: createCustomerDto };
  }
}