/**
 * Toast notification utilities
 * Centralized toast functions for consistent UX
 */

import toast from 'react-hot-toast'

/**
 * Show success toast notification
 */
export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
  })
}

/**
 * Show error toast notification
 */
export const showError = (message: string) => {
  toast.error(message, {
    duration: 5000,
  })
}

/**
 * Show warning toast notification
 */
export const showWarning = (message: string) => {
  toast(message, {
    icon: '⚠️',
    duration: 4000,
    style: {
      background: '#f59e0b',
      color: '#fff',
    },
  })
}

/**
 * Show info toast notification
 */
export const showInfo = (message: string) => {
  toast(message, {
    icon: 'ℹ️',
    duration: 4000,
    style: {
      background: '#3b82f6',
      color: '#fff',
    },
  })
}

/**
 * Show loading toast notification
 * Returns a function to update the toast (success/error)
 */
export const showLoading = (message: string) => {
  return toast.loading(message)
}

/**
 * Update existing toast (useful for loading -> success/error transitions)
 */
export const updateToast = (
  toastId: string,
  type: 'success' | 'error' | 'loading',
  message: string
) => {
  if (type === 'success') {
    toast.success(message, { id: toastId })
  } else if (type === 'error') {
    toast.error(message, { id: toastId })
  } else {
    toast.loading(message, { id: toastId })
  }
}

/**
 * Dismiss toast
 */
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId)
}

/**
 * Show promise toast (loading -> success/error)
 * Useful for async operations
 */
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: Error) => string)
  }
) => {
  return toast.promise(promise, messages)
}

