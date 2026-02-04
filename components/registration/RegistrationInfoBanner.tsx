'use client'

interface RegistrationInfoBannerProps {
  infoText: string
}

export default function RegistrationInfoBanner({ infoText }: RegistrationInfoBannerProps) {
  if (!infoText?.trim()) return null

  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-sm">
      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: infoText }} />
    </div>
  )
}
