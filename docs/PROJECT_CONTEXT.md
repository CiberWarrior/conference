# Project Context — MeetFlow

## 1. Što je projekt
MeetFlow je multi-tenant platforma za znanstvene konferencije.
Sadrži javni dio (index s informacijama o eventu i linkovima na registraciju, smještaj i upload sažetaka)
te admin dashboard za super-admina i admine pojedinih konferencija.

## 2. Status projekta
Status: aktivan razvoj  
Trenutni fokus: administriranje i pregled vrsta kotizacija (registration fees)

## 3. Tehnologije
- Frontend: Next.js (App Router), TypeScript
- Backend: Supabase (Postgres + RLS)
- Auth: Supabase Auth
- Payments: Stripe
- Deployment: Vercel

## 4. Core domene
- Conference / Konferencija
- Registration / Registracija
- Fee / Kotizacija
- Participant / Sudionik
- Abstract / Sažetak
- Admin / Administrator

Projekt je dvojezičan (EN / HR) — terminologija mora ostati dosljedna.

## 5. Pravila koja se ne smiju mijenjati
- Ako je kotizacija 0 → nema plaćanja
- Uvijek se koristi admin Supabase client za pisanje u bazu
- RLS se nikad ne gasi
