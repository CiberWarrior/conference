/**
 * Extract contact details from a registration across legacy columns,
 * custom_data, and participants[0].customFields.
 */
export function extractRegistrationContact(reg: Record<string, any>): {
  email: string
  firstName: string
  lastName: string
} {
  const customData = reg.custom_data || {}
  const firstParticipant =
    Array.isArray(reg.participants) && reg.participants.length > 0
      ? reg.participants[0]?.customFields ?? {}
      : {}

  const pick = (keys: string[]): string => {
    for (const source of [reg, customData, firstParticipant]) {
      for (const key of keys) {
        const value = source?.[key]
        if (value != null && String(value).trim()) return String(value).trim()
      }
    }
    return ''
  }

  return {
    email: pick(['email', 'Email', 'E-mail', 'e_mail', 'EMAIL']),
    firstName: pick(['first_name', 'firstName', 'First Name', 'ime', 'Ime']),
    lastName: pick([
      'last_name',
      'lastName',
      'Last Name',
      'prezime',
      'Prezime',
      'surname',
    ]),
  }
}

export function registrationDisplayName(reg: Record<string, any>): string {
  const { firstName, lastName, email } = extractRegistrationContact(reg)
  const name = `${firstName} ${lastName}`.trim()
  return name || email || 'Participant'
}
