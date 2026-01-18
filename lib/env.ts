/**
 * Environment Variables Validation
 * Centralized validation for all environment variables
 * Throws errors if required variables are missing
 */

// Validate URL format
const isValidUrl = (url: string | undefined): boolean => {
  if (!url || url.trim() === '' || url === 'your_supabase_project_url') return false
  try {
    const parsed = new URL(url)
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname !== 'placeholder.supabase.co'
  } catch {
    return false
  }
}

// Validate email format
const isValidEmail = (email: string | undefined): boolean => {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Get and validate environment variable
 * Throws error if required variable is missing or invalid
 */
function getEnv(key: string, required: boolean = true, validator?: (value: string) => boolean): string {
  const value = process.env[key]

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`)
  }

  if (value && validator && !validator(value)) {
    throw new Error(`Invalid environment variable: ${key}`)
  }

  return value || ''
}

/**
 * Validated environment variables
 * Access these instead of process.env directly
 */
export const env = {
  // Supabase Configuration
  SUPABASE_URL: getEnv('NEXT_PUBLIC_SUPABASE_URL', true, isValidUrl),
  SUPABASE_ANON_KEY: getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', true),
  SUPABASE_SERVICE_ROLE_KEY: getEnv('SUPABASE_SERVICE_ROLE_KEY', false),

  // App Configuration
  APP_URL: getEnv('NEXT_PUBLIC_APP_URL', false, isValidUrl),
  NODE_ENV: getEnv('NODE_ENV', false) || 'development',

  // Email Configuration
  ADMIN_EMAIL: getEnv('ADMIN_EMAIL', false, isValidEmail),
  RESEND_API_KEY: getEnv('RESEND_API_KEY', false),

  // Stripe Configuration (optional)
  STRIPE_SECRET_KEY: getEnv('STRIPE_SECRET_KEY', false),
  STRIPE_PUBLISHABLE_KEY: getEnv('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', false),
  STRIPE_WEBHOOK_SECRET: getEnv('STRIPE_WEBHOOK_SECRET', false),

  // Upstash Redis (optional - for rate limiting)
  UPSTASH_REDIS_REST_URL: getEnv('UPSTASH_REDIS_REST_URL', false, isValidUrl),
  UPSTASH_REDIS_REST_TOKEN: getEnv('UPSTASH_REDIS_REST_TOKEN', false),
} as const

/**
 * Check if all required environment variables are set
 * Use this in development to warn about missing variables
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
  const missing: string[] = []

  try {
    // Test required variables
    getEnv('NEXT_PUBLIC_SUPABASE_URL', true, isValidUrl)
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', true)
  } catch (error) {
    if (error instanceof Error) {
      missing.push(error.message.replace('Missing required environment variable: ', ''))
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  }
}

/**
 * Check if optional services are configured
 */
export const isConfigured = {
  supabase: isValidUrl(env.SUPABASE_URL) && !!env.SUPABASE_ANON_KEY,
  email: !!env.RESEND_API_KEY && !!env.ADMIN_EMAIL,
  stripe: !!env.STRIPE_SECRET_KEY && !!env.STRIPE_PUBLISHABLE_KEY,
  rateLimit: !!env.UPSTASH_REDIS_REST_URL && !!env.UPSTASH_REDIS_REST_TOKEN,
} as const
