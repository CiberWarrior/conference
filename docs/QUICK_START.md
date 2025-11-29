# Quick Start Guide

## Brzi početak

1. **Instaliraj dependencies:**
```bash
npm install
```

2. **Postavi environment varijable:**
```bash
cp .env.local.example .env.local
# Zatim uredi .env.local i dodaj svoje Supabase i Resend ključeve
```

3. **Postavi Supabase bazu:**
   - Kreiraj Supabase projekt na [supabase.com](https://supabase.com)
   - Pokreni SQL migraciju iz `supabase/migrations/001_create_registrations_table.sql` u Supabase SQL Editor
   - Vidi detaljne upute u `SUPABASE_SETUP.md`

4. **Pokreni development server:**
```bash
npm run dev
```

5. **Otvori aplikaciju:**
   - Registracijska forma: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

## Važne napomene

### Plaćanje
- Default iznos za plaćanje je 50 EUR (može se promijeniti u `app/api/register/route.ts`)
- Stripe integracija je opcionalna - aplikacija radi i bez nje
- Za testiranje plaćanja koristi Stripe test mode

### Email potvrde
- Email se šalje asinkrono nakon uspješne prijave
- Potrebno je postaviti Resend API key i verificirati domain
- Vidi `SUPABASE_SETUP.md` za detalje

### Admin panel
- Trenutno nema autentifikacije - dodaj autentifikaciju za production!
- Za production, koristi Supabase Auth za zaštitu admin panela

## Struktura

- `/` - Glavna registracijska forma
- `/admin` - Admin panel za pregled prijava
- `/success` - Success stranica nakon plaćanja
- `/api/register` - API endpoint za registraciju
- `/api/stripe-webhook` - Webhook za Stripe događaje

## Customizacija

### Promjena iznosa plaćanja
Uredi `app/api/register/route.ts` i promijeni:
```typescript
const amount = 50 // Promijeni na željeni iznos
```

### Promjena email template
Uredi `supabase/functions/send-confirmation-email/index.ts`

### Dodavanje novih polja
1. Dodaj polje u `types/registration.ts`
2. Ažuriraj formu u `components/RegistrationForm.tsx`
3. Ažuriraj validaciju u `app/api/register/route.ts`
4. Ažuriraj SQL migraciju za novo polje

