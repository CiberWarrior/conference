'use client'

import Sidebar from '@/components/admin/Sidebar'
import Header from '@/components/admin/Header'
import { ConferenceProvider } from '@/contexts/ConferenceContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Note: Auth checking is done at the page level (not layout level)
  // to avoid issues with login page being wrapped in this layout
  
  return (
    <ConferenceProvider>
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <div className="flex flex-col flex-1 overflow-hidden">
            <Header />
            <main className="flex-1 overflow-y-auto bg-gray-50">
              <div className="p-6 max-w-7xl mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </ConferenceProvider>
  )
}

