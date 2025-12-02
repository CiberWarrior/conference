'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { Conference } from '@/types/conference'

interface ConferenceContextType {
  currentConference: Conference | null
  conferences: Conference[]
  loading: boolean
  setCurrentConference: (conference: Conference | null) => void
  refreshConferences: () => Promise<void>
}

export const ConferenceContext = createContext<ConferenceContextType | undefined>(undefined)

export function ConferenceProvider({ children }: { children: React.ReactNode }) {
  const [currentConference, setCurrentConferenceState] = useState<Conference | null>(null)
  const [conferences, setConferences] = useState<Conference[]>([])
  const [loading, setLoading] = useState(true)

  // Load conferences on mount
  useEffect(() => {
    loadConferences()
  }, [])

  // Load current conference from localStorage on mount
  useEffect(() => {
    const savedConferenceId = localStorage.getItem('current_conference_id')
    if (savedConferenceId && conferences.length > 0) {
      const conference = conferences.find((c) => c.id === savedConferenceId)
      if (conference) {
        setCurrentConferenceState(conference)
      } else if (conferences.length > 0) {
        // If saved conference not found, use first one
        setCurrentConferenceState(conferences[0])
        localStorage.setItem('current_conference_id', conferences[0].id)
      }
    } else if (conferences.length > 0 && !currentConference) {
      // No saved conference, use first one
      setCurrentConferenceState(conferences[0])
      localStorage.setItem('current_conference_id', conferences[0].id)
    }
  }, [conferences])

  const loadConferences = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/conferences')
      const data = await response.json()

      if (response.ok) {
        setConferences(data.conferences || [])
      } else {
        console.error('Failed to load conferences:', data.error)
      }
    } catch (error) {
      console.error('Error loading conferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const setCurrentConference = (conference: Conference | null) => {
    setCurrentConferenceState(conference)
    if (conference) {
      localStorage.setItem('current_conference_id', conference.id)
    } else {
      localStorage.removeItem('current_conference_id')
    }
  }

  const refreshConferences = async () => {
    await loadConferences()
  }

  return (
    <ConferenceContext.Provider
      value={{
        currentConference,
        conferences,
        loading,
        setCurrentConference,
        refreshConferences,
      }}
    >
      {children}
    </ConferenceContext.Provider>
  )
}

export function useConference() {
  const context = useContext(ConferenceContext)
  if (context === undefined) {
    throw new Error('useConference must be used within a ConferenceProvider')
  }
  return context
}

