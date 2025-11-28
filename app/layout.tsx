import type { Metadata } from 'next'
import './globals.css'
import ConditionalNavigation from '@/components/ConditionalNavigation'

export const metadata: Metadata = {
  title: 'MeetFlow | Event Management Platform',
  description: 'Professional event management platform for conferences. Registration, payment processing, and abstract management all in one place.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ConditionalNavigation />
        {children}
      </body>
    </html>
  )
}

