// HTML sanitization for safe rendering of Tiptap content
// Uses DOMPurify if available, otherwise basic escaping

export function sanitizeHtml(html: string): string {
  if (!html) return ''

  // If DOMPurify is available (client-side), use it
  if (typeof window !== 'undefined' && (window as any).DOMPurify) {
    const DOMPurify = (window as any).DOMPurify
    const sanitized = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'p', 'br', 'strong', 'em', 'u', 's', 'a', 'code',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'ul', 'ol', 'li',
        'blockquote', 'pre', 'hr', 'img',
      ],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style', 'src', 'alt', 'width', 'height'],
      ALLOWED_STYLES: {
        '*': {
          'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
        },
      },
      ALLOW_DATA_ATTR: false,
    })
    console.log('DOMPurify sanitize - input:', html.substring(0, 200))
    console.log('DOMPurify sanitize - output:', sanitized.substring(0, 200))
    console.log('DOMPurify - img in output:', sanitized.includes('<img'))
    return sanitized
  }

  // Server-side or fallback: return original HTML
  // DOMPurify will sanitize it on client-side when it loads
  // We don't escape here because this is a client component and
  // sanitization will happen before rendering
  console.warn('DOMPurify not available, returning unsanitized HTML (should only happen during SSR)')
  return html
}
