/**
 * Permission constants
 * Centralized permission type definitions
 */

export const PERMISSION_TYPES = {
  VIEW_REGISTRATIONS: 'can_view_registrations',
  EXPORT_DATA: 'can_export_data',
  MANAGE_PAYMENTS: 'can_manage_payments',
  MANAGE_ABSTRACTS: 'can_manage_abstracts',
  CHECKIN: 'can_checkin',
  GENERATE_CERTIFICATES: 'can_generate_certificates',
  EDIT_CONFERENCE: 'can_edit_conference',
  DELETE_DATA: 'can_delete_data',
  MANAGE_REGISTRATION_FORM: 'can_manage_registration_form',
  VIEW_ALL_REGISTRATIONS: 'can_view_all_registrations',
  VIEW_ANALYTICS: 'can_view_analytics',
} as const

export type PermissionType =
  (typeof PERMISSION_TYPES)[keyof typeof PERMISSION_TYPES]

export const PERMISSION_LABELS: Record<PermissionType, string> = {
  [PERMISSION_TYPES.VIEW_REGISTRATIONS]: 'View Registrations',
  [PERMISSION_TYPES.EXPORT_DATA]: 'Export Data',
  [PERMISSION_TYPES.MANAGE_PAYMENTS]: 'Manage Payments',
  [PERMISSION_TYPES.MANAGE_ABSTRACTS]: 'Manage Abstracts',
  [PERMISSION_TYPES.CHECKIN]: 'Check-In Participants',
  [PERMISSION_TYPES.GENERATE_CERTIFICATES]: 'Generate Certificates',
  [PERMISSION_TYPES.EDIT_CONFERENCE]: 'Edit Conference Settings',
  [PERMISSION_TYPES.DELETE_DATA]: 'Delete Data',
  [PERMISSION_TYPES.MANAGE_REGISTRATION_FORM]: 'Manage Registration Form',
  [PERMISSION_TYPES.VIEW_ALL_REGISTRATIONS]: 'View All Registrations',
  [PERMISSION_TYPES.VIEW_ANALYTICS]: 'View Analytics',
}

