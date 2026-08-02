'use client'

import { useCallback, useState } from 'react'
import Sidebar from '@/components/admin/Sidebar'
import Header from '@/components/admin/Header'
import { ConferenceProvider } from '@/contexts/ConferenceContext'
import { AuthProvider } from '@/contexts/AuthContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleMobileClose = useCallback(() => {
    setMobileOpen(false)
  }, [])

  return (
    <AuthProvider>
      <ConferenceProvider>
        <div className="min-h-screen bg-gray-50">
          <div className="flex min-h-screen">
            <Sidebar mobileOpen={mobileOpen} onMobileClose={handleMobileClose} />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="sticky top-0 z-30">
                <Header onMenuClick={() => setMobileOpen(true)} />
              </div>
              <main className="flex-1 bg-gray-50">
                <div className="mx-auto max-w-7xl p-4 sm:p-6">{children}</div>
              </main>
            </div>
          </div>
        </div>
      </ConferenceProvider>
    </AuthProvider>
  )
}
