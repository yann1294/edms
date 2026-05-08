export type JwtAccessTokenPayload = {
  sub: string;
  typ?: 'access';
  iat?: number;
  exp?: number;
};

