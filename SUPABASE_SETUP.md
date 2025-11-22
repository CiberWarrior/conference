# Supabase Setup Guide

## 1. Kreiranje Supabase projekta

1. Idite na [supabase.com](https://supabase.com) i kreirajte novi projekt
2. Zabilježite svoje `Project URL` i `anon key` iz Settings > API

## 2. Postavljanje baze podataka

1. U Supabase dashboardu, idite na SQL Editor
2. Kopirajte i pokrenite SQL iz `supabase/migrations/001_create_registrations_table.sql`
3. Provjerite da je tablica `registrations` kreirana u Table Editor

## 3. Postavljanje Edge Function za email

1. Instaliraj Supabase CLI:
```bash
npm install -g supabase
```

2. Login u Supabase:
```bash
supabase login
```

3. Linkaj projekt:
```bash
supabase link --project-ref your-project-ref
```

4. Postavi Resend API key kao secret:
```bash
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

5. Deployaj Edge Function:
```bash
supabase functions deploy send-confirmation-email
```

## 4. Konfiguracija Resend

1. Kreiraj account na [resend.com](https://resend.com)
2. Generiraj API key
3. Verificiraj svoj domain (ili koristi Resend test domain za development)
4. Ažuriraj `from` email u `supabase/functions/send-confirmation-email/index.ts` sa svojim verificiranim emailom

## 5. Environment varijable

Dodaj sve potrebne varijable u `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 6. Stripe Setup (opcionalno)

1. Kreiraj Stripe account na [stripe.com](https://stripe.com)
2. Uzmi API keys iz Stripe Dashboard
3. Postavi webhook endpoint:
   - URL: `https://yourdomain.com/api/stripe-webhook`
   - Events: `checkout.session.completed`
   - Kopiraj webhook signing secret u `STRIPE_WEBHOOK_SECRET`

## Napomene

- Za production, ažuriraj `NEXT_PUBLIC_APP_URL` sa svojim domenom
- RLS (Row Level Security) politike su postavljene - možda ćeš trebati prilagoditi za admin pristup
- Email `from` adresa mora biti verificirana u Resend

