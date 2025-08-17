/**
 * Permission system utilities for role-based access control
 */

export type UserRole = 'ADMIN' | 'EDITOR' | 'VIEWER'

/**
 * Permission definitions for each role
 */
export const PERMISSIONS = {
  // Content permissions
  CONTENT_CREATE: ['ADMIN', 'EDITOR'],
  CONTENT_READ: ['ADMIN', 'EDITOR', 'VIEWER'],
  CONTENT_UPDATE: ['ADMIN', 'EDITOR'],
  CONTENT_DELETE: ['ADMIN', 'EDITOR'],
  
  // Profile permissions
  PROFILE_CREATE: ['ADMIN', 'EDITOR'],
  PROFILE_READ: ['ADMIN', 'EDITOR', 'VIEWER'],
  PROFILE_UPDATE: ['ADMIN', 'EDITOR'],
  PROFILE_DELETE: ['ADMIN', 'EDITOR'],
  
  // User management permissions
  USER_CREATE: ['ADMIN'],
  USER_READ: ['ADMIN'],
  USER_UPDATE: ['ADMIN'],
  USER_DELETE: ['ADMIN'],
  USER_CHANGE_ROLE: ['ADMIN'],
  
  // System permissions
  SYSTEM_ADMIN: ['ADMIN'],
  GENERATE_CONTENT: ['ADMIN', 'EDITOR'],
} as const

export type Permission = keyof typeof PERMISSIONS

/**
 * Check if a user role has a specific permission
 * @param userRole - The user's role
 * @param permission - The permission to check
 * @returns True if the user has the permission, false otherwise
 */
export function hasPermission(userRole: UserRole, permission: Permission): boolean {
  return PERMISSIONS[permission].includes(userRole as any)
}

/**
 * Check if a user can perform content operations
 * @param userRole - The user's role
 * @returns Object with content permission flags
 */
export function getContentPermissions(userRole: UserRole) {
  return {
    canCreate: hasPermission(userRole, 'CONTENT_CREATE'),
    canRead: hasPermission(userRole, 'CONTENT_READ'),
    canEdit: hasPermission(userRole, 'CONTENT_UPDATE'),
    canUpdate: hasPermission(userRole, 'CONTENT_UPDATE'),
    canDelete: hasPermission(userRole, 'CONTENT_DELETE'),
    canGenerate: hasPermission(userRole, 'GENERATE_CONTENT'),
  }
}

/**
 * Check if a user can perform profile operations
 * @param userRole - The user's role
 * @returns Object with profile permission flags
 */
export function getProfilePermissions(userRole: UserRole) {
  return {
    canCreate: hasPermission(userRole, 'PROFILE_CREATE'),
    canRead: hasPermission(userRole, 'PROFILE_READ'),
    canUpdate: hasPermission(userRole, 'PROFILE_UPDATE'),
    canDelete: hasPermission(userRole, 'PROFILE_DELETE'),
  }
}

/**
 * Check if a user can perform user management operations
 * @param userRole - The user's role
 * @returns Object with user management permission flags
 */
export function getUserManagementPermissions(userRole: UserRole) {
  return {
    canCreate: hasPermission(userRole, 'USER_CREATE'),
    canRead: hasPermission(userRole, 'USER_READ'),
    canUpdate: hasPermission(userRole, 'USER_UPDATE'),
    canDelete: hasPermission(userRole, 'USER_DELETE'),
    canChangeRole: hasPermission(userRole, 'USER_CHANGE_ROLE'),
  }
}

/**
 * Get a user-friendly description of what each role can do
 * @param role - The role to describe
 * @returns Description of the role's capabilities
 */
export function getRoleDescription(role: UserRole): string {
  switch (role) {
    case 'ADMIN':
      return 'Full access to all features including user management, content creation, and profile editing'
    case 'EDITOR':
      return 'Can create and edit content and profiles, but cannot manage users or change permissions'
    case 'VIEWER':
      return 'Read-only access to view content and profiles, cannot create or edit anything'
    default:
      return 'Unknown role'
  }
}

/**
 * Middleware function to check if user has required permission
 * Throws an error if permission is not granted
 * @param userRole - The user's role
 * @param permission - The required permission
 * @throws Error if permission is denied
 */
export function requirePermission(userRole: UserRole, permission: Permission): void {
  if (!hasPermission(userRole, permission)) {
    throw new Error(`Access denied. Required permission: ${permission}. User role: ${userRole}`)
  }
}

/**
 * Check if a user can access a specific route based on their role
 * @param userRole - The user's role
 * @param route - The route path
 * @returns True if the user can access the route
 */
export function canAccessRoute(userRole: UserRole, route: string): boolean {
  // Define route permissions
  const routePermissions: Record<string, Permission[]> = {
    '/generator': ['GENERATE_CONTENT'],
    '/profiles': ['PROFILE_READ'],
    '/users': ['USER_READ'],
    '/dashboard': ['CONTENT_READ'],
    '/': ['CONTENT_READ'],
  }

  const requiredPermissions = routePermissions[route]
  if (!requiredPermissions) {
    // If route is not defined, allow access for all authenticated users
    return true
  }

  return requiredPermissions.some(permission => hasPermission(userRole, permission))
}