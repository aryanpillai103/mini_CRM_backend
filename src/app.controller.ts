import { Controller, Get } from '@nestjs/common';
import { RabbitMQService } from './queues/rabbitmq.service';

@Controller()
export class AppController {
  constructor(private readonly rabbitMQ: RabbitMQService) {}

  @Get('test-publish')
async testPublish() {
  await this.rabbitMQ.publish(
    'test.message', // routingKey
    { message: 'Hello from NestJS!' }, // message content
    { 
      // Standard AMQP options go here
      headers: { 'x-custom-header': 'value' } // example of valid option
    },
    'crm-exchange' // exchange as separate parameter
  );
  return { status: 'Message published to exchange' };
}
}