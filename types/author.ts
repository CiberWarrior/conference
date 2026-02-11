// Author type for abstract submissions
export interface Author {
  firstName?: string
  lastName?: string
  email?: string
  affiliation?: string
  country?: string
  city?: string
  isCorresponding?: boolean
  order?: number
  customFields?: Record<string, any>
}
