import type { HotelOption, RegistrationAddon, CustomRegistrationField } from '@/types/conference'
import type { Registration } from '@/types/registration'

export type AccommodationFilter = 'all' | 'with_hotel' | 'with_dates' | 'none'

export interface AccommodationDisplay {
  hotelName: string | null
  hotelId: string | null
  arrivalDate: string | null
  departureDate: string | null
  numberOfNights: number | null
  /** Hotel chosen via accommodation tab */
  hasHotelSelection: boolean
  /** Dates stored in accommodation JSONB */
  hasAccommodationDates: boolean
  /** Dates only from custom form fields (not accommodation JSONB) */
  datesFromFormOnly: boolean
}

export function resolveHotelName(
  hotelId: string | null | undefined,
  hotelOptions?: HotelOption[]
): string | null {
  if (!hotelId) return null
  const hotel = hotelOptions?.find((h) => h.id === hotelId)
  return hotel?.name || hotelId
}

export function getAccommodationDisplay(
  reg: Pick<Registration, 'accommodation' | 'arrivalDate' | 'departureDate'>,
  hotelOptions?: HotelOption[]
): AccommodationDisplay {
  const acc = reg.accommodation
  const accArrival = acc?.arrival_date || null
  const accDeparture = acc?.departure_date || null
  const hotelId = acc?.hotel_id || null

  const hasAccommodationDates = Boolean(accArrival || accDeparture)
  const hasFormDates = Boolean(reg.arrivalDate || reg.departureDate)
  const datesFromFormOnly =
    hasFormDates &&
    !hasAccommodationDates &&
    !(acc && Object.keys(acc).length > 0)

  return {
    hotelName: resolveHotelName(hotelId, hotelOptions),
    hotelId,
    arrivalDate: accArrival || reg.arrivalDate || null,
    departureDate: accDeparture || reg.departureDate || null,
    numberOfNights: acc?.number_of_nights ?? null,
    hasHotelSelection: Boolean(hotelId),
    hasAccommodationDates,
    datesFromFormOnly,
  }
}

export function matchesAccommodationFilter(
  reg: Pick<Registration, 'accommodation' | 'arrivalDate' | 'departureDate'>,
  filter: AccommodationFilter
): boolean {
  if (filter === 'all') return true
  const display = getAccommodationDisplay(reg)
  if (filter === 'with_hotel') return display.hasHotelSelection
  if (filter === 'with_dates') {
    return Boolean(display.arrivalDate || display.departureDate)
  }
  if (filter === 'none') {
    return !display.hasHotelSelection && !display.arrivalDate && !display.departureDate
  }
  return true
}

export function resolveAddonLabels(
  selectedAddons: Array<{ id: string; quantity?: number }> | undefined,
  addonDefs?: RegistrationAddon[]
): string[] {
  if (!selectedAddons?.length) return []
  return selectedAddons.map((item) => {
    const def = addonDefs?.find((a) => a.id === item.id)
    const label = def?.label || def?.name || item.id
    const qty = item.quantity && item.quantity > 1 ? ` ×${item.quantity}` : ''
    return `${label}${qty}`
  })
}

export function formatAdminFieldValue(value: unknown): string {
  if (value === undefined || value === null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.map((v) => formatAdminFieldValue(v)).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function formatAdminDate(value: string | null | undefined, locale?: string): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString(locale === 'hr' ? 'hr-HR' : 'en-US')
  } catch {
    return value
  }
}

/** Collect custom field entries for display, skipping internal payer keys */
export function getCustomFieldEntries(
  reg: Registration,
  fieldDefs: CustomRegistrationField[]
): Array<{ label: string; value: string }> {
  const entries: Array<{ label: string; value: string }> = []
  const seen = new Set<string>()

  const addEntry = (name: string, label: string, value: unknown) => {
    if (seen.has(name)) return
    if (value === undefined || value === null || value === '') return
    seen.add(name)
    entries.push({ label, value: formatAdminFieldValue(value) })
  }

  for (const field of fieldDefs) {
    const fromParticipant = reg.participants?.[0]?.customFields?.[field.name]
    const fromCustomData = reg.customFields?.[field.name]
    addEntry(field.name, field.label, fromParticipant ?? fromCustomData)
  }

  // Any extra keys not in defs (from participants)
  const firstParticipant = reg.participants?.[0]?.customFields || {}
  for (const [key, value] of Object.entries(firstParticipant)) {
    if (seen.has(key)) continue
    const def = fieldDefs.find((f) => f.name === key)
    addEntry(key, def?.label || key, value)
  }

  return entries
}

export function getExportHotelValue(
  reg: Pick<Registration, 'accommodation' | 'arrivalDate' | 'departureDate'>,
  hotelOptions?: HotelOption[]
): string {
  const display = getAccommodationDisplay(reg, hotelOptions)
  if (display.hotelName) return display.hotelName
  if (display.arrivalDate || display.departureDate) {
    if (display.datesFromFormOnly) return 'Form dates only'
    if (display.hasAccommodationDates && !display.hasHotelSelection) return 'Dates without hotel'
  }
  return ''
}
