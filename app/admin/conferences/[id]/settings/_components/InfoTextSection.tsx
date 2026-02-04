'use client'

interface InfoTextSectionProps {
  title: string
  description: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  hint?: string
  rows?: number
}

export default function InfoTextSection(props: InfoTextSectionProps) {
  const { title, description, value, onChange, placeholder = '', hint, rows = 6 } = props
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      />
      {hint ? <p className="mt-2 text-xs text-gray-500">{hint}</p> : null}
    </div>
  )
}
