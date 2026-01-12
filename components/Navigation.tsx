'use client'

import Link from 'next/link'
import { Building2, LogIn } from 'lucide-react'

export default function Navigation() {
  return (
    <nav className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo - Left */}
          <Link
            href="/"
            className="group flex items-center gap-3 transition-all duration-300"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-violet-600 bg-clip-text text-transparent group-hover:from-blue-700 group-hover:via-purple-700 group-hover:to-violet-700 transition-all duration-300">
              MeetFlow
            </span>
          </Link>

          {/* Navigation Links - Right */}
          <div className="flex items-center gap-4">
            {/* Sign Up Link */}
            <Link
              href="/participant/auth/signup"
              className="text-gray-600 hover:text-blue-600 transition-colors font-medium"
            >
              Sign up
            </Link>

            {/* Login Button (Participant) */}
            <Link
              href="/participant/auth/login"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
            >
              <LogIn className="w-5 h-5" />
              <span className="font-medium">Login</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

