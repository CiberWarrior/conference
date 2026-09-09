'use client'

import { useState } from 'react'
import Sidebar from '@/components/admin/Sidebar'
import Header from '@/components/admin/Header'
import { ConferenceProvider } from '@/contexts/ConferenceContext'
import { AuthProvider } from '@/contexts/AuthContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <AuthProvider>
      <ConferenceProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="flex h-screen overflow-hidden">
            <Sidebar
              mobileOpen={mobileNavOpen}
              onClose={() => setMobileNavOpen(false)}
            />
            <div className="flex flex-col flex-1 overflow-hidden min-w-0">
              <div className="flex-shrink-0">
                <Header onMenuClick={() => setMobileNavOpen(true)} />
              </div>
              <main className="flex-1 overflow-y-auto bg-gray-50 min-h-0">
                <div className="p-4 sm:p-6 max-w-7xl mx-auto">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </div>
      </ConferenceProvider>
    </AuthProvider>
  )
}
