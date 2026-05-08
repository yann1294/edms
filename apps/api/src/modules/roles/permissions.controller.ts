import { Controller, Get } from '@nestjs/common';
import { PermissionCatalogService } from './permission-catalog.service';

@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionCatalog: PermissionCatalogService) {}

  @Get()
  list() {
    return this.permissionCatalog.list();
  }
}

