import { Module } from '@nestjs/common';
import { CustomersController } from './customer.controller';
import { CustomersService } from './customer.service';
import { QueuesModule } from '../queues/queues.module';

@Module({
  imports: [QueuesModule], // Import RabbitMQ module
  controllers: [CustomersController],
  providers: [CustomersService],
  exports: [CustomersService], // Export if needed by other modules
})
export class CustomersModule {}