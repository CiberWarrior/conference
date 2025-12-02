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
  // For now, just log - you can integrate with Resend, SendGrid, etc.
  log.info('Sending generic email', {
    to: params.to,
    subject: params.subject,
    function: 'sendGenericEmail',
  })
  // In production, you would integrate with an email service here
  // Example: await resend.emails.send({ from: 'no-reply@meetflow.com', ...params })
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

