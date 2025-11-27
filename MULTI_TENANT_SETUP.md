# 🎯 Multi-Tenant Conference Platform - Setup Instructions

## ✅ Što je Napravljeno

Implementiran je **multi-tenant sistem** koji omogućava:
- ✅ **Kreiranje više konferencija** - svaka konferencija je zasebna
- ✅ **Conference Switcher** - prebacivanje između konferencija u header-u
- ✅ **Izolacija podataka** - svaka konferencija ima svoje registracije i apstrakte
- ✅ **Conference Settings** - svaka konferencija ima svoje cijene i postavke
- ✅ **My Conferences** - pregled svih konferencija

---

## 🚀 Kako Primijeniti (CRITICAL STEP!)

### **Korak 1: Primijeni Database Migraciju**

Morate primijeniti novu SQL migraciju u Supabase:

#### **Opcija A - Preko Supabase Dashboard (preporučeno):**

1. Otvorite **Supabase Dashboard**: https://supabase.com/dashboard
2. Odaberite svoj projekt: `eceiqrhvtxieoqjyvntf`
3. Idite na **SQL Editor** (lijevi sidebar)
4. Otvorite file: `supabase/migrations/010_add_conferences_multi_tenant.sql`
5. **Kopirajte SVE** iz tog filea
6. **Paste** u Supabase SQL Editor
7. Kliknite **"Run"**

#### **Opcija B - Preko Supabase CLI:**

```bash
cd "/Users/renata/Desktop/Conference Platform"
supabase db push
```

---

### **Korak 2: Restart Dev Server**

```bash
# Ctrl+C za stop
npm run dev
```

---

## 📋 Kako Koristiti

### **1. Kreiranje Nove Konferencije**

1. Login u admin panel: http://localhost:3000/auth/admin-login
2. Idite na **"My Conferences"** u sidebar-u
3. Kliknite **"Create New Conference"**
4. Popunite form:
   - **Conference Name** (obavezno)
   - **Description, Dates, Location**
   - **Pricing** (Early Bird, Regular, Late, Student Discount)
   - **Settings** (Enable Registration, Abstracts, Payment)
5. Kliknite **"Create Conference"**

### **2. Prebacivanje Između Konferencija**

- U **header-u** admin panela vidite **Conference Switcher dropdown**
- Kliknite na dropdown
- Odaberite konferenciju
- Sve stranice (Dashboard, Registrations, Abstracts) će se filtrirati za tu konferenciju

### **3. Upravljanje Konferencijama**

- **My Conferences** stranica:
  - Pregled svih konferencija
  - Open - otvara dashboard za tu konferenciju
  - Settings - uređivanje konferencije
  - Delete - brisanje konferencije (⚠️ briše SVE podatke!)

---

## 🗄️ Database Schema - Što je Dodano

### **Nova tablica: `conferences`**
```sql
- id (UUID)
- name (TEXT) - naziv konferencije
- slug (TEXT) - URL-friendly naziv
- description, start_date, end_date, location, venue
- logo_url, website_url, primary_color
- pricing (JSONB) - cijene po kategorijama
- settings (JSONB) - postavke konferencije
- email_settings (JSONB) - email konfiguracija
- owner_id (TEXT) - trenutno "admin"
- active, published (BOOLEAN)
- created_at, updated_at
```

### **Ažurirane tablice:**
```sql
ALTER TABLE registrations ADD COLUMN conference_id UUID;
ALTER TABLE abstracts ADD COLUMN conference_id UUID;
```

---

## ⚠️ VAŽNO - Postojeći Podaci

**Postojeće registracije i apstrakti imaju `conference_id = NULL`!**

To znači:
- **Dashboard će biti prazan** za nove konferencije
- **Stari podaci neće biti vidljivi** (jer nisu povezani s konferencijom)

### **Kako Riješiti:**

#### **Opcija 1 - Kreirati "Demo Conference" za stare podatke:**

```sql
-- 1. Kreiraj demo konferenciju
INSERT INTO conferences (name, slug, owner_id, published) 
VALUES ('Demo Conference 2024', 'demo-conference-2024', 'admin', false)
RETURNING id;

-- 2. Kopiraj ID iz prethodnog query-a, npr: 'abc123...'

-- 3. Poveži sve stare registracije s demo konferencijom
UPDATE registrations 
SET conference_id = 'abc123...' -- paste ID ovdje
WHERE conference_id IS NULL;

-- 4. Poveži sve stare apstrakte s demo konferencijom
UPDATE abstracts 
SET conference_id = 'abc123...' -- paste ID ovdje
WHERE conference_id IS NULL;
```

#### **Opcija 2 - Obrisati stare podatke:**

```sql
DELETE FROM registrations WHERE conference_id IS NULL;
DELETE FROM abstracts WHERE conference_id IS NULL;
```

---

## 🔄 Sljedeći Koraci

Trebamo još ažurirati:

### **TODO #1 - Data Isolation u API Route-ovima** (KRITIČNO!)
- Ažurirati sve API route-e da filtriraju po `conference_id`
- `/api/admin/registrations` - dodati WHERE conference_id
- `/api/admin/abstracts` - dodati WHERE conference_id
- `/api/admin/payments` - dodati WHERE conference_id
- ... sve admin API route-e

### **TODO #2 - Conference Settings Stranica**
- `/admin/conferences/[id]/settings` - stranica za uređivanje konferencije
- Edit name, dates, location, pricing
- Upload logo
- Email settings

### **TODO #3 - Public Conference Pages**
- `/[slug]` - javna stranica konferencije
- `/[slug]/register` - registracija za specifičnu konferenciju
- `/[slug]/abstracts` - submit abstract za specifičnu konferenciju

---

## 🎨 UI Changes - Što je Novo

### **Admin Panel:**
- ✅ **"My Conferences"** link u sidebar-u
- ✅ **Conference Switcher** u header-u
- ✅ **My Conferences stranica** - grid sa svim konferencijama
- ✅ **Create New Conference forma** - kompletan form za kreiranje

---

## 📝 Notes

- **Owner ID** je trenutno hardcoded na `'admin'`
- **Multi-user support** će biti dodan kasnije (različiti admini za različite konferencije)
- **Row Level Security** je postavljen za sve tablice
- **ON DELETE CASCADE** - brisanje konferencije briše sve povezane podatke

---

## ❓ Trebate Pomoć?

Ako nešto ne radi:
1. Provjerite je li migracija uspješno primijenjena
2. Provjerite browser console za greške
3. Provjerite Supabase logs
4. Restartujte dev server

---

**Idemo testirati! 🚀**

