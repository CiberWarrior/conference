# Korak-po-korak vodič - Počnite ovdje! 🚀

## ⚡ Brzi start (5 minuta)

### Korak 1: Kreiranje Supabase accounta
1. Otvorite [https://supabase.com](https://supabase.com) u browseru
2. Kliknite **"Start your project"**
3. Prijavite se s GitHub ili Google
4. Kliknite **"New Project"**
5. Unesite:
   - **Name**: `conference-registration`
   - **Database Password**: Zabilježite lozinku!
   - **Region**: Odaberite najbližu (npr. `West EU`)
6. Kliknite **"Create new project"** i pričekajte 1-2 minute

### Korak 2: Dobivanje API ključeva
1. U Supabase dashboardu → **Settings** (lijevo) → **API**
2. Kopirajte tri vrijednosti:
   - **Project URL** (npr. `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (tajni ključ!)

### Korak 3: Postavljanje baze podataka
1. U Supabase dashboardu → **SQL Editor** (lijevo)
2. Kliknite **"New query"**
3. Otvorite u Cursoru: `supabase/migrations/001_create_registrations_table.sql`
4. **Kopirajte SAV sadržaj** i zalijepite u SQL Editor
5. Kliknite **"Run"** (ili `Ctrl+Enter`)
6. Trebali biste vidjeti "Success. No rows returned"

### Korak 4: Postavljanje environment varijabli
1. U Cursoru, pronađite `.env.local.example`
2. Kopirajte je i preimenujte u `.env.local`
3. Otvorite `.env.local` i popunite:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Gdje naći:**
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL iz Supabase Settings > API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key

### Korak 5: Instalacija i pokretanje
1. Otvorite terminal u Cursoru: `` Ctrl+` ``
2. Provjerite da ste u projektu:
   ```bash
   cd /Users/renchi/conference-registration
   ```
3. Instalirajte pakete:
   ```bash
   npm install
   ```
4. Pokrenite aplikaciju:
   ```bash
   npm run dev
   ```
5. Otvorite browser: `http://localhost:3000`

### Korak 6: Testiranje
1. Ispunite formu (bez uključivanja "Payment Required"):
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@example.com`
   - Phone: `123456789`
2. Kliknite **"Register"**
3. Trebali biste vidjeti "Registration successful!"
4. Provjerite u Supabase → **Table Editor** → `registrations` - trebali biste vidjeti svoju prijavu!

## 📋 Detaljni vodič

Za detaljne upute s troubleshootingom, pogledajte `TESTING_GUIDE.md`

## ✅ Provjera lista

- [ ] Supabase account kreiran
- [ ] Supabase projekt kreiran
- [ ] API ključevi kopirani
- [ ] SQL migracija pokrenuta
- [ ] `.env.local` datoteka kreirana i popunjena
- [ ] `npm install` pokrenut
- [ ] `npm run dev` pokrenut
- [ ] Aplikacija se otvara u browseru
- [ ] Test registracija uspješna
- [ ] Podaci se vide u Supabase Table Editor

## 🆘 Problemi?

### "Missing Supabase environment variables"
→ Provjerite da je `.env.local` ispravno popunjen i restartajte server

### "Failed to save registration"
→ Provjerite da je SQL migracija pokrenuta u Supabase

### Admin panel ne prikazuje podatke
→ Provjerite da koristite `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ne service_role)

## 🎯 Sljedeći koraci

Nakon što osnovno testiranje radi:
1. Postavite Resend za email potvrde (vidi `TESTING_GUIDE.md` Korak 8)
2. Postavite Stripe za plaćanje (vidi `TESTING_GUIDE.md` Korak 9)
3. Prilagodite dizajn i funkcionalnosti

