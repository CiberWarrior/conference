import Stripe from 'stripe'

// Stripe is optional - only initialize if key is provided
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-11-20.acacia',
    })
  : null

export interface CreateCheckoutSessionParams {
  registrationId: string
  email: string
  amount: number
  currency?: string
}

export async function createCheckoutSession({
  registrationId,
  email,
  amount,
  currency = 'eur',
}: CreateCheckoutSessionParams) {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.')
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency,
          product_data: {
            name: 'Conference Registration',
            description: 'Registration fee for conference',
          },
          unit_amount: amount * 100, // Convert to cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    customer_email: email,
    success_url: `${appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}?canceled=true`,
    metadata: {
      registrationId,
    },
  })

  return session
}

