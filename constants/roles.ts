/**
 * Role constants
 * User role definitions and labels
 */

export const USER_ROLES = {
  SUPER_ADMIN: 'super_admin',
  CONFERENCE_ADMIN: 'conference_admin',
} as const

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES]

export const ROLE_LABELS: Record<UserRole, string> = {
  [USER_ROLES.SUPER_ADMIN]: 'Super Admin',
  [USER_ROLES.CONFERENCE_ADMIN]: 'Conference Admin',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [USER_ROLES.SUPER_ADMIN]:
    'Full platform access. Can manage all conferences and users.',
  [USER_ROLES.CONFERENCE_ADMIN]:
    'Limited access to assigned conferences only. Permissions are set per conference.',
}

