# Subscription System - Full Automation Flow

## Overview

MeetFlow Conference Platform koristi **Full Automation** subscription model za onboarding novih Conference Admin klijenata. Sistem automatski:

1. Kreira Stripe Payment Link
2. Procesira plaćanja
3. Kreira Conference Admin korisničke račune
4. Šalje login credentials
5. Aktivira subscription

## Arhitektura

```
Potencijalni Klijent
       ↓
Kontakt Forma (/)
       ↓
Contact Inquiry (baza)
       ↓
Super Admin pregled (/admin/inquiries)
       ↓
"Send Payment Offer" button
       ↓
Stripe Payment Link generiran
       ↓
Klijent prima email s Payment Link
       ↓
Klijent plaća (Stripe Checkout)
       ↓
Stripe Webhook (checkout.session.completed)
       ↓
Auto-kreiranje Conference Admin usera
       ↓
Email s login credentials
       ↓
Klijent se logira (/auth/admin-login)
       ↓
Pristup dashboardu (/admin/dashboard)
```

## Database Schema

### Subscription Plans

```sql
subscription_plans:
- id (UUID)
- name (Basic, Professional, Enterprise)
- slug
- price_monthly
- price_yearly
- max_conferences
- max_registrations_per_conference
- features (JSON)
- stripe_price_id_monthly
- stripe_price_id_yearly
```

**Default Plans:**

| Plan | Monthly | Yearly | Conferences | Registrations | Features |
|------|---------|--------|-------------|---------------|----------|
| Basic | €49 | €490 | 1 | 500 | Basic analytics, Email support, QR check-in |
| Professional | €99 | €990 | 5 | 2,000 | Advanced analytics, Priority support, Custom branding |
| Enterprise | €249 | €2,490 | Unlimited | Unlimited | Dedicated support, API access, White-label |

### Subscriptions

```sql
subscriptions:
- id (UUID)
- user_id (Conference Admin)
- plan_id
- status (active, past_due, canceled, expired, trialing)
- billing_cycle (monthly, yearly)
- price
- stripe_subscription_id
- starts_at
- expires_at
```

### Payment Offers

```sql
payment_offers:
- id (UUID)
- inquiry_id
- plan_id
- stripe_payment_link_id
- stripe_payment_link_url
- status (sent, paid, expired, canceled)
- custom_price (optional)
- discount_percent (optional)
```

## API Endpoints

### 1. GET /api/admin/subscription-plans

Dohvaća sve aktivne subscription planove.

**Response:**
```json
{
  "plans": [
    {
      "id": "uuid",
      "name": "Professional",
      "price_monthly": 99.00,
      "price_yearly": 990.00,
      "max_conferences": 5,
      "features": ["..."]
    }
  ]
}
```

### 2. POST /api/admin/payment-offers

Kreira payment offer i generira Stripe Payment Link.

**Request:**
```json
{
  "inquiryId": "uuid",
  "planId": "uuid",
  "billingCycle": "yearly",
  "customPrice": 850.00,  // optional
  "discountPercent": 10   // optional
}
```

**Response:**
```json
{
  "success": true,
  "offerId": "uuid",
  "paymentLinkUrl": "https://buy.stripe.com/...",
  "message": "Payment offer created successfully"
}
```

### 3. POST /api/stripe-webhook

Stripe webhook endpoint za procesiranje payment events.

**Events:**
- `checkout.session.completed` - Procesira subscription payment
- `payment_intent.succeeded` - Conference registration payments

## Workflow - Korak po Korak

### 1. Lead Generation

Potencijalni klijent popunjava kontakt formu na homepage-u ili `/contact`:

```tsx
// Forma sadrži:
- Name
- Email
- Organization
- Phone (optional)
- Conference Type
- Expected Attendees
- Message
```

Inquiry se sprema u `contact_inquiries` tablicu sa statusom `new`.

### 2. Super Admin Review

Super Admin otvara `/admin/inquiries` i vidi:

- Sve inquiries
- Status (new, contacted, qualified, converted, rejected)
- Priority (low, medium, high, urgent)
- Stats i analytics

### 3. Slanje Payment Offer

Super Admin:

1. Klikne na inquiry za detalje
2. Klikne "Send Payment Offer" button
3. Otvori se modal:
   - Odabere subscription plan (Basic/Pro/Enterprise)
   - Odabere billing cycle (monthly/yearly)
   - Opcionalno: Custom price
   - Opcionalno: Discount %
4. Klikne "Generate & Send Offer"

**Što se događa u pozadini:**

```typescript
// POST /api/admin/payment-offers
1. Validira podatke
2. Kreira Stripe Payment Link:
   - Line item s planom i cijenom
   - Metadata s inquiry_id, plan_id, customer info
   - Redirect URL na /subscription/success
3. Sprema offer u payment_offers tablicu
4. Ažurira inquiry status na "qualified"
5. Šalje email klijentu s Payment Link-om
6. Kopira Payment Link u clipboard
```

### 4. Klijent Plaća

Klijent:

1. Dobije email s Payment Link-om
2. Klikne na link → Stripe Checkout stranica
3. Unese detalje kartice
4. Potvrdi plaćanje

### 5. Auto-Kreiranje Usera (Webhook)

Stripe šalje `checkout.session.completed` event na webhook:

```typescript
// POST /api/stripe-webhook
1. Verificira webhook signature
2. Dohvaća inquiry i plan detalje
3. Provjerava postoji li user s tim email-om
4. Ako NE postoji:
   a. Generira secure password
   b. Kreira Supabase Auth usera
   c. Kreira user_profiles zapis (role: conference_admin)
   d. Šalje welcome email s credentials
5. Kreira subscription zapis:
   - user_id
   - plan_id
   - status: active
   - stripe_subscription_id
   - starts_at, expires_at
6. Ažurira payment_offer status na "paid"
7. Označava inquiry kao "converted"
```

### 6. Klijent Dobije Access

Klijent:

1. Dobije email s:
   - Login URL: `/auth/admin-login`
   - Temporary password
   - Upute
2. Logira se
3. Dobije pristup `/admin/dashboard`
4. Može kreirati svoje konferencije

## Email Templates

### Payment Offer Email

```
Subject: Your MeetFlow Subscription Offer

Hi [Name],

Thank you for your interest in MeetFlow Conference Platform!

We're excited to offer you the [Plan Name] subscription:
- [Feature 1]
- [Feature 2]
- ...

Price: €[Price] / [billing cycle]

Click below to complete your subscription:
[Payment Link Button]

Best regards,
MeetFlow Team
```

### Welcome Email (Auto-sent after payment)

```
Subject: Welcome to MeetFlow! Your Account is Ready

Hi [Name],

Welcome to MeetFlow Conference Platform! 🎉

Your account has been successfully created. Here are your login credentials:

Login URL: https://meetflow.com/auth/admin-login
Email: [email]
Temporary Password: [password]

IMPORTANT: Please change your password after your first login.

What's next?
1. Log in to your dashboard
2. Create your first conference
3. Customize your conference settings
4. Start accepting registrations

Need help? Visit our documentation or contact support@meetflow.com

Best regards,
MeetFlow Team
```

## Stripe Configuration

### Required Stripe Products

Kreiraj Stripe Products za svaki plan:

```bash
# Basic Plan
stripe products create \
  --name "MeetFlow Basic" \
  --description "Perfect for small conferences"

# Dodaj recurring price
stripe prices create \
  --product [PRODUCT_ID] \
  --unit-amount 4900 \
  --currency eur \
  --recurring interval=month

stripe prices create \
  --product [PRODUCT_ID] \
  --unit-amount 49000 \
  --currency eur \
  --recurring interval=year
```

### Webhook Setup

1. Idi na Stripe Dashboard → Webhooks
2. Dodaj endpoint: `https://your-domain.com/api/stripe-webhook`
3. Odaberi events:
   - `checkout.session.completed`
   - `payment_intent.succeeded` (za conference registrations)
4. Kopiraj Webhook Secret u `.env`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Environment Variables

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase (za admin operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Testing

### Local Testing s Stripe CLI

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3003/api/stripe-webhook

# Test payment
stripe payment_links create \
  --line-items '[{"price":"price_xxx","quantity":1}]'
```

### Test Flow

1. Kreiraj test inquiry u `/admin/inquiries`
2. Klikni "Send Payment Offer"
3. Kopiraj Payment Link
4. Otvori u inkognito modu
5. Koristi Stripe test karticu: `4242 4242 4242 4242`
6. Provjeri webhook logs
7. Provjeri je li user kreiran
8. Provjeri email (log ili mailhog)
9. Pokušaj login s credentials

## Security

### Password Generation

```typescript
function generateSecurePassword(): string {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  const values = crypto.getRandomValues(new Uint8Array(length))
  for (let i = 0; i < length; i++) {
    password += charset[values[i] % charset.length]
  }
  return password
}
```

### Webhook Verification

```typescript
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  webhookSecret
)
```

## Monitoring

### Key Metrics

1. **Conversion Rate**: New inquiries → Paid subscriptions
2. **Payment Success Rate**: Sent offers → Completed payments
3. **Auto-Creation Success Rate**: Payments → Active users
4. **Email Delivery Rate**: Welcome emails sent vs delivered

### Logs

```typescript
log.info('Subscription created successfully', {
  subscriptionId,
  userId,
  inquiryId,
  planId,
})
```

Provjeravaj logs u production za:
- Failed user creations
- Failed email deliveries
- Webhook errors
- Payment failures

## Troubleshooting

### User nije kreiran nakon plaćanja

1. Provjeri webhook logs u Stripe Dashboard
2. Provjeri application logs
3. Provjeri je li webhook event stigao
4. Ručno kreiraj usera preko `/admin/users/new`

### Email nije stigao

1. Provjeri spam folder
2. Provjeri email logs
3. Ručno pošalji credentials preko Support

### Subscription nije aktivna

1. Provjeri `subscriptions` tablicu
2. Provjeri `status` i `expires_at`
3. Ručno ažuriraj status ako treba

## Future Enhancements

1. **Subscription Management Dashboard** za Conference Admins
2. **Usage Tracking** (broj konferencija, registracija)
3. **Upgrade/Downgrade** flow
4. **Cancel Subscription** flow
5. **Invoice History** stranica
6. **Payment Method Update**
7. **Trial Period** (14-day free trial)
8. **Referral Program**

## Support

Za pitanja ili probleme:
- Email: support@meetflow.com
- Documentation: /docs
- Admin Dashboard: /admin/inquiries

