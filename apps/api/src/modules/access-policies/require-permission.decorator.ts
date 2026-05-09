import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSION_CODE = 'required_permission_code';

export function RequirePermission(permissionCode: string) {
  return SetMetadata(REQUIRED_PERMISSION_CODE, permissionCode);
}

