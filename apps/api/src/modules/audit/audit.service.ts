import { Injectable } from '@nestjs/common';
import { AuditEvent } from './audit.event';
import { AuditRepository } from './audit.repository';

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  record(event: Omit<AuditEvent, 'occurredAtUtc'>) {
    this.auditRepository.append({
      occurredAtUtc: new Date().toISOString(),
      ...event,
    });
  }

  list() {
    return this.auditRepository.list();
  }
}

