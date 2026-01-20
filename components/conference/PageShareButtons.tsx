'use client'

interface PageShareButtonsProps {
  title: string
  url: string
  description?: string
}

export default function PageShareButtons({ title, url, description }: PageShareButtonsProps) {
  const fullUrl = typeof window !== 'undefined' ? window.location.href : url

  const shareToTwitter = () => {
    const text = encodeURIComponent(title)
    const shareUrl = encodeURIComponent(fullUrl)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`, '_blank')
  }

  const shareToFacebook = () => {
    const shareUrl = encodeURIComponent(fullUrl)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`, '_blank')
  }

  const shareToLinkedIn = () => {
    const shareUrl = encodeURIComponent(fullUrl)
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`, '_blank')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl)
      alert('Link copied to clipboard!')
    } catch (err) {
      alert('Failed to copy link')
    }
  }

  const printPage = () => {
    window.print()
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
      <span className="text-sm font-semibold text-gray-700">Share:</span>
      <button
        onClick={shareToTwitter}
        className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition text-sm font-semibold"
        title="Share on Twitter"
      >
        Twitter
      </button>
      <button
        onClick={shareToFacebook}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-semibold"
        title="Share on Facebook"
      >
        Facebook
      </button>
      <button
        onClick={shareToLinkedIn}
        className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition text-sm font-semibold"
        title="Share on LinkedIn"
      >
        LinkedIn
      </button>
      <button
        onClick={copyLink}
        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm font-semibold"
        title="Copy link"
      >
        Copy Link
      </button>
      <button
        onClick={printPage}
        className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm font-semibold"
        title="Print page"
      >
        Print
      </button>
    </div>
  )
}
