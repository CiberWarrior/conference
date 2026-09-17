// Author type for abstract submissions
export interface Author {
  firstName?: string
  lastName?: string
  email?: string
  /** One entry per institution the author is affiliated with */
  affiliations?: string[]
  /** Legacy single-institution field; still read for abstracts submitted before multi-affiliation support */
  affiliation?: string
  country?: string
  city?: string
  orcid?: string
  isCorresponding?: boolean
  order?: number
  customFields?: Record<string, any>
}
