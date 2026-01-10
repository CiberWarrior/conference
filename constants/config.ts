/**
 * Application configuration constants
 * Environment-specific and app-wide configuration
 */

export const APP_CONFIG = {
  name: 'MeetFlow',
  description: 'Conference Management Platform',
  version: '0.1.0',
} as const

export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const

export const UI_CONFIG = {
  toastDuration: 3000, // 3 seconds
  debounceDelay: 300, // 300ms
  animationDuration: 200, // 200ms
} as const

export const STORAGE_CONFIG = {
  sessionStoragePrefix: 'meetflow_',
  localStoragePrefix: 'meetflow_',
} as const

// External Abstract Management Application URL
// Set this to your abstract management application URL
export const ABSTRACT_APP_URL = process.env.NEXT_PUBLIC_ABSTRACT_APP_URL || 'https://abstracts.meetflow.com'