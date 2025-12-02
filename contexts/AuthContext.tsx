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
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  loading: true,
  isSuperAdmin: false,
  signOut: async () => {},
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
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

  const value = {
    user,
    profile,
    role: profile?.role || null,
    loading,
    isSuperAdmin: profile?.role === 'super_admin' && profile?.active === true,
    signOut,
    refreshProfile,
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


