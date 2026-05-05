import type { User } from './types';

export const PERMISSIONS = {
  admin: {
    canEdit: true,
    canCreate: true,
    canDelete: true,
    canAccessSystem: true,
    canExport: true,
    canImport: true,
    canPrint: true,
  },
  editor: {
    canEdit: true,
    canCreate: true,
    canDelete: true,
    canAccessSystem: false,
    canExport: true,
    canImport: true,
    canPrint: true,
  },
  readonly: {
    canEdit: false,
    canCreate: false,
    canDelete: false,
    canAccessSystem: false,
    canExport: true,
    canImport: false,
    canPrint: true,
  },
} as const;

export type PermissionKey = keyof typeof PERMISSIONS.admin;

export function hasPermission(role: User['role'], permission: PermissionKey): boolean {
  return PERMISSIONS[role]?.[permission] ?? false;
}

export function getPermissions(role: User['role']) {
  return PERMISSIONS[role] || PERMISSIONS.readonly;
}
