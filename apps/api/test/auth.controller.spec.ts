import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { AuditService } from '../src/modules/audit/audit.service';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthModule } from '../src/modules/auth/auth.module';
import { UsersLookupService } from '../src/modules/auth/users-lookup.service';

describe('AuthController', () => {
  beforeEach(() => {
    process.env.AUTH_JWT_SECRET = 'test-secret';
  });

  it('returns access token and records audit events on login success', async () => {
    const passwordHash = await bcrypt.hash('secret', 10);
    const user = {
      id: 'user-1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      status: 'active',
      passwordHash,
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(UsersLookupService)
      .useValue({
        findByEmail: async (email: string) => (email === user.email ? user : null),
        findById: async (id: string) => (id === user.id ? user : null),
      })
      .compile();

    const controller = moduleRef.get(AuthController);
    const auditService = moduleRef.get(AuditService);

    expect(auditService.list()).toHaveLength(0);

    const result = await controller.login({ email: user.email, password: 'secret' } as any);
    expect(result.accessToken).toBeDefined();
    expect(result.user).toEqual({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
    });

    const events = auditService.list();
    expect(events.map((e) => e.actionCode)).toEqual(['auth.login.attempt', 'auth.login.success']);
    expect((events[0]?.metadata as any)?.emailHashPrefix).toBeDefined();
    expect((events[1]?.metadata as any)?.userId).toBe(user.id);
  });

  it('rejects invalid credentials and records audit failure event', async () => {
    const passwordHash = await bcrypt.hash('secret', 10);
    const user = {
      id: 'user-1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      status: 'active',
      passwordHash,
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(UsersLookupService)
      .useValue({
        findByEmail: async (email: string) => (email === user.email ? user : null),
        findById: async (id: string) => (id === user.id ? user : null),
      })
      .compile();

    const controller = moduleRef.get(AuthController);
    const auditService = moduleRef.get(AuditService);

    await expect(controller.login({ email: user.email, password: 'wrong' } as any)).rejects.toThrow(
      UnauthorizedException,
    );

    const events = auditService.list();
    expect(events.map((e) => e.actionCode)).toEqual(['auth.login.attempt', 'auth.login.failure']);
  });
});
