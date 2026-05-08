import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import bcrypt from 'bcryptjs';
import { AuthModule } from '../src/modules/auth/auth.module';
import { AuthController } from '../src/modules/auth/auth.controller';
import { AuthGuard } from '../src/modules/auth/auth.guard';
import { AuthService } from '../src/modules/auth/auth.service';
import { UsersLookupService } from '../src/modules/auth/users-lookup.service';

describe('AuthGuard + RequestContext', () => {
  const makeContext = (request: any) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as any;

  const user = {
    id: 'user-1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    status: 'active',
    passwordHash: '',
  };

  beforeEach(async () => {
    process.env.AUTH_JWT_SECRET = 'test-secret';
    user.passwordHash = await bcrypt.hash('secret', 10);
  });

  it('attaches user to request context and supports /auth/me', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(UsersLookupService)
      .useValue({
        findByEmail: async (email: string) => (email === user.email ? user : null),
        findById: async (id: string) => (id === user.id ? user : null),
      })
      .compile();

    const authService = moduleRef.get(AuthService);
    const guard = moduleRef.get(AuthGuard);
    const controller = moduleRef.get(AuthController);

    const { accessToken } = await authService.login(user.email, 'secret');

    const req: any = { headers: { authorization: `Bearer ${accessToken}` } };
    await expect(guard.canActivate(makeContext(req))).resolves.toBe(true);

    expect(req.context?.user).toEqual({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status,
    });

    expect(controller.me(req)).toEqual(req.context.user);
  });

  it('rejects missing bearer token', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(UsersLookupService)
      .useValue({
        findByEmail: async (email: string) => (email === user.email ? user : null),
        findById: async (id: string) => (id === user.id ? user : null),
      })
      .compile();

    const guard = moduleRef.get(AuthGuard);
    const req: any = { headers: {} };
    await expect(guard.canActivate(makeContext(req))).rejects.toThrow(UnauthorizedException);
  });

  it('rejects invalid token', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(UsersLookupService)
      .useValue({
        findByEmail: async (email: string) => (email === user.email ? user : null),
        findById: async (id: string) => (id === user.id ? user : null),
      })
      .compile();

    const guard = moduleRef.get(AuthGuard);
    const req: any = { headers: { authorization: 'Bearer invalid.token.value' } };
    await expect(guard.canActivate(makeContext(req))).rejects.toThrow(UnauthorizedException);
  });
});
