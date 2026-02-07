# 📋 Detaljno Objašnjenje Deployment Koraka

## 🎯 KORAK 1: Pokrenite Database Migration

### Što se događa u ovom koraku?

Database migration kreira **4 nove tablice** u Supabase bazi:
1. `participant_profiles` - Profili svih participanata
2. `participant_registrations` - Linkanje participanata s eventima
3. `participant_loyalty_discounts` - Tracking loyalty popusta
4. `participant_account_invites` - Invite sistem za accounte

Također dodaje:
- Database triggeri za automatsko ažuriranje loyalty tier-a
- Row Level Security (RLS) policies za sigurnost
- Indexi za performanse

---

### 📝 KORAK 1A: Metoda A - Supabase Dashboard (PREPORUČENO)

**Vrijeme:** ~3 minute

#### 1.1. Otvori Supabase Dashboard

1. **Idi na:** https://supabase.com/dashboard
2. **Login** sa svojim Supabase accountom
3. **Odaberi svoj projekt** (Conference Platform)

#### 1.2. Otvori SQL Editor

1. U **lijevom sidebaru**, klikni na **"SQL Editor"** (ikonica: `</>`)
2. Klikni **"New query"** gumb (gore desno)

#### 1.3. Kopiraj Migration SQL

1. **Otvori file** u editoru:
   ```
   supabase/migrations/035_create_participant_system.sql
   ```
2. **Selektiraj SVE** (Ctrl+A / Cmd+A)
3. **Kopiraj** (Ctrl+C / Cmd+C)

#### 1.4. Paste i Pokreni

1. **Paste** u Supabase SQL Editor (Ctrl+V / Cmd+V)
2. **Provjeri** da je cijeli SQL kod tamo (trebalo bi biti ~326 linija)
3. **Klikni "Run"** gumb (ili pritisni Ctrl+Enter)

#### 1.5. Provjeri Rezultat

**Očekivani output:**
```
Success. No rows returned
```

**Ako vidiš greške:**
- Ako kaže "table already exists" → OK, to znači da je već pokrenuto
- Ako vidiš druge greške → Kopiraj grešku i provjeri

#### 1.6. Verifikacija (Opcionalno)

U SQL Editoru, pokreni ovaj query da provjeriš da su tablice kreirane:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'participant%'
ORDER BY table_name;
```

**Očekivani rezultat:**
```
participant_account_invites
participant_loyalty_discounts
participant_profiles
participant_registrations
```

---

### 📝 KORAK 1B: Metoda B - Supabase CLI (Za napredne)

**Vrijeme:** ~2 minute

**Prerequisites:**
- Supabase CLI instaliran: `npm install -g supabase`
- Logged in: `supabase login`

#### 1.1. Navigate to Project

```bash
cd "/Users/renchi/Desktop/conference platform"
```

#### 1.2. Link Project (ako nije već linkan)

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

**Gdje naći PROJECT_REF:**
- Supabase Dashboard → Settings → General → Reference ID

#### 1.3. Push Migration

```bash
supabase db push
```

**Ili direktno:**

```bash
supabase migration up
```

---

### 📝 KORAK 1C: Metoda C - psql Command Line

**Vrijeme:** ~2 minute

**Prerequisites:**
- `psql` instaliran
- Database connection string

#### 1.1. Pronađi Connection String

U Supabase Dashboard:
1. Settings → Database
2. Scroll down do "Connection string"
3. Kopiraj "URI" format:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

#### 1.2. Pokreni Migration

```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres" \
     -f "supabase/migrations/035_create_participant_system.sql"
```

**Ili ako imaš password u environment varijabli:**

```bash
export PGPASSWORD="your-password"
psql -h db.[PROJECT-REF].supabase.co \
     -U postgres \
     -d postgres \
     -f "supabase/migrations/035_create_participant_system.sql"
```

---

## 🎯 KORAK 2: Build & Deploy Application

### Što se događa u ovom koraku?

Build proces:
1. Kompajlira TypeScript u JavaScript
2. Optimizira React komponente
3. Generira statičke stranice
4. Provjerava greške

Deploy proces:
1. Uploada build na hosting (Vercel/Netlify/etc.)
2. Postavlja environment varijable
3. Aktivira production server

---

### 📝 KORAK 2A: Build Application

#### 2.1. Navigate to Project

```bash
cd "/Users/renchi/Desktop/conference platform"
```

#### 2.2. Install Dependencies (ako nisi nedavno)

```bash
npm install
```

#### 2.3. Build Application

```bash
npm run build
```

**Očekivani output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (X/X)
✓ Finalizing page optimization

Route (app)                              Size     First Load JS
┌ ○ /                                    5.2 kB          85 kB
├ ○ /participant/auth/login             12.3 kB          92 kB
├ ○ /participant/auth/signup            15.1 kB          95 kB
├ ○ /participant/dashboard              18.5 kB          98 kB
...
```

**Ako vidiš greške:**
- TypeScript errors → Provjeri types u `types/participant-account.ts`
- Import errors → Provjeri da su svi fileovi na pravom mjestu
- Build errors → Provjeri da su svi dependencies instalirani

#### 2.4. Test Build Locally (Opcionalno)

```bash
npm run start
```

Otvori browser: http://localhost:3000

**Provjeri:**
- ✅ Homepage se učitava
- ✅ Participant login page: http://localhost:3000/participant/auth/login
- ✅ Participant signup page: http://localhost:3000/participant/auth/signup

---

### 📝 KORAK 2B: Deploy to Vercel (PREPORUČENO)

**Vrijeme:** ~5 minuta

#### 2.1. Install Vercel CLI (ako nije instaliran)

```bash
npm install -g vercel
```

#### 2.2. Login to Vercel

```bash
vercel login
```

**Opcije:**
- Email/Password
- GitHub (preporučeno)

#### 2.3. Link Project (ako nije već linkan)

```bash
vercel link
```

**Pitanja:**
- Set up and deploy? → **Y**
- Which scope? → Odaberi svoj account
- Link to existing project? → **Y** (ako već postoji) ili **N** (za novi)
- Project name? → `conference-platform` (ili bilo koji naziv)

#### 2.4. Deploy to Production

```bash
vercel --prod
```

**Ili:**

```bash
vercel --prod --yes  # Skip confirmation prompts
```

**Očekivani output:**
```
🔍  Inspect: https://vercel.com/your-account/project/[id]
✅  Production: https://your-project.vercel.app
```

#### 2.5. Provjeri Environment Variables

U Vercel Dashboard:
1. **Idi na:** https://vercel.com/dashboard
2. **Odaberi projekt**
3. **Settings** → **Environment Variables**
4. **Provjeri da su postavljene:**
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (ako koristiš)
   - `NEXT_PUBLIC_SITE_URL` (za magic links)

**Ako nedostaju:**
- Klikni **"Add"**
- Dodaj varijablu i vrijednost
- **Redeploy** aplikaciju

---

### 📝 KORAK 2C: Deploy to Netlify (Alternativa)

**Vrijeme:** ~5 minuta

#### 2.1. Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### 2.2. Login

```bash
netlify login
```

#### 2.3. Deploy

```bash
netlify deploy --prod
```

**Ili build prvo:**

```bash
npm run build
netlify deploy --prod --dir=.next
```

---

### 📝 KORAK 2D: Deploy to Custom Server

**Za vlastiti server (VPS, AWS, etc.)**

#### 2.1. Build

```bash
npm run build
```

#### 2.2. Upload Files

```bash
# Kopiraj .next folder na server
scp -r .next user@your-server:/path/to/app/

# Kopiraj public folder
scp -r public user@your-server:/path/to/app/

# Kopiraj package.json
scp package.json user@your-server:/path/to/app/
```

#### 2.3. Na Serveru

```bash
# Install dependencies
npm install --production

# Start production server
npm run start
```

**Ili koristi PM2:**

```bash
pm2 start npm --name "conference-platform" -- start
```

---

## 🎯 KORAK 3: Testiranje

### Što se događa u ovom koraku?

Testiranje provjerava da:
1. ✅ Database migration je uspješno pokrenuta
2. ✅ Aplikacija se builda bez grešaka
3. ✅ Participant signup/login radi
4. ✅ Dashboard se učitava
5. ✅ Registration flow kreira participant profile
6. ✅ Admin može vidjeti participante

---

### 📝 KORAK 3A: Test Database Migration

#### 3.1. Provjeri da su Tablice Kreirane

U Supabase SQL Editor, pokreni:

```sql
-- Provjeri tablice
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns 
   WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name LIKE 'participant%'
ORDER BY table_name;
```

**Očekivani rezultat:**
```
participant_account_invites      | 8 columns
participant_loyalty_discounts    | 10 columns
participant_profiles             | 18 columns
participant_registrations         | 20 columns
```

#### 3.2. Provjeri Triggeri

```sql
-- Provjeri da trigger postoji
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%loyalty%';
```

**Očekivani rezultat:**
```
update_loyalty_on_registration | INSERT | participant_registrations
update_loyalty_on_registration | UPDATE | participant_registrations
```

#### 3.3. Provjeri RLS Policies

```sql
-- Provjeri RLS policies
SELECT tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename LIKE 'participant%';
```

**Očekivani rezultat:**
- `participant_own_profile` policy
- `admin_all_access_participants` policy
- `participant_own_registrations` policy
- `admin_all_access_registrations` policy

---

### 📝 KORAK 3B: Test Participant Signup

#### 3.1. Otvori Signup Page

**URL:** `https://your-domain.com/participant/auth/signup`

**Ili lokalno:** `http://localhost:3000/participant/auth/signup`

#### 3.2. Popuni Formu

```
Email: test-participant@example.com
Password: TestPass123!
First Name: Test
Last Name: Participant
Phone: +1234567890
Country: USA
Institution: Test University
```

#### 3.3. Submit i Provjeri

1. **Klikni "Create Account"**
2. **Očekivani rezultat:**
   - ✅ Success message: "Account created successfully..."
   - ✅ Redirect na login page
   - ✅ Email confirmation poslan (provjeri inbox)

#### 3.4. Provjeri Database

U Supabase SQL Editor:

```sql
SELECT * FROM participant_profiles 
WHERE email = 'test-participant@example.com';
```

**Očekivani rezultat:**
- ✅ Row postoji
- ✅ `has_account = true`
- ✅ `auth_user_id` je postavljen
- ✅ `loyalty_tier = 'bronze'`

---

### 📝 KORAK 3C: Test Participant Login

#### 3.1. Otvori Login Page

**URL:** `https://your-domain.com/participant/auth/login`

#### 3.2. Login

```
Email: test-participant@example.com
Password: TestPass123!
```

#### 3.3. Provjeri

**Očekivani rezultat:**
- ✅ Login uspješan
- ✅ Redirect na `/participant/dashboard`
- ✅ Dashboard se učitava
- ✅ Vidiš welcome message
- ✅ Stats cards se prikazuju

---

### 📝 KORAK 3D: Test Registration Flow

#### 3.1. Registriraj se za Event

1. **Idi na bilo koji conference registration page**
2. **Popuni formu** s emailom: `test-participant@example.com`
3. **Submit registration**

#### 3.2. Provjeri Database

```sql
-- Provjeri da je participant_registration kreiran
SELECT 
  pr.id,
  pr.participant_id,
  pr.conference_id,
  pr.status,
  pp.email,
  pp.first_name,
  pp.loyalty_tier
FROM participant_registrations pr
JOIN participant_profiles pp ON pr.participant_id = pp.id
WHERE pp.email = 'test-participant@example.com';
```

**Očekivani rezultat:**
- ✅ `participant_registrations` row postoji
- ✅ `status = 'confirmed'`
- ✅ `participant_id` linkan na profile

#### 3.3. Provjeri Dashboard

1. **Login kao participant**
2. **Idi na dashboard**
3. **Klikni "My Events"**

**Očekivani rezultat:**
- ✅ Vidiš novu registraciju u listi
- ✅ Status je "confirmed"
- ✅ Event details se prikazuju

---

### 📝 KORAK 3E: Test Loyalty System

#### 3.1. Registriraj za Više Eventova

Registriraj istog participanta za **3-4 eventa** (ili promijeni `total_events_attended` u bazi).

#### 3.2. Provjeri Loyalty Tier Update

```sql
SELECT 
  email,
  total_events_attended,
  loyalty_tier,
  loyalty_points
FROM participant_profiles
WHERE email = 'test-participant@example.com';
```

**Očekivani rezultat:**
- ✅ `total_events_attended` = broj registracija
- ✅ `loyalty_tier` = 'silver' (ako 3+ events) ili 'gold' (ako 6+)
- ✅ `loyalty_points` = total_events_attended * 10

#### 3.3. Provjeri Dashboard

1. **Login kao participant**
2. **Idi na dashboard**

**Očekivani rezultat:**
- ✅ Loyalty status card prikazuje tier
- ✅ Progress bar (ako nije platinum)
- ✅ Discount percentage prikazan
- ✅ Benefits lista prikazana

---

### 📝 KORAK 3F: Test Admin Interface

#### 3.1. Login kao Super Admin

**URL:** `https://your-domain.com/admin`

#### 3.2. Otvori Participants Page

**URL:** `https://your-domain.com/admin/participants`

**Ili klikni "Participants" u sidebaru (System sekcija)**

#### 3.3. Provjeri

**Očekivani rezultat:**
- ✅ Lista participanata se učitava
- ✅ Stats cards prikazuju brojeve
- ✅ Search funkcionalnost radi
- ✅ Filteri rade (has_account, loyalty_tier)
- ✅ Klik na participant → otvara details

#### 3.4. Provjeri Participant Details

1. **Klikni na bilo koji participant**
2. **Provjeri da vidiš:**
   - ✅ Full profile info
   - ✅ All registrations
   - ✅ Loyalty history
   - ✅ Stats

---

### 📝 KORAK 3G: Test Magic Link Login

#### 3.1. Request Magic Link

1. **Idi na:** `/participant/auth/login`
2. **Klikni "Use magic link instead"**
3. **Unesi email:** `test-participant@example.com`
4. **Klikni "Send Magic Link"**

#### 3.2. Provjeri Email

**Očekivani rezultat:**
- ✅ Email stiže u inbox
- ✅ Link u emailu vodi na dashboard
- ✅ Klik na link → automatski login

---

## ✅ Finalna Provjera

### Checklist

- [ ] Database migration pokrenuta bez grešaka
- [ ] Sve 4 tablice postoje
- [ ] Triggeri su kreirani
- [ ] RLS policies su aktivne
- [ ] Build prošao bez grešaka
- [ ] Deploy uspješan
- [ ] Participant signup radi
- [ ] Participant login radi (password)
- [ ] Participant login radi (magic link)
- [ ] Dashboard se učitava
- [ ] Registration flow kreira participant profile
- [ ] Loyalty tier se ažurira
- [ ] Admin može vidjeti participante
- [ ] Search i filteri rade
- [ ] Participant details page radi

---

## 🐛 Troubleshooting

### Problem: Migration ne prolazi

**Greška:** `relation "participant_profiles" already exists`

**Rješenje:**
- Tablice već postoje → OK, preskoči migration
- Ili pokreni: `DROP TABLE IF EXISTS participant_profiles CASCADE;` pa ponovo migration

### Problem: Build ne prolazi

**Greška:** TypeScript errors

**Rješenje:**
```bash
# Provjeri types
npm run type-check

# Fix errors
# Ili dodaj @ts-ignore ako je potrebno
```

### Problem: Participant ne može login

**Provjeri:**
1. Email je confirmed u Supabase Auth
2. `has_account = true` u `participant_profiles`
3. `auth_user_id` je postavljen

**Fix:**
```sql
-- Provjeri
SELECT * FROM participant_profiles WHERE email = 'EMAIL';

-- Ako auth_user_id je NULL, provjeri auth.users
SELECT * FROM auth.users WHERE email = 'EMAIL';
```

### Problem: Admin ne vidi participante

**Provjeri:**
1. User ima `super_admin` role
2. RLS policies su aktivne
3. API endpoint vraća 200 OK

**Fix:**
```sql
-- Provjeri role
SELECT role FROM user_profiles WHERE id = 'ADMIN_ID';

-- Trebalo bi biti 'super_admin'
```

---

## 📞 Support

Ako imaš problema:
1. Provjeri logs u Supabase Dashboard → Logs
2. Provjeri browser console za frontend errors
3. Provjeri Vercel/Netlify logs za deployment errors
4. Kontaktiraj development team

---

**Sve gotovo! 🎉**
