import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { WorkerService } from './worker.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  app.get(WorkerService).start();
}

void bootstrap();
