'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { UserProfile, UserRole } from '@/lib/auth-utils'
import { getCurrentUserProfile, updateLastLogin } from '@/lib/auth-utils'

interface AuthContextType {
  user: any | null
  profile: UserProfile | null
  role: UserRole | null
  loading: boolean
  isSuperAdmin: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
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
      console.log('🔄 AuthContext: Loading profile for user:', userId)
      const userProfile = await getCurrentUserProfile()
      console.log('✅ AuthContext: Profile loaded:', userProfile?.email, 'Role:', userProfile?.role)
      setProfile(userProfile)
      
      // Update last login
      if (userProfile) {
        await updateLastLogin(userId)
      }
    } catch (error) {
      console.error('❌ AuthContext: Error loading user profile:', error)
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
        console.log('🔐 AuthContext: Checking session...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('📋 AuthContext: Session found:', !!session, 'User:', session?.user?.email)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await loadUserProfile(session.user.id)
        } else {
          console.log('⚠️ AuthContext: No session found')
        }
      } catch (error) {
        console.error('❌ AuthContext: Error checking session:', error)
      } finally {
        console.log('✅ AuthContext: Loading complete')
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
          console.log('🚪 AuthContext: User signed out, redirecting to login')
          router.push('/auth/admin-login')
        } else if (event === 'SIGNED_IN') {
          console.log('✅ AuthContext: User signed in:', session?.user?.email)
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
      router.push('/auth/admin-login')
    } catch (error) {
      console.error('Error signing out:', error)
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


