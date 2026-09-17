import type { CustomRegistrationField } from '@/types/conference'
import type { Participant, ParticipantSettings } from '@/types/participant'
import { isFieldVisible } from '@/lib/form-visibility'

export interface ParticipantValidationError {
  code:
    | 'min_participants'
    | 'max_participants'
    | 'field_required'
    | 'duplicate_email'
    | 'accompanying_target_required'
    | 'accompanying_invalid_target'
  participantIndex?: number
  fieldLabel?: string
  email?: string
  min?: number
  max?: number
}

const EMAIL_KEY_PATTERN = /email|e-mail|e_mail/i

export function extractParticipantEmail(
  participant: Pick<Participant, 'customFields'>
): string {
  const fields = participant.customFields || {}
  for (const [key, value] of Object.entries(fields)) {
    if (!EMAIL_KEY_PATTERN.test(key)) continue
    const email = String(value ?? '').trim().toLowerCase()
    if (email.includes('@')) return email
  }
  return ''
}

export function getParticipantDisplayName(
  participant: Pick<Participant, 'customFields'>,
  fallback: string
): string {
  const fields = participant.customFields || {}
  const first =
    fields.first_name ||
    fields.firstName ||
    fields['First Name'] ||
    fields.ime ||
    fields.Ime ||
    ''
  const last =
    fields.last_name ||
    fields.lastName ||
    fields['Last Name'] ||
    fields.prezime ||
    fields.Prezime ||
    ''
  const name = `${first} ${last}`.trim()
  return name || fallback
}

function isEmptyRequiredValue(field: CustomRegistrationField, value: unknown): boolean {
  if (field.type === 'checkbox') return value !== true
  if (value === undefined || value === null || value === '') return true
  if (Array.isArray(value) && value.length === 0) return true
  return false
}

export function validateParticipantsInput(
  participants: Participant[],
  customFields: CustomRegistrationField[],
  participantSettings?: Partial<ParticipantSettings> | null
): ParticipantValidationError | null {
  const min = Math.max(1, participantSettings?.minParticipants ?? 1)
  const max = Math.max(min, participantSettings?.maxParticipants ?? 5)
  const requireUniqueEmails = participantSettings?.requireUniqueEmails !== false

  if (participants.length < min) {
    return { code: 'min_participants', min }
  }
  if (participants.length > max) {
    return { code: 'max_participants', max }
  }

  for (let i = 0; i < participants.length; i++) {
    const participant = participants[i]
    const values = participant.customFields || {}

    for (const field of customFields) {
      if (field.type === 'separator' || !field.required) continue
      if (!isFieldVisible(field, values)) continue
      if (isEmptyRequiredValue(field, values[field.name])) {
        return {
          code: 'field_required',
          participantIndex: i,
          fieldLabel: field.label || field.name,
        }
      }
    }

    if (participant.isAccompanying) {
      const target = participant.accompanyingForIndex
      if (target === null || target === undefined) {
        return { code: 'accompanying_target_required', participantIndex: i }
      }
      if (
        target < 0 ||
        target >= participants.length ||
        target === i ||
        participants[target]?.isAccompanying
      ) {
        return { code: 'accompanying_invalid_target', participantIndex: i }
      }
    }
  }

  if (requireUniqueEmails) {
    const seen = new Map<string, number>()
    for (let i = 0; i < participants.length; i++) {
      const email = extractParticipantEmail(participants[i])
      if (!email) continue
      if (seen.has(email)) {
        return { code: 'duplicate_email', participantIndex: i, email }
      }
      seen.set(email, i)
    }
  }

  return null
}
