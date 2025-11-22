import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

interface EmailRequest {
  registrationId: string
  email: string
  firstName: string
  lastName: string
  paymentUrl?: string
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

    const { registrationId, email, firstName, lastName, paymentUrl } =
      (await req.json()) as EmailRequest

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

    // Email template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Confirmation</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
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
                <a href="${paymentUrl}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">Complete Payment</a>
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
    `

    const emailText = `
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
    `

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
        subject: 'Conference Registration Confirmation',
        html: emailHtml,
        text: emailText,
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

