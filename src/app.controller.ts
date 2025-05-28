import { Controller, Get } from '@nestjs/common';
import { RabbitMQService } from './queues/rabbitmq.service';

@Controller()
export class AppController {
  constructor(private readonly rabbitMQService: RabbitMQService) {}

  @Get('test-queue')
  async testQueue() {
    await this.rabbitMQService.publish('test-queue', { message: 'Hello World' });
    return { status: 'Message sent to queue' };
  }
}