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

## 4. Struktura projekta

**Root:**
- `app/` – Next.js App Router (stranice, rute, API)
- `components/` – React komponente (nav, forms, admin UI)
- `lib/` – Supabase klijenti, auth, email, logger
- `contexts/` – React konteksti (Conference, Auth)
- `types/` – TypeScript tipovi (conference, author, itd.)
- `utils/` – Validatori, pomoćne funkcije
- `messages/` – Prijevodi (en.json, hr.json)
- `supabase/` – Migracije, funkcije (npr. send-confirmation-email)
- `docs/` – Dokumentacija (00_ACTIVE, 01_REFERENCE, 99_ARCHIVE)
- `public/` – Statički sadržaj

**Ključne rute:**
- Javno: `/`, `/conferences/[slug]`, `/conferences/[slug]/register`, `/conferences/[slug]/submit-abstract`, `/conferences/[slug]/p/[pageSlug]`
- Auth (samo admin): `/auth/admin-login`, `/auth/reset-password`, `/auth/callback`
- Admin (zaštićeno): `/admin` → redirect na dashboard, `/admin/dashboard`, `/admin/conferences`, `/admin/registrations`, `/admin/abstracts`, `/admin/users`, itd.
- API: `/api/auth/login`, `/api/register`, `/api/conferences/[slug]/*`, `/api/admin/*`

**Detaljnija arhitektura (baza, pristup, flow):** `docs/SYSTEM_ARCHITECTURE_SUMMARY.md`

## 5. Core domene
- Conference / Konferencija
- Registration / Registracija
- Fee / Kotizacija
- Participant / Sudionik
- Abstract / Sažetak
- Admin / Administrator

Projekt je dvojezičan (EN / HR) — terminologija mora ostati dosljedna.

## 6. Korisnici u Supabaseu

**Super Admin (glavni admin)** – ulogiraš se ovim mailom:
- **Email:** `screatives.info@gmail.com`
- **Uloga:** `super_admin` (puni pristup platformi)
- **Login:** `/auth/admin-login`

**Test korisnici** (za development / testiranje):
- **TESTER1** – `pingu2111@yahoo.com` (admin konferencija)
- **Test Participant** – `test@participant.com` (sudionik)
- Opcionalno: **testuser@example.com** (conference_admin) – kreira se prema `docs/CREATE_TEST_CONFERENCE_ADMIN.sql` ako treba dodatni test admin.

## 7. Pravila koja se ne smiju mijenjati
- Ako je kotizacija 0 → nema plaćanja
- Uvijek se koristi admin Supabase client za pisanje u bazu
- RLS se nikad ne gasi
