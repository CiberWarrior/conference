'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, LogIn, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resetEmailSent, setResetEmailSent] = useState(false)

  // Check for success message from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('message') === 'password_reset_success') {
      setError('')
      setSuccess(true)
      // Clear message from URL after showing
      setTimeout(() => {
        router.replace('/auth/admin-login')
        setSuccess(false)
      }, 5000)
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('🔐 Login attempt:', { email })

    try {
      // Call server-side login API to properly set session cookies
      console.log('📡 Calling /api/auth/login...')
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Include cookies in request
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()
      console.log('📥 Login response:', { status: response.status, data })

      if (!response.ok) {
        console.error('❌ Login failed:', data.error)
        setError(data.error || 'Invalid email or password')
        setLoading(false)
        return
      }

      console.log('✅ Login successful! User:', data.user?.email, 'Role:', data.user?.role)
      
      // Show success state
      setSuccess(true)
      setError('')
      
      // IMPORTANT: Set session in client-side Supabase instance
      if (data.session) {
        console.log('🔄 Setting client-side session...')
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        })
        
        if (sessionError) {
          console.error('❌ Failed to set client session:', sessionError.message)
        } else {
          console.log('✅ Client-side session set successfully')
        }
      }
      
      console.log('🚀 Redirecting to dashboard...')
      // Use router.push for smoother navigation with session sync
      router.push('/admin/dashboard')
      router.refresh()
    } catch (error) {
      console.error('❌ Login error:', error)
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
        <div className="absolute top-1/4 left-[10%] w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl"></div>
        <div className="absolute bottom-1/4 right-[10%] w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-3 mb-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-7 h-7 text-white" />
              </div>
            </div>
            <span className="text-2xl font-black text-white">
              MeetFlow
            </span>
          </Link>
          <p className="text-slate-400">Admin Login</p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-white mb-2">Welcome Back</h1>
            <p className="text-slate-400">Sign in to access the admin dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
              <div className="flex items-start gap-3 mb-3">
                <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-green-400">Login successful! Redirecting to dashboard...</p>
              </div>
              <button
                onClick={() => {
                  console.log('🔘 Manual redirect button clicked')
                  window.location.href = '/admin/dashboard'
                }}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors text-sm"
              >
                Click here if not redirected automatically →
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-700/50 space-y-3">
            <button
              onClick={async () => {
                if (!email) {
                  setError('Please enter your email address first')
                  return
                }
                try {
                  setError('')
                  setResetEmailSent(false)
                  const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/auth/reset-password`,
                  })
                  if (error) throw error
                  setResetEmailSent(true)
                } catch (error: any) {
                  setError(error.message || 'Failed to send reset email')
                  setResetEmailSent(false)
                }
              }}
              className="w-full text-sm text-slate-400 hover:text-white transition-colors"
            >
              Forgot password?
            </button>
            {resetEmailSent && (
              <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
                <p className="text-sm text-green-400 text-center">
                  ✓ Password reset email sent! Check your inbox.
                </p>
              </div>
            )}
            <Link
              href="/"
              className="block text-sm text-slate-400 hover:text-white transition-colors text-center"
            >
              ← Back to homepage
            </Link>
          </div>
        </div>

        {/* Beta Note */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Beta Version • Admin Access Only
          </p>
        </div>
      </div>
    </div>
  )
}

