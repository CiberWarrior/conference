import React from 'react'

export type StatusBadgeTone =
  | 'success'
  | 'warning'
  | 'neutral'
  | 'info'
  | 'violet'
  | 'danger'

const TONE_STYLES: Record<StatusBadgeTone, string> = {
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-800 ring-1 ring-inset ring-amber-600/20',
  neutral: 'bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-500/20',
  info: 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20',
  violet: 'bg-violet-50 text-violet-700 ring-1 ring-inset ring-violet-600/20',
  danger: 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20',
}

interface StatusBadgeProps {
  tone?: StatusBadgeTone
  children: React.ReactNode
  className?: string
}

export default function StatusBadge({
  tone = 'neutral',
  children,
  className = '',
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${TONE_STYLES[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
