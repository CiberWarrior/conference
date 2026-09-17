import type { CustomRegistrationField } from '@/types/conference'

/** Legacy custom_abstract_fields that duplicate built-in Author / Abstract Details sections. */
const COVERED_FIELD_KEYS = [
  'first_name',
  'firstName',
  'first name',
  'ime',
  'last_name',
  'lastName',
  'last name',
  'prezime',
  'surname',
  'email',
  'e-mail',
  'institution',
  'institutions',
  'institucija',
  'affiliation',
  'country',
  'država',
  'drzava',
  'city',
  'grad',
  'orcid',
  'author',
  'authors',
  'autor',
  'autori',
  'abstract',
  'abstrakt',
  'sažetak',
  'sazetak',
  'title',
  'naslov',
  'content',
  'sadržaj',
  'sadrzaj',
  'keywords',
  'ključne riječi',
  'kljucne rijeci',
  'poster',
  'oral',
  'invited',
  'invited speaker',
  'abstract type',
  'tip abstrakta',
  'vrsta abstrakta',
]

/**
 * Custom abstract fields configured in admin that overlap with AuthorManager
 * or the fixed Abstract Details block should not be rendered or validated separately.
 */
export function isCoveredAbstractCustomField(field: CustomRegistrationField): boolean {
  const name = field.name?.toLowerCase() || ''
  const label = field.label?.toLowerCase() || ''

  return COVERED_FIELD_KEYS.some(
    (key) => name.includes(key.toLowerCase()) || label.includes(key.toLowerCase())
  )
}

export function getExtraAbstractCustomFields(
  fields: CustomRegistrationField[] | undefined | null
): CustomRegistrationField[] {
  if (!Array.isArray(fields)) return []
  return fields.filter((field) => field?.type && !isCoveredAbstractCustomField(field))
}

/** Covered (legacy duplicate) fields that should be removed from conference settings. */
export function getCoveredAbstractCustomFields(
  fields: CustomRegistrationField[] | undefined | null
): CustomRegistrationField[] {
  if (!Array.isArray(fields)) return []
  return fields.filter((field) => field?.type && isCoveredAbstractCustomField(field))
}

export function removeCoveredAbstractCustomFields(
  fields: CustomRegistrationField[] | undefined | null
): CustomRegistrationField[] {
  return getExtraAbstractCustomFields(fields)
}
