export interface SupportTicket {
  id: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: string | null
  conference_id: string | null
  created_by_user_id: string | null
  created_by_email: string | null
  assigned_to_user_id: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface SupportTicketStats {
  open: number
  in_progress: number
  resolved: number
  total: number
}
