import StatusBadge, { type StatusBadgeTone } from '@/components/admin/StatusBadge'

interface PaymentMethodBadgeProps {
  method?: string | null
  labels: {
    card: string
    bankTransfer: string
    cash: string
    other: string
    unknown: string
  }
}

export default function PaymentMethodBadge({
  method,
  labels,
}: PaymentMethodBadgeProps) {
  const normalized = (method || '').toLowerCase()

  let tone: StatusBadgeTone = 'neutral'
  let label = labels.unknown

  if (normalized === 'card') {
    tone = 'info'
    label = labels.card
  } else if (normalized === 'bank_transfer') {
    tone = 'warning'
    label = labels.bankTransfer
  } else if (normalized === 'cash') {
    tone = 'neutral'
    label = labels.cash
  } else if (normalized === 'other') {
    tone = 'neutral'
    label = labels.other
  } else if (!normalized) {
    return <span className="text-xs text-gray-400">—</span>
  }

  return <StatusBadge tone={tone}>{label}</StatusBadge>
}
