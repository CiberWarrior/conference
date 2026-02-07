# Quick Start Guide

## Brzi početak

1. **Instaliraj dependencies:**
```bash
npm install
```

2. **Postavi environment varijable:**
```bash
cp .env.local.example .env.local
# Zatim uredi .env.local i dodaj svoje Supabase/Stripe/Resend ključeve
```

3. **Postavi Supabase bazu:**
   - Kreiraj Supabase projekt na [supabase.com](https://supabase.com)
   - Primijeni migracije (preporučeno: Supabase CLI `supabase db push`, ili ručno kroz Supabase SQL Editor)
   - Ključeve pronađi u `docs/GDE_NACI_SUPABASE_KLJUCEVE.md`
   - Za brzu provjeru lokalno vidi `docs/LOCALHOST_TESTING_CHECKLIST.md`

4. **Pokreni development server:**
```bash
npm run dev
```

5. **Otvori aplikaciju:**
   - Registracijska forma: http://localhost:3000
   - Admin panel: http://localhost:3000/admin

## Važne napomene

### Plaćanje
- Iznos se računa prema odabranoj kotizaciji (custom fees); Stripe je opcionalan
- Za testiranje plaćanja koristi Stripe test mode

### Email potvrde
- Email se šalje asinkrono nakon uspješne prijave
- Potrebno je postaviti Resend API key i verificirati domain
- Vidi `docs/DEPLOYMENT_CHECKLIST.md` za produkcijske postavke

### Admin panel
- Admin panel je zaštićen autentifikacijom; za produkciju obavezno postavi env varijable i RLS

## Struktura

- `/` - Glavna registracijska forma
- `/admin` - Admin panel za pregled prijava
- `/success` - Success stranica nakon plaćanja
- `/api/register` - API endpoint za registraciju
- `/api/stripe-webhook` - Webhook za Stripe događaje

## Customizacija

### Promjena email template
Uredi `supabase/functions/send-confirmation-email/index.ts`

### Dodavanje novih polja
1. Dodaj polje u `types/registration.ts`
2. Ažuriraj formu u `components/RegistrationForm.tsx`
3. Ažuriraj validaciju u `app/api/register/route.ts`
4. Ažuriraj SQL migraciju za novo polje

