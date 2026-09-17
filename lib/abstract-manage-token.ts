import { createHash, randomBytes } from 'crypto'
import { createAdminClient } from '@/lib/supabase-admin'

export function hashAbstractManageToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/**
 * Create a self-service token for an abstract and return the raw token (only the hash is stored).
 */
export async function createAbstractManageToken(
  abstractId: string,
  expiresInDays = 365
): Promise<string> {
  const supabase = createAdminClient()
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiresInDays)

  const { error } = await supabase.from('abstract_manage_tokens').insert({
    abstract_id: abstractId,
    token_hash: hashAbstractManageToken(token),
    expires_at: expiresAt.toISOString(),
  })

  if (error) throw error
  return token
}

function appBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

export function buildAbstractManageUrl(slug: string, token: string): string {
  return `${appBaseUrl()}/conferences/${slug}/my-abstract?token=${token}`
}

export function buildAbstractReviseUrl(slug: string, token: string): string {
  return `${appBaseUrl()}/conferences/${slug}/revise-abstract?token=${token}`
}

/**
 * Issue a fresh self-service link. Tokens are stored hashed, so an existing token
 * can never be re-read — every email that needs a link mints a new one.
 * Returns null instead of throwing so email flows never break a write operation.
 */
async function issueAbstractTokenUrl(
  abstractId: string,
  slug: string,
  buildUrl: (slug: string, token: string) => string
): Promise<string | null> {
  try {
    const token = await createAbstractManageToken(abstractId)
    return buildUrl(slug, token)
  } catch {
    return null
  }
}

export async function issueAbstractManageUrl(
  abstractId: string,
  slug: string
): Promise<string | null> {
  return issueAbstractTokenUrl(abstractId, slug, buildAbstractManageUrl)
}

export async function issueAbstractReviseUrl(
  abstractId: string,
  slug: string
): Promise<string | null> {
  return issueAbstractTokenUrl(abstractId, slug, buildAbstractReviseUrl)
}

export async function resolveAbstractManageToken(token: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('abstract_manage_tokens')
    .select('*, abstract:abstracts(*)')
    .eq('token_hash', hashAbstractManageToken(token))
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error || !data) return null

  await supabase
    .from('abstract_manage_tokens')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)

  return data
}
