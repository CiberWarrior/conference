/**
 * Email helper functions for sending different types of emails
 * Uses Supabase Edge Function: send-confirmation-email
 */

import { log } from './logger'

type EmailType =
  | 'registration_confirmation'
  | 'payment_confirmation'
  | 'payment_reminder'
  | 'pre_conference_reminder'
  | 'event_details'
  | 'certificate'
  | 'abstract_submission_confirmation'
  | 'subscription_welcome'
  | 'payment_offer'

interface SendEmailParams {
  emailType: EmailType
  registrationId?: string
  email: string
  firstName?: string
  lastName?: string
  paymentUrl?: string
  invoiceUrl?: string
  certificateUrl?: string
  conferenceDate?: string
  conferenceLocation?: string
  conferenceProgram?: string
  customMessage?: string
  abstractId?: string
  fileName?: string
  conferenceName?: string
  // Subscription-related
  loginUrl?: string
  tempPassword?: string
  planName?: string
  paymentLinkUrl?: string
}

/**
 * Send email using Supabase Edge Function
 * This function should be called from server-side code (API routes)
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    log.error('Supabase URL or Service Role Key not configured', undefined, {
      function: 'sendEmail',
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceRoleKey,
    })
    return
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-confirmation-email`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify(params),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      log.error('Failed to send email', new Error(error), {
        emailType: params.emailType,
        email: params.email,
        function: 'sendEmail',
      })
      throw new Error(`Failed to send email: ${error}`)
    }

    const result = await response.json()
    log.info('Email sent successfully', {
      emailType: params.emailType,
      email: params.email,
      messageId: result.messageId,
    })
  } catch (error) {
    log.error('Error sending email', error, {
      emailType: params.emailType,
      email: params.email,
      function: 'sendEmail',
    })
    throw error
  }
}

/**
 * Send generic email (for contact forms, notifications, etc.)
 */
export async function sendGenericEmail(params: {
  to: string
  subject: string
  html: string
  text: string
}): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY

  if (!resendApiKey) {
    log.warn('RESEND_API_KEY not configured - email will not be sent', {
      to: params.to,
      subject: params.subject,
      function: 'sendGenericEmail',
    })
    // Still log the email for debugging
    console.log('Email would be sent to:', params.to)
    console.log('Subject:', params.subject)
    return
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || 'MeetFlow <noreply@renatahorvat.com>',
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      log.error('Failed to send generic email', new Error(error), {
        to: params.to,
        subject: params.subject,
        function: 'sendGenericEmail',
        status: response.status,
      })
      throw new Error(`Failed to send email: ${error}`)
    }

    const result = await response.json()
    log.info('Generic email sent successfully', {
      to: params.to,
      subject: params.subject,
      messageId: result.id,
      function: 'sendGenericEmail',
    })
  } catch (error) {
    log.error('Error sending generic email', error, {
      to: params.to,
      subject: params.subject,
      function: 'sendGenericEmail',
    })
    throw error
  }
}

/**
 * Send registration confirmation email
 */
export async function sendRegistrationConfirmation(
  registrationId: string,
  email: string,
  firstName: string,
  lastName: string,
  paymentUrl?: string
): Promise<void> {
  return sendEmail({
    emailType: 'registration_confirmation',
    registrationId,
    email,
    firstName,
    lastName,
    paymentUrl,
  })
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmation(
  registrationId: string,
  email: string,
  firstName: string,
  lastName: string,
  invoiceUrl?: string
): Promise<void> {
  return sendEmail({
    emailType: 'payment_confirmation',
    registrationId,
    email,
    firstName,
    lastName,
    invoiceUrl,
  })
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminder(
  registrationId: string,
  email: string,
  firstName: string,
  lastName: string,
  paymentUrl?: string,
  customMessage?: string
): Promise<void> {
  return sendEmail({
    emailType: 'payment_reminder',
    registrationId,
    email,
    firstName,
    lastName,
    paymentUrl,
    customMessage,
  })
}

/**
 * Send pre-conference reminder email
 */
export async function sendPreConferenceReminder(
  registrationId: string,
  email: string,
  firstName: string,
  lastName: string,
  conferenceDate?: string,
  conferenceLocation?: string,
  conferenceProgram?: string,
  customMessage?: string
): Promise<void> {
  return sendEmail({
    emailType: 'pre_conference_reminder',
    registrationId,
    email,
    firstName,
    lastName,
    conferenceDate,
    conferenceLocation,
    conferenceProgram,
    customMessage,
  })
}

/**
 * Send event details email
 */
export async function sendEventDetails(
  registrationId: string,
  email: string,
  firstName: string,
  lastName: string,
  conferenceDate?: string,
  conferenceLocation?: string,
  conferenceProgram?: string,
  customMessage?: string
): Promise<void> {
  return sendEmail({
    emailType: 'event_details',
    registrationId,
    email,
    firstName,
    lastName,
    conferenceDate,
    conferenceLocation,
    conferenceProgram,
    customMessage,
  })
}

/**
 * Send certificate email
 */
export async function sendCertificate(
  registrationId: string,
  email: string,
  firstName: string,
  lastName: string,
  certificateUrl: string,
  customMessage?: string
): Promise<void> {
  return sendEmail({
    emailType: 'certificate',
    registrationId,
    email,
    firstName,
    lastName,
    certificateUrl,
    customMessage,
  })
}

/**
 * Send abstract submission confirmation email
 */
export async function sendAbstractSubmissionConfirmation(
  abstractId: string,
  email: string,
  fileName: string,
  conferenceName?: string,
  customMessage?: string
): Promise<void> {
  return sendEmail({
    emailType: 'abstract_submission_confirmation',
    abstractId,
    email,
    fileName,
    conferenceName,
    customMessage,
  })
}

/**
 * Send welcome email with login credentials (for new Conference Admin users)
 * Used for subscription payments (auto-created accounts)
 */
export async function sendWelcomeEmail(
  email: string,
  fullName: string,
  tempPassword: string,
  planName: string
): Promise<void> {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/admin-login`
  
  return sendEmail({
    emailType: 'subscription_welcome',
    email,
    firstName: fullName,
    tempPassword,
    planName,
    loginUrl,
  })
}

/**
 * Send admin welcome email with login credentials (for manually created Conference Admin accounts)
 * This uses sendGenericEmail directly (Resend API) for better control and simpler implementation
 */
export async function sendAdminWelcomeEmail(
  email: string,
  fullName: string,
  password: string
): Promise<void> {
  const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/admin-login`
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to MeetFlow</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to MeetFlow! 🎉</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="font-size: 16px; margin-bottom: 20px;">Dear ${fullName},</p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Your Conference Admin account has been successfully created! You can now access the MeetFlow dashboard to manage your conferences.
          </p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
            <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">Your Login Credentials:</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Password:</strong> ${password}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${loginUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Access Dashboard
            </a>
          </div>
          
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>⚠️ Security Note:</strong> Please change your password after your first login for security purposes.
            </p>
          </div>
          
          <p style="font-size: 16px; margin-top: 30px;">
            If you have any questions or need assistance, please don't hesitate to contact us.
          </p>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
          <p style="font-size: 12px; color: #6b7280; margin: 0;">
            Best regards,<br>
            MeetFlow Team
          </p>
        </div>
      </body>
    </html>
  `
  
  const emailText = `
Welcome to MeetFlow!

Dear ${fullName},

Your Conference Admin account has been successfully created! You can now access the MeetFlow dashboard to manage your conferences.

Your Login Credentials:
Email: ${email}
Password: ${password}

Access Dashboard: ${loginUrl}

⚠️ Security Note: Please change your password after your first login for security purposes.

If you have any questions or need assistance, please don't hesitate to contact us.

Best regards,
MeetFlow Team
  `
  
  return sendGenericEmail({
    to: email,
    subject: 'Welcome to MeetFlow - Your Conference Admin Account is Ready',
    html: emailHtml,
    text: emailText,
  })
}

/**
 * Send payment offer email with Stripe Payment Link
 */
export async function sendPaymentOfferEmail(
  email: string,
  fullName: string,
  organization: string,
  planName: string,
  billingCycle: 'monthly' | 'yearly',
  price: number,
  currency: string,
  paymentLinkUrl: string
): Promise<void> {
  return sendEmail({
    emailType: 'payment_offer',
    email,
    firstName: fullName,
    planName,
    paymentLinkUrl,
    customMessage: `${planName} Plan - ${billingCycle === 'monthly' ? 'Monthly' : 'Yearly'} billing: ${price} ${currency}`,
  })
}

