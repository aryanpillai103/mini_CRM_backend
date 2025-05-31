import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { CustomerConsumer } from './consumer/customer.consumer';
import { OrderConsumer } from './consumer/order.customer';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [RabbitMQService, CustomerConsumer, OrderConsumer],
  exports: [RabbitMQService],
})
export class QueuesModule {}