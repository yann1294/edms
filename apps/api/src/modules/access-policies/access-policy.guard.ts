import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RequestContext } from '../../shared/request-context';
import { AccessEvaluatorService } from './access-evaluator.service';
import { REQUIRED_PERMISSION_CODE } from './require-permission.decorator';

@Injectable()
export class AccessPolicyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly evaluator: AccessEvaluatorService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissionCode = this.reflector.get<string | undefined>(
      REQUIRED_PERMISSION_CODE,
      context.getHandler(),
    );
    if (!requiredPermissionCode) return true;

    const request = context.switchToHttp().getRequest<{ context: RequestContext }>();
    const currentUser = request?.context?.user;
    if (!currentUser) return false;

    const reqAny = context.switchToHttp().getRequest<any>();
    const resourceType =
      (reqAny?.params?.resourceType as string | undefined) ??
      (reqAny?.query?.resourceType as string | undefined);
    const resourceId =
      (reqAny?.params?.resourceId as string | undefined) ?? (reqAny?.query?.resourceId as string | undefined);

    // Prepared guard: without a clear resource to evaluate, deny by default.
    if (!resourceType || !resourceId) return false;

    // Roles + department are not yet attached to the RequestContext in this codebase.
    return this.evaluator.evaluateAccess({
      userId: currentUser.id,
      roles: [],
      departmentId: null,
      resourceType,
      resourceId,
      permissionCode: requiredPermissionCode,
    });
  }
}
