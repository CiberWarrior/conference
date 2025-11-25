# 📊 Vodič za postavljanje baze podataka

## Gdje se podaci pohranjuju?

**Svi podaci korisnika se pohranjuju u Supabase bazu podataka** - to je cloud baza podataka (PostgreSQL) koja se koristi za pohranu svih registracija.

## ✅ Što trebate napraviti

### 1. Kreirajte Supabase projekt (BESPLATNO)

1. **Idite na [supabase.com](https://supabase.com)**
2. **Kliknite "Start your project"** ili se prijavite
3. **Kreirajte novi projekt:**
   - Kliknite "New Project"
   - Unesite naziv projekta (npr. `conference-registration`)
   - Odaberite regiju (npr. `West EU (Frankfurt)`)
   - Unesite i zabilježite Database Password (važno!)
   - Kliknite "Create new project"
   - Pričekajte 1-2 minute dok se projekt kreira

### 2. Dobivanje API ključeva

1. U Supabase dashboardu, idite na **Settings** → **API**
2. Kopirajte sljedeće vrijednosti:
   - **Project URL** (npr. `https://xxxxx.supabase.co`)
   - **anon public** key (dugi string koji počinje s `eyJ...`)
   - **service_role** key (dugi string - **VAŽNO**: Ovo je tajni ključ!)

### 3. Postavljanje baze podataka

**Opcija A: Jednostavno (preporučeno) - Jedna migracija:**

1. U Supabase dashboardu, idite na **SQL Editor** (lijevo u sidebaru)
2. Kliknite **"New query"**
3. Otvorite datoteku `supabase/migrations/000_complete_setup.sql` u Cursoru
4. Kopirajte SAV sadržaj datoteke
5. Zalijepite u SQL Editor u Supabase dashboardu
6. Kliknite **"Run"** (ili `Ctrl+Enter` / `Cmd+Enter`)
7. Trebali biste vidjeti poruku "Success"

**Opcija B: Korak po korak (ako želite više kontrole):**

1. U Supabase dashboardu, idite na **SQL Editor**
2. Pokrenite migracije redom:
   - `001_create_registrations_table.sql`
   - `004_add_registration_fields.sql`
   - `005_add_payment_fields.sql`

**Provjera:** Idite na **Table Editor** → Trebali biste vidjeti tablicu `registrations` sa svim kolonama

### 4. Postavljanje environment varijabli

1. U root direktoriju projekta, kreirajte datoteku `.env.local`:

```bash
touch .env.local
```

2. Otvorite `.env.local` i dodajte sljedeće:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Stripe Configuration (opcionalno - za plaćanje)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Gdje naći vrijednosti:**
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL iz Supabase Settings > API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key iz Supabase Settings > API
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key iz Supabase Settings > API

### 5. Restart aplikacije

Nakon postavljanja `.env.local` datoteke:

```bash
# Zaustavite aplikaciju (Ctrl+C) i pokrenite ponovno
npm run dev
```

## 📋 Struktura baze podataka

Tablica `registrations` sadrži sljedeća polja:

- `id` - Jedinstveni ID registracije
- `first_name` - Ime
- `last_name` - Prezime
- `email` - Email adresa (jedinstvena)
- `phone` - Telefon
- `country` - Država
- `institution` - Institucija
- `arrival_date` - Datum dolaska
- `departure_date` - Datum odlaska
- `payment_required` - Da li je plaćanje potrebno
- `payment_by_card` - Da li korisnik želi platiti karticom
- `payment_status` - Status plaćanja (`pending`, `paid`, `not_required`)
- `stripe_session_id` - ID Stripe sesije (ako se koristi Checkout)
- `payment_intent_id` - ID payment intenta (za direktno plaćanje)
- `invoice_id` - ID računa
- `invoice_url` - URL računa
- `created_at` - Datum kreiranja

## 🔍 Provjera da li radi

1. Otvorite aplikaciju u browseru (`http://localhost:3000`)
2. Ispunite formu za registraciju
3. Pošaljite formu
4. U Supabase dashboardu → **Table Editor** → **registrations**
5. Trebali biste vidjeti novi red s podacima korisnika!

## ⚠️ Važne napomene

- **Supabase je besplatan** do određenog limita (500MB baze, 2GB bandwidth)
- **Service Role Key je tajni** - nikada ga ne dijelite i ne commitajte u Git!
- **`.env.local` se ne commitira** u Git (već je u `.gitignore`)
- Za production, ažurirajte `NEXT_PUBLIC_APP_URL` sa svojim domenom

## 🆘 Problemi?

### Problem: "Failed to save registration"
- Provjerite da su sve migracije pokrenute u Supabase SQL Editoru
- Provjerite da su environment varijable ispravno postavljene u `.env.local`
- Provjerite da ste restartali aplikaciju nakon dodavanja `.env.local`

### Problem: "Missing SUPABASE_SERVICE_ROLE_KEY"
- Provjerite da ste dodali `SUPABASE_SERVICE_ROLE_KEY` u `.env.local`
- Provjerite da je vrijednost kopirana u cijelosti (dugačak string)

### Problem: Ne vidim podatke u Table Editoru
- Provjerite da su migracije uspješno pokrenute (trebali biste vidjeti "Success" poruku)
- Provjerite da ste u ispravnom projektu u Supabase dashboardu

