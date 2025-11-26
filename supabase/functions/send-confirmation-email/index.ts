import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

type EmailType =
  | 'registration_confirmation'
  | 'payment_confirmation'
  | 'payment_reminder'
  | 'pre_conference_reminder'
  | 'event_details'
  | 'certificate'

interface EmailRequest {
  emailType: EmailType
  registrationId: string
  email: string
  firstName: string
  lastName: string
  paymentUrl?: string
  invoiceUrl?: string
  certificateUrl?: string
  conferenceDate?: string
  conferenceLocation?: string
  conferenceProgram?: string
  customMessage?: string
}

serve(async (req) => {
  try {
    // CORS headers
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST',
          'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        },
      })
    }

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not set')
    }

    const {
      emailType = 'registration_confirmation',
      registrationId,
      email,
      firstName,
      lastName,
      paymentUrl,
      invoiceUrl,
      certificateUrl,
      conferenceDate,
      conferenceLocation,
      conferenceProgram,
      customMessage,
    } = (await req.json()) as EmailRequest

    if (!email || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Email template generator function
    const generateEmailTemplate = (type: EmailType) => {
      const baseStyles = `
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      `
      const containerStyles = `
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 8px;
      `
      const buttonStyles = `
        display: inline-block;
        padding: 12px 24px;
        background-color: #2563eb;
        color: white;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        margin-top: 10px;
      `

      switch (type) {
        case 'registration_confirmation':
          return {
            subject: 'Conference Registration Confirmation',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Registration Confirmation</title>
                </head>
                <body style="${baseStyles}">
                  <div style="${containerStyles}">
                    <h1 style="color: #2563eb; margin-top: 0;">Registration Confirmed!</h1>
                    <p>Dear ${firstName} ${lastName},</p>
                    <p>Thank you for registering for the conference. Your registration has been successfully received.</p>
                    <p><strong>Registration ID:</strong> ${registrationId}</p>
                    ${
                      paymentUrl
                        ? `
                      <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-left: 4px solid #2563eb; border-radius: 4px;">
                        <p style="margin: 0 0 10px 0;"><strong>Payment Required</strong></p>
                        <p style="margin: 0 0 15px 0;">Please complete your payment to finalize your registration:</p>
                        <a href="${paymentUrl}" style="${buttonStyles}">Complete Payment</a>
                      </div>
                    `
                        : `
                      <p>You will receive further information about the conference via email.</p>
                    `
                    }
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="font-size: 12px; color: #6b7280; margin: 0;">
                      If you have any questions, please contact us.
                    </p>
                  </div>
                </body>
              </html>
            `,
            text: `
Registration Confirmed!

Dear ${firstName} ${lastName},

Thank you for registering for the conference. Your registration has been successfully received.

Registration ID: ${registrationId}
${
              paymentUrl
                ? `\nPayment Required\nPlease complete your payment: ${paymentUrl}`
                : '\nYou will receive further information about the conference via email.'
            }

If you have any questions, please contact us.
            `,
          }

        case 'payment_confirmation':
          return {
            subject: 'Payment Confirmed - Conference Registration',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Payment Confirmed</title>
                </head>
                <body style="${baseStyles}">
                  <div style="${containerStyles}">
                    <h1 style="color: #10b981; margin-top: 0;">Payment Confirmed! ✅</h1>
                    <p>Dear ${firstName} ${lastName},</p>
                    <p>Thank you for your payment! Your registration for the conference is now complete.</p>
                    <p><strong>Registration ID:</strong> ${registrationId}</p>
                    ${
                      invoiceUrl
                        ? `
                      <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-left: 4px solid #10b981; border-radius: 4px;">
                        <p style="margin: 0 0 10px 0;"><strong>Invoice Available</strong></p>
                        <p style="margin: 0 0 15px 0;">You can download your invoice:</p>
                        <a href="${invoiceUrl}" style="${buttonStyles}">Download Invoice</a>
                      </div>
                    `
                        : ''
                    }
                    <p>You will receive further information about the conference, including event details and schedule, via email.</p>
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="font-size: 12px; color: #6b7280; margin: 0;">
                      If you have any questions, please contact us.
                    </p>
                  </div>
                </body>
              </html>
            `,
            text: `
Payment Confirmed!

Dear ${firstName} ${lastName},

Thank you for your payment! Your registration for the conference is now complete.

Registration ID: ${registrationId}
${invoiceUrl ? `\nInvoice: ${invoiceUrl}` : ''}

You will receive further information about the conference via email.

If you have any questions, please contact us.
            `,
          }

        case 'payment_reminder':
          return {
            subject: 'Reminder: Complete Your Conference Registration Payment',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Payment Reminder</title>
                </head>
                <body style="${baseStyles}">
                  <div style="${containerStyles}">
                    <h1 style="color: #f59e0b; margin-top: 0;">Payment Reminder ⏰</h1>
                    <p>Dear ${firstName} ${lastName},</p>
                    <p>This is a friendly reminder that your conference registration is pending payment completion.</p>
                    <p><strong>Registration ID:</strong> ${registrationId}</p>
                    ${
                      paymentUrl
                        ? `
                      <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-left: 4px solid #f59e0b; border-radius: 4px;">
                        <p style="margin: 0 0 10px 0;"><strong>Complete Your Payment</strong></p>
                        <p style="margin: 0 0 15px 0;">Please complete your payment to secure your spot at the conference:</p>
                        <a href="${paymentUrl}" style="${buttonStyles}">Complete Payment Now</a>
                      </div>
                    `
                        : ''
                    }
                    ${customMessage ? `<p>${customMessage}</p>` : ''}
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="font-size: 12px; color: #6b7280; margin: 0;">
                      If you have already made your payment, please ignore this email. If you have any questions, please contact us.
                    </p>
                  </div>
                </body>
              </html>
            `,
            text: `
Payment Reminder

Dear ${firstName} ${lastName},

This is a friendly reminder that your conference registration is pending payment completion.

Registration ID: ${registrationId}
${paymentUrl ? `\nComplete your payment: ${paymentUrl}` : ''}
${customMessage ? `\n${customMessage}` : ''}

If you have already made your payment, please ignore this email. If you have any questions, please contact us.
            `,
          }

        case 'pre_conference_reminder':
          return {
            subject: `Reminder: Conference ${conferenceDate ? `on ${conferenceDate}` : 'Soon'}`,
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Conference Reminder</title>
                </head>
                <body style="${baseStyles}">
                  <div style="${containerStyles}">
                    <h1 style="color: #2563eb; margin-top: 0;">Conference Reminder 📅</h1>
                    <p>Dear ${firstName} ${lastName},</p>
                    <p>We're looking forward to seeing you at the conference!</p>
                    <p><strong>Registration ID:</strong> ${registrationId}</p>
                    ${
                      conferenceDate
                        ? `<p><strong>Date:</strong> ${conferenceDate}</p>`
                        : ''
                    }
                    ${
                      conferenceLocation
                        ? `<p><strong>Location:</strong> ${conferenceLocation}</p>`
                        : ''
                    }
                    ${
                      conferenceProgram
                        ? `
                      <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-left: 4px solid #2563eb; border-radius: 4px;">
                        <p style="margin: 0 0 10px 0;"><strong>Conference Program</strong></p>
                        <div style="white-space: pre-wrap;">${conferenceProgram}</div>
                      </div>
                    `
                        : ''
                    }
                    ${customMessage ? `<p>${customMessage}</p>` : ''}
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="font-size: 12px; color: #6b7280; margin: 0;">
                      If you have any questions, please contact us. We look forward to seeing you!
                    </p>
                  </div>
                </body>
              </html>
            `,
            text: `
Conference Reminder

Dear ${firstName} ${lastName},

We're looking forward to seeing you at the conference!

Registration ID: ${registrationId}
${conferenceDate ? `Date: ${conferenceDate}` : ''}
${conferenceLocation ? `Location: ${conferenceLocation}` : ''}
${conferenceProgram ? `\nProgram:\n${conferenceProgram}` : ''}
${customMessage ? `\n${customMessage}` : ''}

If you have any questions, please contact us. We look forward to seeing you!
            `,
          }

        case 'event_details':
          return {
            subject: 'Conference Event Details',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Event Details</title>
                </head>
                <body style="${baseStyles}">
                  <div style="${containerStyles}">
                    <h1 style="color: #2563eb; margin-top: 0;">Conference Event Details 📋</h1>
                    <p>Dear ${firstName} ${lastName},</p>
                    <p>Here are the important details for the upcoming conference:</p>
                    <p><strong>Registration ID:</strong> ${registrationId}</p>
                    ${
                      conferenceDate
                        ? `<p><strong>Date:</strong> ${conferenceDate}</p>`
                        : ''
                    }
                    ${
                      conferenceLocation
                        ? `<p><strong>Location:</strong> ${conferenceLocation}</p>`
                        : ''
                    }
                    ${
                      conferenceProgram
                        ? `
                      <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-left: 4px solid #2563eb; border-radius: 4px;">
                        <p style="margin: 0 0 10px 0;"><strong>Conference Program</strong></p>
                        <div style="white-space: pre-wrap;">${conferenceProgram}</div>
                      </div>
                    `
                        : ''
                    }
                    ${customMessage ? `<p>${customMessage}</p>` : ''}
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="font-size: 12px; color: #6b7280; margin: 0;">
                      If you have any questions, please contact us.
                    </p>
                  </div>
                </body>
              </html>
            `,
            text: `
Conference Event Details

Dear ${firstName} ${lastName},

Here are the important details for the upcoming conference:

Registration ID: ${registrationId}
${conferenceDate ? `Date: ${conferenceDate}` : ''}
${conferenceLocation ? `Location: ${conferenceLocation}` : ''}
${conferenceProgram ? `\nProgram:\n${conferenceProgram}` : ''}
${customMessage ? `\n${customMessage}` : ''}

If you have any questions, please contact us.
            `,
          }

        case 'certificate':
          return {
            subject: 'Your Conference Certificate',
            html: `
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Certificate</title>
                </head>
                <body style="${baseStyles}">
                  <div style="${containerStyles}">
                    <h1 style="color: #10b981; margin-top: 0;">Congratulations! 🎓</h1>
                    <p>Dear ${firstName} ${lastName},</p>
                    <p>We are pleased to inform you that your certificate of participation is ready!</p>
                    <p><strong>Registration ID:</strong> ${registrationId}</p>
                    ${
                      certificateUrl
                        ? `
                      <div style="margin: 20px 0; padding: 15px; background-color: #fff; border-left: 4px solid #10b981; border-radius: 4px;">
                        <p style="margin: 0 0 10px 0;"><strong>Download Your Certificate</strong></p>
                        <p style="margin: 0 0 15px 0;">Click the button below to download your certificate:</p>
                        <a href="${certificateUrl}" style="${buttonStyles}">Download Certificate</a>
                      </div>
                    `
                        : ''
                    }
                    ${customMessage ? `<p>${customMessage}</p>` : ''}
                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    <p style="font-size: 12px; color: #6b7280; margin: 0;">
                      Thank you for your participation in the conference!
                    </p>
                  </div>
                </body>
              </html>
            `,
            text: `
Certificate Ready

Dear ${firstName} ${lastName},

We are pleased to inform you that your certificate of participation is ready!

Registration ID: ${registrationId}
${certificateUrl ? `\nDownload your certificate: ${certificateUrl}` : ''}
${customMessage ? `\n${customMessage}` : ''}

Thank you for your participation in the conference!
            `,
          }

        default:
          throw new Error(`Unknown email type: ${type}`)
      }
    }

    const emailTemplate = generateEmailTemplate(emailType)

    // Send email via Resend API
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Conference Registration <noreply@yourdomain.com>', // Update with your domain
        to: email,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      }),
    })

    if (!resendResponse.ok) {
      const error = await resendResponse.text()
      console.error('Resend API error:', error)
      throw new Error(`Failed to send email: ${error}`)
    }

    const result = await resendResponse.json()

    return new Response(
      JSON.stringify({
        success: true,
        messageId: result.id,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

