import StatusBadge, { type StatusBadgeTone } from '@/components/admin/StatusBadge'

interface PaymentStatusBadgeProps {
  status: string
  labels: {
    paid: string
    pending: string
    notRequired: string
  }
}

export default function PaymentStatusBadge({
  status,
  labels,
}: PaymentStatusBadgeProps) {
  const tone: StatusBadgeTone =
    status === 'paid'
      ? 'success'
      : status === 'pending'
        ? 'warning'
        : 'neutral'

  const label =
    status === 'paid'
      ? labels.paid
      : status === 'pending'
        ? labels.pending
        : status === 'not_required'
          ? labels.notRequired
          : status

  return <StatusBadge tone={tone}>{label}</StatusBadge>
}
