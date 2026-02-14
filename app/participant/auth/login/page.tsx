'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Participants do not login; only conference admins and super admin do.
// Redirect to the single admin login form (Conference Admin Login).
export default function ParticipantLoginPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/auth/admin-login')
  }, [router])
  return null
}
