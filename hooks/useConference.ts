/**
 * Custom hook for conference context
 * Provides easy access to conference selection state
 */

import { useContext } from 'react'
import { ConferenceContext } from '@/contexts/ConferenceContext'

export function useConference() {
  const context = useContext(ConferenceContext)

  if (!context) {
    throw new Error('useConference must be used within a ConferenceProvider')
  }

  return context
}

