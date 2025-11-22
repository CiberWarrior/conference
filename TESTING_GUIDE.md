# Korak-po-korak vodič za testiranje aplikacije

## Korak 1: Kreiranje Supabase accounta i projekta

### 1.1. Kreiranje accounta
1. Idite na [https://supabase.com](https://supabase.com)
2. Kliknite na **"Start your project"** ili **"Sign Up"**
3. Prijavite se s GitHub, Google ili emailom
4. Potvrdite email ako je potrebno

### 1.2. Kreiranje novog projekta
1. Nakon prijave, kliknite **"New Project"**
2. Odaberite organizaciju (ili kreirajte novu)
3. Unesite:
   - **Name**: `conference-registration` (ili bilo koji naziv)
   - **Database Password**: Zabilježite ovu lozinku! (trebat će vam kasnije)
   - **Region**: Odaberite najbližu regiju (npr. `West EU (Frankfurt)`)
4. Kliknite **"Create new project"**
5. Pričekajte 1-2 minute dok se projekt kreira

### 1.3. Dobivanje API ključeva
1. U Supabase dashboardu, idite na **Settings** (lijevo u sidebaru)
2. Kliknite na **API**
3. Zabilježite sljedeće:
   - **Project URL** (npr. `https://xxxxx.supabase.co`)
   - **anon public** key (dugi string)
   - **service_role** key (dugi string) - **VAŽNO**: Ovo je tajni ključ, ne dijelite ga!

## Korak 2: Postavljanje baze podataka

### 2.1. Pokretanje SQL migracije
1. U Supabase dashboardu, idite na **SQL Editor** (lijevo u sidebaru)
2. Kliknite **"New query"**
3. Otvorite datoteku `supabase/migrations/001_create_registrations_table.sql` u Cursoru
4. Kopirajte SAV sadržaj te datoteke
5. Zalijepite u SQL Editor u Supabase dashboardu
6. Kliknite **"Run"** (ili pritisnite `Ctrl+Enter` / `Cmd+Enter`)
7. Trebali biste vidjeti poruku "Success. No rows returned"

### 2.2. Provjera tablice
1. Idite na **Table Editor** (lijevo u sidebaru)
2. Trebali biste vidjeti tablicu `registrations`
3. Kliknite na nju da vidite strukturu (kolone: id, first_name, last_name, email, phone, itd.)

## Korak 3: Postavljanje environment varijabli

### 3.1. Kreiranje .env.local datoteke
1. U Cursoru, otvorite projekt folder
2. Pronađite datoteku `.env.local.example`
3. Kopirajte je i preimenujte u `.env.local` (bez .example)
4. Otvorite `.env.local` u editoru

### 3.2. Popunjavanje Supabase varijabli
U `.env.local` datoteci, zamijenite:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Gdje naći ove vrijednosti:**
- `NEXT_PUBLIC_SUPABASE_URL` = Project URL iz Supabase Settings > API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key iz Supabase Settings > API
- `SUPABASE_SERVICE_ROLE_KEY` = service_role key iz Supabase Settings > API

### 3.3. Postavljanje APP URL
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.4. Email i Stripe (za sada možete ostaviti prazno)
Za sada možete ostaviti ove prazne (aplikacija će raditi bez njih za osnovno testiranje):

```env
RESEND_API_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

**Napomena:** Email potvrde neće raditi bez Resend API key, ali registracija će se spremiti u bazu.

## Korak 4: Instalacija dependencies

### 4.1. Otvaranje terminala u Cursoru
1. U Cursoru, pritisnite `` Ctrl+` `` (ili `Cmd+` na Macu) da otvorite terminal
2. Provjerite da ste u direktoriju projekta:
   ```bash
   cd /Users/renchi/conference-registration
   pwd
   ```

### 4.2. Instalacija paketa
```bash
npm install
```

Ovo može potrajati 1-2 minute. Pričekajte da se sve instalira.

## Korak 5: Pokretanje aplikacije

### 5.1. Pokretanje development servera
```bash
npm run dev
```

Trebali biste vidjeti:
```
▲ Next.js 14.2.5
- Local:        http://localhost:3000
```

### 5.2. Otvaranje aplikacije u browseru
1. Otvorite browser (Chrome, Firefox, Safari)
2. Idite na: `http://localhost:3000`
3. Trebali biste vidjeti registracijsku formu!

## Korak 6: Testiranje osnovne funkcionalnosti

### 6.1. Testiranje registracije bez plaćanja
1. Na formi, **NE uključujte** toggle "Payment Required"
2. Ispunite formu:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@example.com`
   - Phone: `123456789`
3. Kliknite **"Register"**
4. Trebali biste vidjeti poruku "Registration successful!"

### 6.2. Provjera u Supabase
1. Vratite se u Supabase dashboard
2. Idite na **Table Editor**
3. Kliknite na tablicu `registrations`
4. Trebali biste vidjeti svoju prijavu u tablici!

### 6.3. Testiranje validacije
1. Pokušajte poslati praznu formu - trebali biste vidjeti error poruke
2. Pokušajte unijeti nevažeći email (npr. `test@`) - trebali biste vidjeti error
3. Pokušajte registrirati isti email ponovno - trebali biste vidjeti "Email already registered"

## Korak 7: Testiranje admin panela

### 7.1. Otvaranje admin panela
1. U browseru, idite na: `http://localhost:3000/admin`
2. Trebali biste vidjeti admin panel s tablicom prijava

### 7.2. Funkcionalnosti admin panela
- Trebali biste vidjeti sve prijave u tablici
- Možete pretraživati po imenu ili emailu
- Možete filtrirati po payment statusu
- Možete kliknuti "Export to CSV" da preuzmete podatke

**Napomena:** Admin panel trenutno nema autentifikaciju - u productionu dodajte zaštitu!

## Korak 8: (Opcionalno) Postavljanje email potvrda

### 8.1. Kreiranje Resend accounta
1. Idite na [https://resend.com](https://resend.com)
2. Kreirajte besplatni account
3. Verificirajte email

### 8.2. Dobivanje API key
1. U Resend dashboardu, idite na **API Keys**
2. Kliknite **"Create API Key"**
3. Dajte mu naziv (npr. "Conference Registration")
4. Kopirajte API key

### 8.3. Postavljanje u .env.local
```env
RESEND_API_KEY=re_your_api_key_here
```

### 8.4. Deploy Supabase Edge Function
1. Instaliraj Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login:
   ```bash
   supabase login
   ```

3. Linkaj projekt (koristi Project Reference ID iz Supabase Settings > General):
   ```bash
   supabase link --project-ref your-project-ref-id
   ```

4. Postavi Resend API key:
   ```bash
   supabase secrets set RESEND_API_KEY=re_your_api_key_here
   ```

5. Deployaj funkciju:
   ```bash
   supabase functions deploy send-confirmation-email
   ```

6. Ažuriraj email adresu u `supabase/functions/send-confirmation-email/index.ts`:
   - Promijeni `from: 'Conference Registration <noreply@yourdomain.com>'` na svoju verificiranu email adresu

### 8.5. Testiranje emaila
1. Napravite novu registraciju
2. Provjerite inbox emaila koji ste unijeli
3. Trebali biste primiti potvrdni email!

## Korak 9: (Opcionalno) Postavljanje Stripe plaćanja

### 9.1. Kreiranje Stripe accounta
1. Idite na [https://stripe.com](https://stripe.com)
2. Kreirajte account (možete koristiti test mode)
3. U dashboardu, idite na **Developers > API keys**

### 9.2. Dobivanje API ključeva
1. Kopirajte **Publishable key** (počinje s `pk_test_`)
2. Kopirajte **Secret key** (počinje s `sk_test_`)

### 9.3. Postavljanje u .env.local
```env
STRIPE_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

### 9.4. Testiranje plaćanja
1. Restartajte development server (`Ctrl+C` pa `npm run dev`)
2. Na formi, **uključite** toggle "Payment Required"
3. Ispunite formu i registrirajte se
4. Trebali biste biti preusmjereni na Stripe Checkout stranicu
5. Koristite test kartice:
   - Broj kartice: `4242 4242 4242 4242`
   - Expiry: bilo koji budući datum
   - CVC: bilo koji 3 broja
   - ZIP: bilo koji 5 brojeva

## Troubleshooting

### Problem: "Missing Supabase environment variables"
**Rješenje:** Provjerite da je `.env.local` datoteka ispravno popunjena i da ste restartali development server.

### Problem: "Failed to save registration"
**Rješenje:** 
- Provjerite da je SQL migracija pokrenuta u Supabase
- Provjerite da su RLS politike postavljene ispravno
- Provjerite da koristite ispravan `SUPABASE_SERVICE_ROLE_KEY`

### Problem: Admin panel ne prikazuje podatke
**Rješenje:**
- Provjerite da koristite `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ne service_role)
- Provjerite RLS politike u Supabase

### Problem: Email se ne šalje
**Rješenje:**
- Provjerite da je Resend API key postavljen
- Provjerite da je Edge Function deployana
- Provjerite da je email adresa u funkciji verificirana u Resend

## Sljedeći koraci

Nakon što sve radi:
1. Dodaj autentifikaciju za admin panel
2. Prilagodi dizajn prema potrebama
3. Promijeni iznos plaćanja u `app/api/register/route.ts`
4. Deployaj aplikaciju na Vercel ili drugi hosting

