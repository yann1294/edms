import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<any>();
    const authHeader = (request?.headers as Record<string, string | undefined>)?.authorization;

    if (authHeader === 'Bearer dev') {
      request.user = { id: 'dev-user' };
      return true;
    }

    throw new UnauthorizedException('Authentication not configured yet.');
  }
}
