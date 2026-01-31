/**
 * Shared map and helper for translating custom registration field labels
 * (admin settings list + public registration form). Keys match admin.conferences in messages.
 */
export const FIELD_NAME_TO_LABEL_KEY: Record<string, string> = {
  first_name: 'fieldLabelFirstName',
  firstname: 'fieldLabelFirstName',
  'first name': 'fieldLabelFirstName',
  last_name: 'fieldLabelLastName',
  lastname: 'fieldLabelLastName',
  'last name': 'fieldLabelLastName',
  country: 'fieldLabelCountry',
  title: 'fieldLabelTitle',
  gender: 'fieldLabelGender',
  email: 'fieldLabelEmail',
  participant_email: 'fieldLabelParticipantEmail',
  participantemail: 'fieldLabelParticipantEmail',
  'participant email': 'fieldLabelParticipantEmail',
  organization: 'fieldLabelOrganization',
  organisation: 'fieldLabelOrganization',
  department: 'fieldLabelDepartment',
  odsjek: 'fieldLabelDepartment',
  address: 'fieldLabelAddress',
  adresa: 'fieldLabelAddress',
  city: 'fieldLabelCity',
  grad: 'fieldLabelCity',
  zip: 'fieldLabelZipPostalCode',
  postal_code: 'fieldLabelZipPostalCode',
  postalcode: 'fieldLabelZipPostalCode',
  'zip or postal code': 'fieldLabelZipPostalCode',
  'postal code': 'fieldLabelZipPostalCode',
  state: 'fieldLabelStateProv',
  state_prov: 'fieldLabelStateProv',
  stateprov: 'fieldLabelStateProv',
  'state/prov': 'fieldLabelStateProv',
  province: 'fieldLabelStateProv',
  pokrajina: 'fieldLabelStateProv',
  država: 'fieldLabelStateProv',
  phone: 'fieldLabelPhoneNumber',
  phone_number: 'fieldLabelPhoneNumber',
  phonenumber: 'fieldLabelPhoneNumber',
  'phone number': 'fieldLabelPhoneNumber',
  telefon: 'fieldLabelPhoneNumber',
  gala_dinner: 'fieldLabelGalaDinner',
  galadinner: 'fieldLabelGalaDinner',
  'gala dinner': 'fieldLabelGalaDinner',
  'galla dinner': 'fieldLabelGalaDinner',
  'please select if you will attend gala dinner': 'fieldLabelGalaDinner',
  'please select if you will attend galla dinner': 'fieldLabelGalaDinner',
  svečana_večera: 'fieldLabelGalaDinner',
  accompanying_persons: 'fieldLabelAccompanyingPersons',
  accompanyingpersons: 'fieldLabelAccompanyingPersons',
  'accompanying persons': 'fieldLabelAccompanyingPersons',
  'accompanying person': 'fieldLabelAccompanyingPersons',
  osobe_u_pratnji: 'fieldLabelAccompanyingPersons',
}

/**
 * Returns the i18n key for a field (admin.conferences.*) or null if no mapping.
 * Used by admin CollapsibleFieldEditor and public ParticipantManager (registration form).
 */
export function getTranslatedFieldLabelKey(
  name: string | undefined,
  label: string | undefined
): string | null {
  const normalizedName = name ? name.toLowerCase().trim().replace(/\s+/g, ' ') : ''
  const normalizedNameUnderscore = normalizedName.replace(/\s+/g, '_')
  const normalizedLabel = label ? label.toLowerCase().trim().replace(/\s+/g, ' ') : ''
  const keyByName =
    FIELD_NAME_TO_LABEL_KEY[normalizedNameUnderscore] ?? FIELD_NAME_TO_LABEL_KEY[normalizedName]
  if (keyByName) return keyByName
  const keyByLabel =
    FIELD_NAME_TO_LABEL_KEY[normalizedLabel] ??
    FIELD_NAME_TO_LABEL_KEY[normalizedLabel.replace(/\s+/g, '_')]
  return keyByLabel ?? null
}
