import { NotImplementedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuditService } from '../src/modules/audit/audit.service';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthModule } from '../src/modules/auth/auth.module';

describe('AuthController', () => {
  it('records audit event on login attempt (bootstrap stub)', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    }).compile();

    const controller = moduleRef.get(AuthController);
    const auditService = moduleRef.get(AuditService);

    expect(auditService.list()).toHaveLength(0);

    expect(() => controller.login({ email: 'admin@example.com', password: 'secret' } as any)).toThrow(
      NotImplementedException,
    );

    const events = auditService.list();
    expect(events).toHaveLength(1);
    expect(events[0]?.actionCode).toBe('auth.login.attempt');
    expect((events[0]?.metadata as any)?.emailHashPrefix).toBeDefined();
  });
});

