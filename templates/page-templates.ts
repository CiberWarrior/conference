/**
 * Page Templates - Predefined configurations for common page types
 * These templates auto-apply hero layout, colors, and structure
 */

export interface PageTemplate {
  id: string
  name: string
  description: string
  heroLayoutType: 'centered' | 'split'
  heroBackgroundColor?: string
  autoPopulateInfoCards?: boolean // Auto-populate from conference data
  suggestedContent?: string // HTML content suggestion
}

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'venue',
    name: 'Venue',
    description: 'Perfect for venue information with location details',
    heroLayoutType: 'split',
    heroBackgroundColor: '#DC2626', // Red
    autoPopulateInfoCards: true,
    suggestedContent: '<h2>Venue Information</h2><p>Add venue details, address, and directions here.</p>',
  },
  {
    id: 'contact',
    name: 'Contact',
    description: 'Contact page with form-ready structure',
    heroLayoutType: 'centered',
    heroBackgroundColor: '#3B82F6', // Blue
    autoPopulateInfoCards: false,
    suggestedContent: '<h2>Get in Touch</h2><p>Contact information and form will go here.</p>',
  },
  {
    id: 'about',
    name: 'About',
    description: 'About page with split hero layout',
    heroLayoutType: 'split',
    heroBackgroundColor: '#7C3AED', // Purple
    autoPopulateInfoCards: false,
    suggestedContent: '<h2>About the Conference</h2><p>Add information about the conference, organizers, and mission here.</p>',
  },
  {
    id: 'faq',
    name: 'FAQ',
    description: 'Frequently asked questions page',
    heroLayoutType: 'centered',
    heroBackgroundColor: '#059669', // Green
    autoPopulateInfoCards: false,
    suggestedContent: '<h2>Frequently Asked Questions</h2><p>Add your FAQ items here. You can use the FAQ accordion component in the editor.</p>',
  },
  {
    id: 'schedule',
    name: 'Schedule',
    description: 'Event schedule and timeline',
    heroLayoutType: 'centered',
    heroBackgroundColor: '#EA580C', // Orange
    autoPopulateInfoCards: false,
    suggestedContent: '<h2>Conference Schedule</h2><p>Add your schedule and timeline here.</p>',
  },
  {
    id: 'sponsors',
    name: 'Sponsors',
    description: 'Sponsors and partners showcase',
    heroLayoutType: 'centered',
    heroBackgroundColor: '#1E40AF', // Dark Blue
    autoPopulateInfoCards: false,
    suggestedContent: '<h2>Our Sponsors</h2><p>Add sponsor logos and information here.</p>',
  },
  {
    id: 'blank',
    name: 'Blank',
    description: 'Start from scratch with no preset configuration',
    heroLayoutType: 'centered',
    autoPopulateInfoCards: false,
    suggestedContent: '',
  },
]

export function getTemplateById(id: string): PageTemplate | undefined {
  return PAGE_TEMPLATES.find((t) => t.id === id)
}

/**
 * Generate info cards from conference data
 */
export function generateInfoCardsFromConference(conference: {
  start_date?: string | null
  location?: string | null
  venue?: string | null
}): Array<{ label: string; value: string; icon: string }> {
  const cards: Array<{ label: string; value: string; icon: string }> = []

  if (conference.start_date) {
    try {
      const date = new Date(conference.start_date)
      const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
      cards.push({
        label: 'START DATE',
        value: formattedDate,
        icon: 'calendar',
      })
    } catch (e) {
      // Invalid date, skip
    }
  }

  if (conference.location) {
    cards.push({
      label: 'LOCATION',
      value: conference.location,
      icon: 'map-pin',
    })
  }

  if (conference.venue) {
    cards.push({
      label: 'VENUE',
      value: conference.venue,
      icon: 'building',
    })
  }

  return cards
}
