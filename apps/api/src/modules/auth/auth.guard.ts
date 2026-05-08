import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtAuthService } from './jwt-auth.service';
import { UsersLookupService } from './users-lookup.service';
import { RequestWithContext } from '../../shared/request-context';
import { CurrentUser } from '../../shared/current-user';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtAuth: JwtAuthService,
    private readonly usersLookup: UsersLookupService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();
    (request as any).context ??= {};
    const authHeader =
      (request?.headers as Record<string, string | undefined> | undefined)?.authorization ??
      (request?.headers as Record<string, string | undefined> | undefined)?.Authorization;

    if (!authHeader) throw new UnauthorizedException('Missing Authorization header.');

    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!match?.[1]) throw new UnauthorizedException('Invalid Authorization header.');

    const payload = this.jwtAuth.verifyAccessToken(match[1]);
    const user = await this.usersLookup.findById(payload.sub);
    if (!user) throw new UnauthorizedException('User not found.');
    if (user.status === 'disabled') throw new UnauthorizedException('User is disabled.');

    const currentUser: CurrentUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      status: user.status === 'invited' ? 'invited' : 'active',
    };
    request.context.user = currentUser;
    return true;
  }
}
