import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);
    app.enableCors({
    origin: [
      configService.get('FRONTEND_URL'),
      'https://localhost:3000',
      'https://localhost:3001',
      'https://localhost:5173',
      'https://localhost:8080',
      'https://127.0.0.1:8080',
      'https://127.0.0.1:3001',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'http://localhost:8080',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3001'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe(
  {
     whitelist: true,            // strip unknown fields
      forbidNonWhitelisted: true, // throw error if extra fields are sent
      transform: true,            // auto-transform types (e.g. string -> number)
      // Enable validation for nested objects
      disableErrorMessages: false, // disable error messages
}
  ));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
