/* eslint-disable prettier/prettier */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as session from 'express-session';
import * as passport from 'passport';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Session setup for OAuth
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 3600000 }, // 1 hour
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Mini CRM API')
    .setDescription('Customer Relationship Management System')
    .setVersion('1.0')
    .addTag('CRM')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  app.enableCors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
});
}
void bootstrap();
