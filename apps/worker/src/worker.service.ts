import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WorkerService {
  private readonly logger = new Logger(WorkerService.name);

  start() {
    this.logger.log('Worker started (bootstrap scaffold).');
  }
}

