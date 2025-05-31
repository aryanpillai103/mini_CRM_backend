import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CustomersModule } from './customers/customer.module';
import { OrdersModule } from './orders/order.module';
import { QueuesModule } from './queues/queues.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    AuthModule,
    CustomersModule,
    OrdersModule,
    QueuesModule,
    PrismaModule,
  ],
})
export class AppModule {}