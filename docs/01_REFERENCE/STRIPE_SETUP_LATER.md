# Stripe Setup - Postaviti na kraju projekta

## Status

✅ **Subscription system je potpuno implementiran i spreman**  
⏳ **Stripe integracija će biti konfigurirana na kraju projekta**

## Što je implementirano

1. ✅ Database schema za subscriptions
2. ✅ API endpoints za payment offers
3. ✅ UI za slanje payment offers
4. ✅ Webhook handler za auto-kreiranje usera
5. ✅ Email templates
6. ✅ Graceful handling kada Stripe nije konfiguriran

## Što treba konfigurirati kad budeš spremna

### 1. Stripe Account Setup

1. Kreiraj Stripe account na https://stripe.com
2. Prebaci se na **Production** mode (kad budeš spremna)
3. Dohvati API keys:
   - **Secret Key**: `sk_live_...` (ili `sk_test_...` za testiranje)
   - **Publishable Key**: `pk_live_...` (ili `pk_test_...`)

### 2. Environment Variables

Dodaj u `.env.local` ili production environment:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...  # ili sk_live_... za production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # ili pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...  # dobiješ nakon webhook setup-a
```

### 3. Kreiraj Stripe Products

Za svaki subscription plan, kreiraj Stripe Product:

#### Basic Plan
```bash
# Product
stripe products create \
  --name "MeetFlow Basic" \
  --description "Perfect for small conferences and events"

# Monthly Price (€49)
stripe prices create \
  --product [PRODUCT_ID] \
  --unit-amount 4900 \
  --currency eur \
  --recurring interval=month

# Yearly Price (€490)
stripe prices create \
  --product [PRODUCT_ID] \
  --unit-amount 49000 \
  --currency eur \
  --recurring interval=year
```

#### Professional Plan
```bash
# Product
stripe products create \
  --name "MeetFlow Professional" \
  --description "Ideal for multiple events and growing organizations"

# Monthly Price (€99)
stripe prices create \
  --product [PRODUCT_ID] \
  --unit-amount 9900 \
  --currency eur \
  --recurring interval=month

# Yearly Price (€990)
stripe prices create \
  --product [PRODUCT_ID] \
  --unit-amount 99000 \
  --currency eur \
  --recurring interval=year
```

#### Enterprise Plan
```bash
# Product
stripe products create \
  --name "MeetFlow Enterprise" \
  --description "For large-scale conferences and institutions"

# Monthly Price (€249)
stripe prices create \
  --product [PRODUCT_ID] \
  --unit-amount 24900 \
  --currency eur \
  --recurring interval=month

# Yearly Price (€2,490)
stripe prices create \
  --product [PRODUCT_ID] \
  --unit-amount 249000 \
  --currency eur \
  --recurring interval=year
```

### 4. Update Database

Nakon kreiranja Stripe Products i Prices, ažuriraj `subscription_plans` tablicu:

```sql
-- Update Basic Plan
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_...',
  stripe_price_id_monthly = 'price_...',
  stripe_price_id_yearly = 'price_...'
WHERE slug = 'basic';

-- Update Professional Plan
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_...',
  stripe_price_id_monthly = 'price_...',
  stripe_price_id_yearly = 'price_...'
WHERE slug = 'professional';

-- Update Enterprise Plan
UPDATE subscription_plans
SET 
  stripe_product_id = 'prod_...',
  stripe_price_id_monthly = 'price_...',
  stripe_price_id_yearly = 'price_...'
WHERE slug = 'enterprise';
```

### 5. Webhook Setup

1. Idi na Stripe Dashboard → **Developers** → **Webhooks**
2. Klikni **Add endpoint**
3. Endpoint URL: `https://your-domain.com/api/stripe-webhook`
4. Odaberi events:
   - `checkout.session.completed` ✅
   - `payment_intent.succeeded` ✅ (za conference registrations)
5. Klikni **Add endpoint**
6. Kopiraj **Signing secret** (počinje s `whsec_...`)
7. Dodaj u environment variables: `STRIPE_WEBHOOK_SECRET=whsec_...`

### 6. Testiranje

#### Local Testing (Stripe CLI)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to localhost:3003/api/stripe-webhook

# U drugom terminalu, testiraj payment
stripe payment_links create \
  --line-items '[{"price":"price_xxx","quantity":1}]'
```

#### Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

### 7. Production Checklist

- [ ] Stripe account prebačen na Production mode
- [ ] Production API keys dodani u environment variables
- [ ] Webhook endpoint konfiguriran s production URL-om
- [ ] Test payment uspješan
- [ ] Email templates testirani
- [ ] Auto-user creation testiran
- [ ] Subscription tracking radi
- [ ] Invoice generation radi

## Trenutno ponašanje

Kada Stripe nije konfiguriran:

- ✅ Aplikacija **ne crasha**
- ✅ "Send Payment Offer" button je **disabled** s tooltip-om
- ✅ API vraća **503 error** s jasnom porukom
- ✅ Logs pokazuju da Stripe nije konfiguriran
- ✅ Sve ostale funkcionalnosti rade normalno

## Kada konfiguriraš Stripe

1. Dodaj environment variables
2. Kreiraj Stripe Products i Prices
3. Ažuriraj `subscription_plans` tablicu
4. Postavi webhook endpoint
5. Testiraj cijeli flow
6. "Send Payment Offer" button će automatski postati aktivan

## Support

Za pomoć s Stripe setup-om:
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com
- MeetFlow Docs: `/docs/SUBSCRIPTION_SYSTEM.md`

