/**
 * Caching Utility
 * Uses Upstash Redis for distributed caching
 * 
 * Cache Strategy:
 * - Conference data: 1 hour (rarely changes)
 * - Dashboard stats: 5 minutes (frequently updated)
 * - User permissions: 15 minutes (can change)
 * - Registration counts: 5 minutes
 */

import { Redis } from '@upstash/redis'

// Initialize Redis client
// If Upstash is not configured, caching will be disabled
let redis: Redis | null = null
let isConfigured = false

try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    isConfigured = true
  }
} catch (error) {
  console.warn('Upstash Redis not configured, caching disabled')
}

/**
 * Get cached value
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis || !isConfigured) {
    return null
  }

  try {
    const value = await redis.get<T>(key)
    return value
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

/**
 * Set cached value with TTL (time to live in seconds)
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl: number
): Promise<boolean> {
  if (!redis || !isConfigured) {
    return false
  }

  try {
    await redis.setex(key, ttl, value)
    return true
  } catch (error) {
    console.error('Cache set error:', error)
    return false
  }
}

/**
 * Delete cached value
 */
export async function deleteCache(key: string): Promise<boolean> {
  if (!redis || !isConfigured) {
    return false
  }

  try {
    await redis.del(key)
    return true
  } catch (error) {
    console.error('Cache delete error:', error)
    return false
  }
}

/**
 * Delete multiple cached values by pattern
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  if (!redis || !isConfigured) {
    return 0
  }

  try {
    // Note: Upstash Redis doesn't support KEYS command
    // You need to track keys manually or use a different approach
    // For now, we'll use a simple approach with known patterns
    return 0
  } catch (error) {
    console.error('Cache pattern delete error:', error)
    return 0
  }
}

/**
 * Cache conference data (TTL: 1 hour)
 */
export async function getCachedConference(slug: string) {
  return getCache(`conference:${slug}`)
}

export async function setCachedConference(slug: string, data: any) {
  return setCache(`conference:${slug}`, data, 3600) // 1 hour
}

export async function invalidateConferenceCache(slug: string) {
  return deleteCache(`conference:${slug}`)
}

/**
 * Cache dashboard stats (TTL: 5 minutes)
 */
export async function getCachedDashboardStats(conferenceId: string) {
  return getCache(`dashboard:stats:${conferenceId}`)
}

export async function setCachedDashboardStats(
  conferenceId: string,
  data: any
) {
  return setCache(`dashboard:stats:${conferenceId}`, data, 300) // 5 minutes
}

export async function invalidateDashboardStatsCache(conferenceId: string) {
  return deleteCache(`dashboard:stats:${conferenceId}`)
}

/**
 * Cache user permissions (TTL: 15 minutes)
 */
export async function getCachedUserPermissions(userId: string) {
  return getCache(`user:permissions:${userId}`)
}

export async function setCachedUserPermissions(userId: string, data: any) {
  return setCache(`user:permissions:${userId}`, data, 900) // 15 minutes
}

export async function invalidateUserPermissionsCache(userId: string) {
  return deleteCache(`user:permissions:${userId}`)
}

/**
 * Cache registration count (TTL: 5 minutes)
 */
export async function getCachedRegistrationCount(conferenceId: string) {
  return getCache(`registrations:count:${conferenceId}`)
}

export async function setCachedRegistrationCount(
  conferenceId: string,
  count: number
) {
  return setCache(`registrations:count:${conferenceId}`, count, 300) // 5 minutes
}

export async function invalidateRegistrationCountCache(conferenceId: string) {
  return deleteCache(`registrations:count:${conferenceId}`)
}

/**
 * Helper function to get or set cache
 * If cache miss, calls fetchFn and caches the result
 */
export async function getOrSetCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number
): Promise<T> {
  // Try to get from cache
  const cached = await getCache<T>(key)
  if (cached !== null) {
    return cached
  }

  // Cache miss, fetch data
  const data = await fetchFn()

  // Cache the result (don't wait for it)
  setCache(key, data, ttl).catch((error) => {
    console.error('Failed to cache data:', error)
  })

  return data
}




