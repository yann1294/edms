import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AuditService } from '../audit/audit.service';
import { CurrentUser } from '../../shared/current-user';
import { JwtAuthService } from './jwt-auth.service';
import { PasswordHasherService } from './password-hasher.service';
import { UsersLookupService } from './users-lookup.service';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function emailHashPrefix(email: string): string {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex').slice(0, 12);
}

@Injectable()
export class AuthService {
  constructor(
    private readonly auditService: AuditService,
    private readonly usersLookup: UsersLookupService,
    private readonly passwordHasher: PasswordHasherService,
    private readonly jwtAuth: JwtAuthService,
  ) {}

  async login(email: string, password: string): Promise<{ accessToken: string; user: CurrentUser }> {
    const prefix = emailHashPrefix(email);

    this.auditService.record({
      actionCode: 'auth.login.attempt',
      metadata: { emailHashPrefix: prefix },
    });

    const user = await this.usersLookup.findByEmail(normalizeEmail(email));
    if (!user?.passwordHash) {
      this.auditService.record({
        actionCode: 'auth.login.failure',
        metadata: { emailHashPrefix: prefix },
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (user.status === 'disabled') {
      this.auditService.record({
        actionCode: 'auth.login.failure',
        metadata: { emailHashPrefix: prefix },
      });
      throw new UnauthorizedException('User is disabled.');
    }

    const passwordOk = await this.passwordHasher.verify(password, user.passwordHash);
    if (!passwordOk) {
      this.auditService.record({
        actionCode: 'auth.login.failure',
        metadata: { emailHashPrefix: prefix },
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    const safeUser: CurrentUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status === 'invited' ? 'invited' : 'active',
    };

    const accessToken = this.jwtAuth.signAccessToken({ userId: user.id });

    this.auditService.record({
      actionCode: 'auth.login.success',
      metadata: { emailHashPrefix: prefix, userId: user.id },
    });

    return { accessToken, user: safeUser };
  }
}
