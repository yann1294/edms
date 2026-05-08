import { Injectable } from '@nestjs/common';
import { UserStatus, UsersLookupRecord } from './users-lookup.types';

function parseStatus(status: string | undefined): UserStatus {
  if (status === 'active' || status === 'invited' || status === 'disabled') return status;
  return 'active';
}

@Injectable()
export class UsersLookupService {
  private readonly usersById = new Map<string, UsersLookupRecord>();
  private readonly usersByEmail = new Map<string, UsersLookupRecord>();

  constructor() {
    if (process.env.NODE_ENV !== 'development') return;

    const email = process.env.AUTH_BOOTSTRAP_USER_EMAIL?.trim().toLowerCase();
    const passwordHash = process.env.AUTH_BOOTSTRAP_USER_PASSWORD_HASH;
    if (!email || !passwordHash) return;

    const user: UsersLookupRecord = {
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

  async findByEmail(email: string): Promise<UsersLookupRecord | null> {
    return this.usersByEmail.get(email.trim().toLowerCase()) ?? null;
  }

  async findById(id: string): Promise<UsersLookupRecord | null> {
    return this.usersById.get(id) ?? null;
  }
}
