import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendGenericEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      email,
      organization,
      phone,
      conferenceType,
      expectedAttendees,
      message,
    } = body

    // Validate required fields
    if (!name || !email || !organization || !message) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get client IP and user agent for tracking
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Save to database
    const { data: inquiry, error: dbError } = await supabase
      .from('contact_inquiries')
      .insert({
        name,
        email,
        organization,
        phone: phone || null,
        conference_type: conferenceType || null,
        expected_attendees: expectedAttendees || null,
        message,
        status: 'new',
        priority: determinePriority(expectedAttendees, conferenceType),
        source: 'website',
        ip_address: ip,
        user_agent: userAgent,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to save inquiry' },
        { status: 500 }
      )
    }

    // Send notification email to admin
    try {
      await sendInquiryNotificationEmail(inquiry)
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError)
      // Don't fail the request if email fails
    }

    // Send confirmation email to customer
    try {
      await sendCustomerConfirmationEmail(inquiry)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Thank you for your inquiry! We will contact you within 24 hours.',
        inquiryId: inquiry.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// Determine priority based on inquiry details
function determinePriority(expectedAttendees: string, conferenceType: string): string {
  // Large conferences get higher priority
  if (expectedAttendees === '500+' || expectedAttendees === '251-500') {
    return 'high'
  }
  
  // Hybrid conferences are complex, medium-high priority
  if (conferenceType === 'hybrid') {
    return 'high'
  }

  // Medium conferences
  if (expectedAttendees === '101-250') {
    return 'medium'
  }

  // Small conferences
  return 'medium'
}

// Send notification email to admin team
async function sendInquiryNotificationEmail(inquiry: any) {
  const subject = `🔔 New Inquiry: ${inquiry.organization} - ${inquiry.expected_attendees || 'Size not specified'}`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .field { margin-bottom: 20px; }
          .label { font-weight: bold; color: #4b5563; display: block; margin-bottom: 5px; }
          .value { background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb; }
          .priority { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
          .priority-high { background: #fee2e2; color: #dc2626; }
          .priority-medium { background: #fef3c7; color: #d97706; }
          .priority-low { background: #dbeafe; color: #2563eb; }
          .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">🎯 New Lead Inquiry</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">A potential client has submitted a contact inquiry</p>
          </div>
          <div class="content">
            <div class="field">
              <span class="label">Priority:</span>
              <span class="priority priority-${inquiry.priority}">${inquiry.priority.toUpperCase()}</span>
            </div>

            <div class="field">
              <span class="label">Contact Person:</span>
              <div class="value">${inquiry.name}</div>
            </div>

            <div class="field">
              <span class="label">Email:</span>
              <div class="value"><a href="mailto:${inquiry.email}">${inquiry.email}</a></div>
            </div>

            <div class="field">
              <span class="label">Organization:</span>
              <div class="value">${inquiry.organization}</div>
            </div>

            ${inquiry.phone ? `
              <div class="field">
                <span class="label">Phone:</span>
                <div class="value">${inquiry.phone}</div>
              </div>
            ` : ''}

            ${inquiry.conference_type ? `
              <div class="field">
                <span class="label">Conference Type:</span>
                <div class="value">${formatConferenceType(inquiry.conference_type)}</div>
              </div>
            ` : ''}

            ${inquiry.expected_attendees ? `
              <div class="field">
                <span class="label">Expected Attendees:</span>
                <div class="value">${inquiry.expected_attendees}</div>
              </div>
            ` : ''}

            <div class="field">
              <span class="label">Message:</span>
              <div class="value" style="white-space: pre-wrap;">${inquiry.message}</div>
            </div>

            <div class="field">
              <span class="label">Submitted:</span>
              <div class="value">${new Date(inquiry.created_at).toLocaleString()}</div>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/inquiries" class="button">
                View in Admin Panel →
              </a>
            </div>
          </div>
          <div class="footer">
            <p>This is an automated notification from MeetFlow</p>
            <p>Please respond to this inquiry within 24 hours</p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
New Inquiry Received

Priority: ${inquiry.priority.toUpperCase()}
Name: ${inquiry.name}
Email: ${inquiry.email}
Organization: ${inquiry.organization}
${inquiry.phone ? `Phone: ${inquiry.phone}` : ''}
${inquiry.conference_type ? `Conference Type: ${formatConferenceType(inquiry.conference_type)}` : ''}
${inquiry.expected_attendees ? `Expected Attendees: ${inquiry.expected_attendees}` : ''}

Message:
${inquiry.message}

Submitted: ${new Date(inquiry.created_at).toLocaleString()}

View in admin panel: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/inquiries
  `

  // Send to admin email (you should configure this in your environment variables)
  const adminEmail = process.env.ADMIN_EMAIL || 'info@meetflow.com'
  
  await sendGenericEmail({
    to: adminEmail,
    subject,
    html,
    text,
  })
}

// Send confirmation email to customer
async function sendCustomerConfirmationEmail(inquiry: any) {
  const subject = `Thank you for contacting MeetFlow`
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          .highlight { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 32px;">✅ We Received Your Inquiry</h1>
            <p style="margin: 15px 0 0 0; opacity: 0.95; font-size: 16px;">Thank you for your interest in MeetFlow</p>
          </div>
          <div class="content">
            <p>Dear ${inquiry.name},</p>
            
            <p>Thank you for reaching out to us! We have received your inquiry about our conference management platform.</p>

            <div class="highlight">
              <p style="margin: 0; font-weight: bold;">⏱️ What happens next?</p>
              <p style="margin: 10px 0 0 0;">Our team will review your requirements and get back to you <strong>within 24 hours</strong> (usually much sooner!).</p>
            </div>

            <p><strong>Your inquiry details:</strong></p>
            <ul>
              <li>Organization: ${inquiry.organization}</li>
              ${inquiry.conference_type ? `<li>Conference Type: ${formatConferenceType(inquiry.conference_type)}</li>` : ''}
              ${inquiry.expected_attendees ? `<li>Expected Attendees: ${inquiry.expected_attendees}</li>` : ''}
            </ul>

            <p>In the meantime, feel free to explore our <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}">platform features</a> or check out our <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}#features">documentation</a>.</p>

            <p>If you have any urgent questions, you can reply directly to this email.</p>

            <p style="margin-top: 30px;">Best regards,<br><strong>The MeetFlow Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated confirmation email</p>
            <p>MeetFlow - Modern Conference Management Platform</p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Dear ${inquiry.name},

Thank you for reaching out to us! We have received your inquiry about our conference management platform.

What happens next?
Our team will review your requirements and get back to you within 24 hours (usually much sooner!).

Your inquiry details:
- Organization: ${inquiry.organization}
${inquiry.conference_type ? `- Conference Type: ${formatConferenceType(inquiry.conference_type)}` : ''}
${inquiry.expected_attendees ? `- Expected Attendees: ${inquiry.expected_attendees}` : ''}

If you have any urgent questions, you can reply directly to this email.

Best regards,
The MeetFlow Team

---
MeetFlow - Modern Conference Management Platform
  `

  await sendGenericEmail({
    to: inquiry.email,
    subject,
    html,
    text,
  })
}

function formatConferenceType(type: string): string {
  const types: Record<string, string> = {
    'virtual': 'Virtual Conference',
    'hybrid': 'Hybrid Conference',
    'onsite': 'On-site Conference',
    'other': 'Other',
  }
  return types[type] || type
}


