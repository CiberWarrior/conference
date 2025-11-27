import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'

export default async function AdminPage() {
  // Check if user is authenticated
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    // Not logged in -> redirect to login
    redirect('/auth/admin-login')
  }

  // Logged in -> redirect to dashboard
  redirect('/admin/dashboard')
}
