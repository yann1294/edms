export type UserStatus = 'active' | 'invited' | 'disabled';

export type UsersLookupRecord = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
  passwordHash?: string;
};

