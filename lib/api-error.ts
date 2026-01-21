/**
 * Centralized API Error Handler
 * 
 * Provides consistent error handling across all API routes:
 * - Standardized error response format
 * - Error type categorization
 * - Proper HTTP status codes
 * - Logging integration
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { log } from './logger'

/**
 * Standard error codes used across the application
 */
export const ErrorCodes = {
  // Authentication errors (401)
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Authorization errors (403)
  FORBIDDEN: 'FORBIDDEN',
  ACCESS_DENIED: 'ACCESS_DENIED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Resource errors (404)
  NOT_FOUND: 'NOT_FOUND',
  CONFERENCE_NOT_FOUND: 'CONFERENCE_NOT_FOUND',
  REGISTRATION_NOT_FOUND: 'REGISTRATION_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  
  // Validation errors (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Conflict errors (409)
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Server errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes]

/**
 * Standard API error response format
 */
export interface ApiErrorResponse {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: unknown
  }
}

/**
 * Standard API success response format
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  message?: string
}

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly details?: unknown

  constructor(
    code: ErrorCode,
    message: string,
    statusCode: number = 500,
    details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }

  // Factory methods for common errors
  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(ErrorCodes.UNAUTHORIZED, message, 401)
  }

  static forbidden(message = 'Access denied'): ApiError {
    return new ApiError(ErrorCodes.FORBIDDEN, message, 403)
  }

  static notFound(resource = 'Resource', message?: string): ApiError {
    return new ApiError(
      ErrorCodes.NOT_FOUND,
      message || `${resource} not found`,
      404
    )
  }

  static validationError(message: string, details?: unknown): ApiError {
    return new ApiError(ErrorCodes.VALIDATION_ERROR, message, 400, details)
  }

  static conflict(message = 'Resource already exists'): ApiError {
    return new ApiError(ErrorCodes.DUPLICATE_ENTRY, message, 409)
  }

  static rateLimitExceeded(retryAfter?: number): ApiError {
    return new ApiError(
      ErrorCodes.RATE_LIMIT_EXCEEDED,
      `Too many requests. Please try again ${retryAfter ? `in ${retryAfter} seconds` : 'later'}.`,
      429,
      { retryAfter }
    )
  }

  static internal(message = 'An internal error occurred'): ApiError {
    return new ApiError(ErrorCodes.INTERNAL_ERROR, message, 500)
  }

  static database(message = 'Database operation failed'): ApiError {
    return new ApiError(ErrorCodes.DATABASE_ERROR, message, 500)
  }
}

/**
 * Handle error and return appropriate NextResponse
 */
export function handleApiError(
  error: unknown,
  context?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  // Handle ApiError
  if (error instanceof ApiError) {
    log.warn('API Error', {
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      ...context,
    })

    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.statusCode }
    )
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    log.warn('Validation Error', {
      errors: error.errors,
      ...context,
    })

    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Invalid input data',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
      },
      { status: 400 }
    )
  }

  // Handle standard Error
  if (error instanceof Error) {
    log.error('Unhandled Error', error, context)

    // Don't expose internal error details in production
    const isDev = process.env.NODE_ENV === 'development'

    return NextResponse.json(
      {
        success: false as const,
        error: {
          code: ErrorCodes.INTERNAL_ERROR,
          message: isDev ? error.message : 'An unexpected error occurred',
          details: isDev ? error.stack : undefined,
        },
      },
      { status: 500 }
    )
  }

  // Handle unknown errors
  log.error('Unknown Error', undefined, { error, ...context })

  return NextResponse.json(
    {
      success: false as const,
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 }
  )
}

/**
 * Create a success response
 */
export function apiSuccess<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true as const,
      data,
      message,
    },
    { status }
  )
}

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: ApiErrorResponse | ApiSuccessResponse): response is ApiErrorResponse {
  return response.success === false
}

/**
 * Wrapper function for API route handlers
 * Automatically catches and handles errors
 */
export function withErrorHandler<T>(
  handler: () => Promise<NextResponse<T>>,
  context?: Record<string, unknown>
): Promise<NextResponse<T | ApiErrorResponse>> {
  return handler().catch((error) => handleApiError(error, context))
}
