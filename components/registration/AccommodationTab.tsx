'use client'

import type { ReactNode } from 'react'

interface AccommodationTabProps {
  children?: ReactNode
}

export default function AccommodationTab({ children }: AccommodationTabProps) {
  return children ?? null
}
