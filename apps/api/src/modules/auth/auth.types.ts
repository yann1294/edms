export type UserStatus = 'active' | 'invited' | 'disabled';

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  status: UserStatus;
};

export type AuthUserRecord = AuthUser & {
  passwordHash?: string;
};

export type JwtAccessTokenPayload = {
  sub: string;
  typ?: string;
  iat?: number;
  exp?: number;
};
