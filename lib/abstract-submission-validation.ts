export function validateAbstractTextFields(params: {
  abstractTitle?: string | null
  abstractContent?: string | null
  abstractKeywords?: string | null
}): { ok: true } | { ok: false; error: string; details?: string } {
  const title = params.abstractTitle?.trim() || ''
  if (!title) {
    return { ok: false, error: 'Abstract title is required' }
  }

  const content = params.abstractContent?.trim() || ''
  if (!content) {
    return { ok: false, error: 'Abstract content is required' }
  }

  const contentLength = content.length
  if (contentLength < 1000) {
    return {
      ok: false,
      error: 'Abstract content is too short',
      details: `Current: ${contentLength} characters. Minimum: 1000 characters.`,
    }
  }
  if (contentLength > 2000) {
    return {
      ok: false,
      error: 'Abstract content is too long',
      details: `Current: ${contentLength} characters. Maximum: 2000 characters.`,
    }
  }

  const keywordsRaw = params.abstractKeywords?.trim() || ''
  if (!keywordsRaw) {
    return { ok: false, error: 'Keywords are required' }
  }

  const keywords = keywordsRaw.split(',').map((k) => k.trim()).filter(Boolean)
  if (keywords.length < 5) {
    return {
      ok: false,
      error: 'Please enter at least 5 keywords',
      details: `Current: ${keywords.length}`,
    }
  }

  return { ok: true }
}
