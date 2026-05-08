import 'reflect-metadata';
import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { RolesModule } from './roles.module';
import { RolesSeedService } from './roles-seed.service';

async function main() {
  const app = await NestFactory.createApplicationContext(RolesModule, {
    logger: ['error', 'warn', 'log'],
  });
  const seed = app.get(RolesSeedService);
  const result = seed.seed();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  await app.close();
}

void main();

