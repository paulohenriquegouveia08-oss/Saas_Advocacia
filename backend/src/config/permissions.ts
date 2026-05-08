export type UserRole = 'admin_global' | 'funcionario' | 'cliente'

export type Permission =
  | 'users:create' | 'users:read' | 'users:update' | 'users:delete'
  | 'clients:create' | 'clients:read' | 'clients:update' | 'clients:delete'
  | 'processes:create' | 'processes:read' | 'processes:update' | 'processes:delete'
  | 'movements:create' | 'movements:read'
  | 'deadlines:create' | 'deadlines:read' | 'deadlines:update' | 'deadlines:delete' | 'deadlines:complete'
  | 'notifications:read' | 'notifications:update'
  | 'financial:create' | 'financial:read' | 'financial:update' | 'financial:delete'

const ALL_PERMISSIONS: Permission[] = [
  'users:create', 'users:read', 'users:update', 'users:delete',
  'clients:create', 'clients:read', 'clients:update', 'clients:delete',
  'processes:create', 'processes:read', 'processes:update', 'processes:delete',
  'movements:create', 'movements:read',
  'deadlines:create', 'deadlines:read', 'deadlines:update', 'deadlines:delete', 'deadlines:complete',
  'notifications:read', 'notifications:update',
  'financial:create', 'financial:read', 'financial:update', 'financial:delete',
]

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin_global: [...ALL_PERMISSIONS],

  funcionario: [
    'clients:create', 'clients:read', 'clients:update',
    'processes:create', 'processes:read', 'processes:update',
    'movements:create', 'movements:read',
    'deadlines:create', 'deadlines:read', 'deadlines:update', 'deadlines:complete',
    'notifications:read', 'notifications:update',
    'financial:create', 'financial:read', 'financial:update',
  ],

  cliente: [
    'processes:read',
    'deadlines:read',
    'notifications:read', 'notifications:update',
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}

export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role]
}
