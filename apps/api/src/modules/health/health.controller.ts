import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  getHealth() {
    return { status: 'ok' };
  }

  @Get('dependencies')
  getDependencyHealth() {
    return {
      status: 'stubbed',
      dependencies: {
        db: 'unknown',
        redis: 'unknown',
        objectStorage: 'unknown',
        search: 'unknown',
      },
    };
  }
}

