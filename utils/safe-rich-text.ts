// Phase 1 conference pages use plain text content.
// We render it safely by escaping HTML and applying minimal formatting:
// - Preserve line breaks
// - Linkify http(s) URLs

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function linkify(input: string): string {
  // Basic URL matcher (safe because we escape first, then inject controlled <a> tags)
  const urlRegex = /(https?:\/\/[^\s<]+)/g
  return input.replace(urlRegex, (url) => {
    const safeUrl = url.replace(/"/g, '%22')
    return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-700 underline">${url}</a>`
  })
}

export function renderSafeTextToHtml(text: string): string {
  const escaped = escapeHtml(text || '')
  const linked = linkify(escaped)
  // Preserve line breaks
  return linked.replace(/\n/g, '<br />')
}

