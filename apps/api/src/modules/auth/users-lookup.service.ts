import { Injectable } from '@nestjs/common';
import { AuthUserRecord, UserStatus } from './auth.types';

function parseStatus(status: string | undefined): UserStatus {
  if (status === 'active' || status === 'invited' || status === 'disabled') return status;
  return 'active';
}

@Injectable()
export class UsersLookupService {
  private readonly usersById = new Map<string, AuthUserRecord>();
  private readonly usersByEmail = new Map<string, AuthUserRecord>();

  constructor() {
    const email = process.env.AUTH_BOOTSTRAP_USER_EMAIL?.trim().toLowerCase();
    const passwordHash = process.env.AUTH_BOOTSTRAP_USER_PASSWORD_HASH;
    if (!email || !passwordHash) return;

    const user: AuthUserRecord = {
      id: process.env.AUTH_BOOTSTRAP_USER_ID ?? 'bootstrap-user',
      email,
      firstName: process.env.AUTH_BOOTSTRAP_USER_FIRST_NAME ?? 'Bootstrap',
      lastName: process.env.AUTH_BOOTSTRAP_USER_LAST_NAME ?? 'User',
      status: parseStatus(process.env.AUTH_BOOTSTRAP_USER_STATUS),
      passwordHash,
    };

    this.usersById.set(user.id, user);
    this.usersByEmail.set(user.email, user);
  }

  async findByEmail(email: string): Promise<AuthUserRecord | null> {
    return this.usersByEmail.get(email.trim().toLowerCase()) ?? null;
  }

  async findById(id: string): Promise<AuthUserRecord | null> {
    return this.usersById.get(id) ?? null;
  }
}
