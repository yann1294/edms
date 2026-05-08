import { Injectable } from '@nestjs/common';
import { readFileSync } from 'fs';
import path from 'path';
import { PermissionCatalogService } from './permission-catalog.service';
import { RoleService } from './role.service';
import { RoleRepository } from './store/role.repository';

function findPermissionMatrixPath(): string {
  // Walk up from cwd until we find docs/permission-matrix.md
  let current = process.cwd();
  for (let i = 0; i < 10; i++) {
    const candidate = path.join(current, 'docs', 'permission-matrix.md');
    try {
      readFileSync(candidate, 'utf8');
      return candidate;
    } catch {
      // continue
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  // Fallback: relative to compiled dist location / source location
  return path.resolve(__dirname, '../../../../../../docs/permission-matrix.md');
}

function parsePermissionCodesFromMatrix(markdown: string): string[] {
  const codes = new Set<string>();

  // Prefer catalog entries declared with backticks.
  const backtick = /`([^`]+)`/g;
  for (const match of markdown.matchAll(backtick)) {
    const token = match[1]?.trim();
    if (!token) continue;
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(token)) codes.add(token);
  }

  // Also parse the Matrix table first column.
  for (const line of markdown.split('\n')) {
    if (!line.startsWith('|')) continue;
    const parts = line.split('|').map((p) => p.trim());
    const first = parts[1];
    if (first && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(first)) codes.add(first);
  }

  return [...codes].sort((a, b) => a.localeCompare(b));
}

function defaultUserPermissionCodes(allCodes: string[]): string[] {
  const allow = new Set<string>();
  for (const code of allCodes) {
    if (code.endsWith('.view')) allow.add(code);
  }
  // "Read" access that isn't expressed as *.view in the matrix
  for (const code of ['document.download', 'document.preview', 'file.view']) {
    if (allCodes.includes(code)) allow.add(code);
  }
  return [...allow].sort((a, b) => a.localeCompare(b));
}

@Injectable()
export class RolesSeedService {
  constructor(
    private readonly permissionCatalog: PermissionCatalogService,
    private readonly roleRepository: RoleRepository,
    private readonly roleService: RoleService,
  ) {}

  seed(): { permissionsSeeded: string[]; rolesSeeded: string[] } {
    const matrixPath = findPermissionMatrixPath();
    const markdown = readFileSync(matrixPath, 'utf8');
    const permissionCodes = parsePermissionCodesFromMatrix(markdown);
    const permissions = this.permissionCatalog.seedByCodes(permissionCodes);

    const adminRole =
      this.roleRepository.findByOrgAndCode(null, 'ADMIN') ??
      this.roleService.createRole({
        organizationId: null,
        name: 'Admin',
        code: 'ADMIN',
        description: 'Administrator (seeded)',
      });

    const userRole =
      this.roleRepository.findByOrgAndCode(null, 'USER') ??
      this.roleService.createRole({
        organizationId: null,
        name: 'User',
        code: 'USER',
        description: 'Basic user (seeded)',
      });

    // Assign permissions (idempotent behavior: ignore already-assigned rows).
    const rolesSeeded = [adminRole.code, userRole.code];
    const allCodes = permissions.map((p) => p.code);

    this.roleService.ensurePermissionsOnRole(adminRole.id, allCodes);
    this.roleService.ensurePermissionsOnRole(userRole.id, defaultUserPermissionCodes(allCodes));

    return { permissionsSeeded: permissions.map((p) => p.code), rolesSeeded };
  }
}
