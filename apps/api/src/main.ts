import 'reflect-metadata';
import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ApiResponseInterceptor } from './shared/api/api-response.interceptor';
import { HttpExceptionFilter } from './shared/api/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.setGlobalPrefix(process.env.API_BASE_PATH ?? '/api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
