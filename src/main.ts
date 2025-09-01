import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
