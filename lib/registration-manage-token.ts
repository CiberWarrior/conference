import { createHash, randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/supabase-admin'

export function hashManageToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function generateManageToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Create a manage-token for a registration and return the raw token (store only hash).
 */
export async function createRegistrationManageToken(
  registrationId: string,
  expiresInDays = 180
): Promise<string> {
  const supabase = createAdminClient()
  const token = generateManageToken()
  const tokenHash = hashManageToken(token)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const { error } = await supabase.from('registration_manage_tokens').insert({
    registration_id: registrationId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  })

  if (error) throw error
  return token
}

export function buildManageUrl(slug: string, token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/conferences/${slug}/manage?token=${token}`
}

export async function resolveManageToken(token: string) {
  const supabase = createAdminClient()
  const tokenHash = hashManageToken(token)
  const { data, error } = await supabase
    .from('registration_manage_tokens')
    .select('*, registration:registrations(*)')
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error || !data) return null

  await supabase
    .from('registration_manage_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)

  return data
}
