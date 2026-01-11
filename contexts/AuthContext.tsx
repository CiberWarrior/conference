'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { UserProfile, UserRole } from '@/lib/auth-utils'
import { log } from '@/lib/logger'

interface AuthContextType {
  user: any | null
  profile: UserProfile | null
  role: UserRole | null
  loading: boolean
  isSuperAdmin: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  // Impersonation
  isImpersonating: boolean
  impersonatedProfile: UserProfile | null
  originalProfile: UserProfile | null
  startImpersonation: (userId: string) => Promise<void>
  stopImpersonation: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  isSuperAdmin: false,
  signOut: async () => {},
  refreshProfile: async () => {},
  isImpersonating: false,
  impersonatedProfile: null,
  originalProfile: null,
  startImpersonation: async () => {},
  stopImpersonation: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [impersonatedProfile, setImpersonatedProfile] = useState<UserProfile | null>(null)
  const [originalProfile, setOriginalProfile] = useState<UserProfile | null>(null)
  const router = useRouter()

  const loadUserProfile = async (userId: string) => {
    try {
      log.debug('Loading user profile', { userId })
      
      // Directly query user_profiles instead of using getCurrentUserProfile()
      // because we're in client context and already have the session
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        log.error('Error fetching user profile', error, {
          userId,
          context: 'AuthContext',
        })
        setProfile(null)
        return
      }
      
      log.debug('User profile loaded', {
        userId,
        email: userProfile?.email,
        role: userProfile?.role,
      })
      setProfile(userProfile)
      
      // Update last login
      if (userProfile) {
        await supabase
          .from('user_profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userId)
      }
    } catch (error) {
      log.error('Error loading user profile', error, {
        userId,
        context: 'AuthContext',
      })
      setProfile(null)
    }
  }

  const refreshProfile = async () => {
    if (user?.id) {
      await loadUserProfile(user.id)
    }
  }

  // Load impersonated user profile
  const loadImpersonatedProfile = async (userId: string) => {
    try {
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        log.error('Error fetching impersonated user profile', error, {
          userId,
          context: 'AuthContext',
        })
        return null
      }

      return userProfile as UserProfile
    } catch (error) {
      log.error('Error loading impersonated profile', error, {
        userId,
        context: 'AuthContext',
      })
      return null
    }
  }

  // Start impersonation
  const startImpersonation = async (userId: string) => {
    try {
      // Save original profile if not already saved
      if (!originalProfile && profile) {
        setOriginalProfile(profile)
      }

      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start impersonation')
      }

      // Save original profile before starting impersonation (if not already saved)
      if (profile && !originalProfile) {
        setOriginalProfile(profile)
        log.debug('Original profile saved', {
          originalUserId: profile.id,
          originalEmail: profile.email,
        })
      }

      // Load the impersonated user's profile
      const impersonated = await loadImpersonatedProfile(userId)
      if (impersonated) {
        setImpersonatedProfile(impersonated)
        // Store impersonation in localStorage so ConferenceContext can use it
        localStorage.setItem('impersonate_user_id', userId)
        log.info('Impersonation started', {
          impersonatedUserId: userId,
          impersonatedEmail: impersonated.email,
        })
        // Refresh conferences to show impersonated user's conferences
        window.location.reload()
      }
    } catch (error) {
      log.error('Error starting impersonation', error, {
        userId,
        context: 'AuthContext',
      })
      throw error
    }
  }

  // Stop impersonation
  const stopImpersonation = async () => {
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to stop impersonation')
      }

      setImpersonatedProfile(null)
      setOriginalProfile(null)
      // Remove impersonation from localStorage
      localStorage.removeItem('impersonate_user_id')
      log.info('Impersonation stopped', {
        context: 'AuthContext',
      })
      // Refresh to show original super admin view
      window.location.reload()
    } catch (error) {
      log.error('Error stopping impersonation', error, {
        context: 'AuthContext',
      })
      throw error
    }
  }

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      try {
        log.debug('Checking session', { context: 'AuthContext' })
        const { data: { session } } = await supabase.auth.getSession()
        log.debug('Session check result', {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
        })
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserProfile(session.user.id)
          
          // Check if impersonation is active (from localStorage)
          const impersonateUserId = localStorage.getItem('impersonate_user_id')
          if (impersonateUserId) {
            log.debug('Restoring impersonation state', {
              impersonateUserId,
              context: 'AuthContext',
            })
            // Save original profile before loading impersonated one
            const currentProfile = await supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
            
            if (currentProfile.data && currentProfile.data.role === 'super_admin') {
              setOriginalProfile(currentProfile.data)
              // Load impersonated profile
              const impersonated = await loadImpersonatedProfile(impersonateUserId)
              if (impersonated) {
                setImpersonatedProfile(impersonated)
                log.info('Impersonation state restored', {
                  impersonatedUserId: impersonated.id,
                  impersonatedEmail: impersonated.email,
                })
              } else {
                // Invalid impersonation, clear it
                localStorage.removeItem('impersonate_user_id')
              }
            } else {
              // Not super admin, clear impersonation
              localStorage.removeItem('impersonate_user_id')
            }
          }
        } else {
          log.debug('No session found', { context: 'AuthContext' })
        }
      } catch (error) {
        log.error('Error checking session', error, {
          context: 'AuthContext',
        })
      } finally {
        log.debug('AuthContext loading complete')
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserProfile(session.user.id)
        } else {
          setProfile(null)
        }
        
        setLoading(false)

        // Only redirect on explicit sign out, NOT on initial load or session missing
        if (event === 'SIGNED_OUT') {
          log.info('User signed out', {
            context: 'AuthContext',
            event: 'SIGNED_OUT',
          })
          router.push('/auth/admin-login')
        } else if (event === 'SIGNED_IN') {
          log.info('User signed in', {
            userId: session?.user?.id,
            email: session?.user?.email,
            context: 'AuthContext',
            event: 'SIGNED_IN',
          })
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [router])

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
      log.info('User signed out', {
        context: 'AuthContext',
        action: 'signOut',
      })
      router.push('/auth/admin-login')
    } catch (error) {
      log.error('Error signing out', error, {
        context: 'AuthContext',
        action: 'signOut',
      })
    }
  }

  // Use impersonated profile if impersonating, otherwise use actual profile
  const activeProfile = impersonatedProfile || profile
  const isImpersonating = !!impersonatedProfile
  // Always check original profile (or current profile if not impersonating) for super admin status
  const actualProfile = originalProfile || profile

  const value = {
    user,
    profile: activeProfile, // Return impersonated profile when impersonating
    role: activeProfile?.role || null,
    loading,
    isSuperAdmin: actualProfile?.role === 'super_admin' && actualProfile?.active === true,
    signOut,
    refreshProfile,
    isImpersonating,
    impersonatedProfile,
    originalProfile: originalProfile || profile, // Original profile (super admin)
    startImpersonation,
    stopImpersonation,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}


