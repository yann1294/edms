import { Injectable, UnauthorizedException } from '@nestjs/common';
import jwt from 'jsonwebtoken';
import { JwtAccessTokenPayload } from './jwt.types';

@Injectable()
export class JwtAuthService {
  private get secret(): string {
    const secret = process.env.AUTH_JWT_SECRET;
    if (!secret) {
      throw new Error('AUTH_JWT_SECRET is not configured.');
    }
    return secret;
  }

  private get expiresInSeconds(): number {
    const raw = process.env.AUTH_JWT_EXPIRES_IN_SECONDS;
    if (!raw) return 60 * 60;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return 60 * 60;
    return parsed;
  }

  signAccessToken(input: { userId: string }): string {
    return jwt.sign(
      { typ: 'access' },
      this.secret,
      {
        algorithm: 'HS256',
        subject: input.userId,
        expiresIn: this.expiresInSeconds,
      },
    );
  }

  verifyAccessToken(token: string): JwtAccessTokenPayload {
    try {
      const verified = jwt.verify(token, this.secret, { algorithms: ['HS256'] });
      if (typeof verified !== 'object' || verified === null) {
        throw new UnauthorizedException('Invalid token.');
      }
      const payload = verified as JwtAccessTokenPayload;
      if (!payload.sub) {
        throw new UnauthorizedException('Invalid token.');
      }
      if (payload.typ && payload.typ !== 'access') {
        throw new UnauthorizedException('Invalid token.');
      }
      return payload;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Invalid token.');
    }
  }
}
