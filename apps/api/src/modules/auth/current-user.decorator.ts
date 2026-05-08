import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { RequestWithContext } from '../../shared/request-context';
import { CurrentUser as CurrentUserType } from '../../shared/current-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserType => {
    const request = ctx.switchToHttp().getRequest<RequestWithContext>();
    const user = (request as any)?.context?.user;
    if (!user) throw new UnauthorizedException();
    return user;
  },
);
