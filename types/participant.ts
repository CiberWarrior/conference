export interface Participant {
  customFields: Record<string, any> // All participant data is stored in custom fields
}

export interface ParticipantSettings {
  enabled: boolean
  minParticipants: number
  maxParticipants: number
  requireUniqueEmails: boolean
  participantFields: string[] // DEPRECATED: kept for backward compatibility
  customFieldsPerParticipant: boolean // Always true now
  participantLabel?: string // e.g., "Participant", "Attendee", "Delegate"
}

export const DEFAULT_PARTICIPANT_SETTINGS: ParticipantSettings = {
  enabled: false,
  minParticipants: 1,
  maxParticipants: 5,
  requireUniqueEmails: true,
  participantFields: [], // Not used anymore
  customFieldsPerParticipant: true,
  participantLabel: 'Participant',
}
