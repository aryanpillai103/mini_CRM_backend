import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { RabbitMQModule } from './queues/rabbimq.module'; // Import RabbitMQModule
import { AppController } from './app.controller';

@Module({
  imports: [
    AuthModule,
    RabbitMQModule, // Add RabbitMQModule to imports
  ],
  controllers: [AppController], // Move AppController here
  providers: [], // Remove AppController from providers
})
export class AppModule {}
