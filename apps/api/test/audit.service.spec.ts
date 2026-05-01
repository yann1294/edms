import { Test } from '@nestjs/testing';
import { AuditModule } from '../src/modules/audit/audit.module';
import { AuditService } from '../src/modules/audit/audit.service';

describe('AuditService', () => {
  it('records events with UTC timestamp', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuditModule],
    }).compile();

    const service = moduleRef.get(AuditService);
    service.record({ actionCode: 'test.action' });

    const events = service.list();
    expect(events).toHaveLength(1);
    expect(events[0]?.occurredAtUtc).toMatch(/Z$/);
    expect(events[0]?.actionCode).toBe('test.action');
  });
});

