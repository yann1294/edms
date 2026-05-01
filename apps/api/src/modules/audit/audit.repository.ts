import { Injectable } from '@nestjs/common';
import { AuditEvent } from './audit.event';

@Injectable()
export class AuditRepository {
  private readonly events: AuditEvent[] = [];

  append(event: AuditEvent) {
    this.events.push(event);
  }

  list() {
    return [...this.events];
  }
}

