import type { CustomRegistrationField } from '@/types/conference'

export interface FieldShowIf {
  /** Field `name` this condition depends on */
  fieldName: string
  operator?: 'equals' | 'not_equals' | 'contains'
  value: string
}

/**
 * Whether a custom field should be visible given current form values.
 */
export function isFieldVisible(
  field: CustomRegistrationField,
  values: Record<string, unknown>
): boolean {
  const showIf = field.showIf
  if (!showIf?.fieldName) return true

  const raw = values[showIf.fieldName]
  const current = Array.isArray(raw)
    ? raw.map(String).join(',')
    : raw == null
      ? ''
      : String(raw)
  const expected = String(showIf.value ?? '')
  const op = showIf.operator || 'equals'

  if (op === 'not_equals') return current !== expected
  if (op === 'contains') return current.toLowerCase().includes(expected.toLowerCase())
  return current === expected
}

export function visibleCustomFields(
  fields: CustomRegistrationField[] | undefined,
  values: Record<string, unknown>
): CustomRegistrationField[] {
  if (!fields?.length) return []
  return fields.filter((f) => isFieldVisible(f, values))
}
