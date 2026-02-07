# 👥 User Management Guide

Ovaj dokument objašnjava kako dodati, upravljati i brisati user-e u Conference Platform sistemu.

---

## 📋 Table of Contents

1. [Tipovi User-a](#tipovi-user-a)
2. [Dodavanje Super Admin User-a](#dodavanje-super-admin-user-a)
3. [Dodavanje Conference Admin User-a](#dodavanje-conference-admin-user-a)
4. [Upravljanje User-ima](#upravljanje-user-ima)
5. [Resetovanje Password-a](#resetovanje-password-a)
6. [Deaktivacija User-a](#deaktivacija-user-a)
7. [Troubleshooting](#troubleshooting)

---

## 🎭 Tipovi User-a

Sistem podržava 2 tipa user-a sa različitim nivoom pristupa:

### **1. Super Admin** 👑
- **Pristup:** Potpun pristup svim funkcijama
- **Može:**
  - ✅ Kreirati nove konferencije
  - ✅ Videti SVE konferencije
  - ✅ Upravljati svim registracijama, payments, abstracts
  - ✅ Dodavati nove Conference Admin user-e
  - ✅ Pregledati Sales & Leads (Inquiries)
  - ✅ Eksportovati sve podatke
  - ✅ Deaktivirati/aktivirati user-e

**Ko treba da bude Super Admin:**
- Ti (vlasnik platforme)
- Članovi tima koji upravljaju celom platformom
- Max 2-3 osobe

---

### **2. Conference Admin** 🎯
- **Pristup:** Samo dodeljene konferencije
- **Može:**
  - ✅ Videti SAMO svoje konferencije
  - ✅ Upravljati registracijama za svoje konferencije
  - ✅ Pregledati i eksportovati podatke
  - ✅ Upravljati payments, abstracts, check-in
  - ✅ Generisati certifikate
- **NE MOŽE:**
  - ❌ Kreirati nove konferencije
  - ❌ Videti tuđe konferencije
  - ❌ Pregledati Inquiries
  - ❌ Dodavati nove user-e

**Ko treba da bude Conference Admin:**
- Tvoji klijenti (organizatori konferencija)
- Partneri koji organizuju svoje konferencije
- Spoljni saradnici

---

## 👑 Dodavanje Super Admin User-a

### **KORAK 1: Otvori Supabase Dashboard**

1. Idi na: https://supabase.com/dashboard
2. Klikni na svoj projekat
3. U levom meniju klikni: **Authentication** → **Users**

---

### **KORAK 2: Kreiraj Novog User-a**

1. Klikni **"Add User"** dugme (gore desno)
2. Pojavi će se forma sa opcijama:

**Popuni sledeće:**

```
┌─────────────────────────────────────────┐
│  Email:    novi.admin@example.com       │
│  Password: IzaberiJakPassword123!       │
│                                         │
│  ☑ Auto Confirm User (OBAVEZNO!)       │
│  ☐ Send invitation email                │
└─────────────────────────────────────────┘
```

**VAŽNO:** 
- ✅ **MORA** biti čekirano "Auto Confirm User"
- ❌ **NE** čekiraj "Send invitation email" (osim ako ne želiš da pošalješ email)

3. Klikni **"Create User"**

---

### **KORAK 3: Kopiraj User ID**

Nakon kreiranja user-a:

1. Pronaći ćeš novog user-a u listi
2. Klikni na user-a da otvoriš detalje
3. **Kopiraj UUID** (npr. `efbbe1ca-e3e6-432e-a19a-f6f4161c32fe`)

---

### **KORAK 4: Kreiraj User Profile**

1. U Supabase Dashboard, idi na: **SQL Editor** (levi meni)
2. Klikni **"New Query"**
3. **Kopiraj ovaj SQL kod:**

```sql
-- Zameni sa UUID-jem iz koraka 3
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  role,
  active,
  phone,
  organization,
  created_at,
  updated_at
) VALUES (
  'PASTE_USER_UUID_HERE',           -- 👈 Zameni sa UUID-jem
  'novi.admin@example.com',          -- 👈 Zameni sa email-om
  'Ime Prezime',                     -- 👈 Promeni ime
  'super_admin',                     -- ⚠️ NE MENJAJ - super_admin role
  true,                              -- User je aktivan
  '+123456789',                      -- Opciono: telefon
  'Naziv Organizacije',              -- Opciono: organizacija
  NOW(),
  NOW()
);
```

4. **Zameni vrednosti:**
   - `PASTE_USER_UUID_HERE` → UUID iz koraka 3
   - `novi.admin@example.com` → Email adresa
   - `Ime Prezime` → Puno ime user-a
   - Phone i organization su opcioni

5. Klikni **"Run"** (ili F5)

---

### **KORAK 5: Proveri Da Li Je Kreiran**

```sql
SELECT * FROM user_profiles WHERE email = 'novi.admin@example.com';
```

Trebalo bi da vidiš:
- ✅ ID, email, full_name
- ✅ role = `super_admin`
- ✅ active = `true`

---

### **KORAK 6: Testraj Login**

1. Otvori: `http://localhost:3001/auth/admin-login` (ili production URL)
2. Uloguj se sa:
   - Email: `novi.admin@example.com`
   - Password: Onaj koji si postavio u koraku 2
3. Trebalo bi da uđeš u dashboard sa punim pristupom!

---

## 🎯 Dodavanje Conference Admin User-a

Conference Admin ima pristup SAMO dodeljenim konferencijama.

### **KORAK 1-4: Isti Kao Za Super Admin**

Uradi korake 1-4 kao za Super Admin, ali u **Koraku 4** koristi ovaj SQL:

```sql
INSERT INTO user_profiles (
  id,
  email,
  full_name,
  role,                              -- 👈 RAZLIKA: conference_admin
  active,
  phone,
  organization,
  created_at,
  updated_at
) VALUES (
  'PASTE_USER_UUID_HERE',
  'klijent@conference.com',
  'Ime Klijenta',
  'conference_admin',                -- ⚠️ conference_admin role
  true,
  '+123456789',
  'Naziv Konferencije d.o.o.',
  NOW(),
  NOW()
);
```

---

### **KORAK 5: Dodeli Konferenciju**

Conference Admin NE MOŽE videti konferencije dok mu ne dodiš pristup.

**Opcija A: Dodeli postojeću konferenciju**

```sql
-- 1. Prvo pronađi ID konferencije
SELECT id, name FROM conferences;

-- 2. Dodeli pristup (zameni UUID-ove)
INSERT INTO conference_permissions (
  user_id,                           -- UUID Conference Admin user-a
  conference_id,                     -- UUID konferencije
  can_view_registrations,
  can_export_data,
  can_manage_payments,
  can_manage_abstracts,
  can_check_in,
  can_generate_certificates,
  can_edit_conference,
  can_delete_data,
  granted_by,                        -- Tvoj Super Admin UUID
  granted_at
) VALUES (
  'CONFERENCE_ADMIN_UUID',           -- 👈 UUID Conference Admin user-a
  'CONFERENCE_UUID',                 -- 👈 UUID konferencije
  true,                              -- Može videti registracije
  true,                              -- Može eksportovati podatke
  true,                              -- Može upravljati payments
  true,                              -- Može upravljati abstracts
  true,                              -- Može raditi check-in
  true,                              -- Može generisati certifikate
  false,                             -- NE može editovati conference settings
  false,                             -- NE može brisati podatke
  'YOUR_SUPER_ADMIN_UUID',           -- 👈 Tvoj UUID
  NOW()
);
```

**Opcija B: Kreiraj novu konferenciju za njega**

1. Uloguj se kao Super Admin
2. Idi na **My Conferences** → **Create New Conference**
3. Popuni detalje i kreiraj
4. Nakon kreiranja, koristi SQL iz Opcije A da mu dodeliš pristup

---

### **KORAK 6: Testraj Login Conference Admin-a**

1. Uloguj se kao Conference Admin
2. Trebalo bi da vidiš:
   - ✅ Dashboard sa stats SAMO za dodeljene konferencije
   - ✅ Sidebar BEZ "My Conferences" i "Inquiries" linkova
   - ✅ Samo konferencije koje mu je dodeljene

---

## 🔧 Upravljanje User-ima

### **Pregled Svih User-a**

```sql
SELECT 
  id,
  email,
  full_name,
  role,
  active,
  organization,
  last_login,
  created_at
FROM user_profiles
ORDER BY created_at DESC;
```

---

### **Pregled Conference Admin User-a Sa Njihovim Konferencijama**

```sql
SELECT 
  up.email AS admin_email,
  up.full_name AS admin_name,
  c.name AS conference_name,
  cp.can_view_registrations,
  cp.can_export_data,
  cp.can_manage_payments
FROM user_profiles up
JOIN conference_permissions cp ON up.id = cp.user_id
JOIN conferences c ON cp.conference_id = c.id
WHERE up.role = 'conference_admin'
ORDER BY up.email, c.name;
```

---

## 🔑 Resetovanje Password-a

### **Metoda 1: Preko Supabase Dashboard**

1. **Authentication** → **Users**
2. Pronađi user-a
3. Klikni **"..."** (tri tačkice)
4. Klikni **"Reset Password"**
5. Opcije:
   - **A:** Send reset email → User dobije link na email
   - **B:** Update password directly → Postavi novi password odmah

**Metoda B (direktna promena):**
```
1. Klikni "Update User"
2. U "Password" polje unesi novi password
3. Klikni "Save"
4. Javi user-u novi password
```

---

### **Metoda 2: SQL (za batch operacije)**

```sql
-- NE MOŽE SE DIREKTNO - mora preko Supabase Auth API
-- Najbolje koristiti Metodu 1 (Dashboard)
```

---

## 🚫 Deaktivacija User-a

Umesto brisanja, deaktiviraj user-a (može se ponovo aktivirati):

```sql
-- Deaktiviraj user-a
UPDATE user_profiles
SET 
  active = false,
  updated_at = NOW()
WHERE email = 'user@example.com';

-- Ponovo aktiviraj
UPDATE user_profiles
SET 
  active = true,
  updated_at = NOW()
WHERE email = 'user@example.com';
```

**Deaktivirani user:**
- ❌ NE MOŽE se ulogovati (vidi grešku "Account deactivated")
- ✅ Podaci ostaju u sistemu
- ✅ Može se ponovo aktivirati

---

## 🗑️ Brisanje User-a (Opasno!)

**⚠️ UPOZORENJE:** Ovo je PERMANENTNO!

```sql
-- 1. Prvo obriši permissions
DELETE FROM conference_permissions WHERE user_id = 'USER_UUID';

-- 2. Obriši profile
DELETE FROM user_profiles WHERE id = 'USER_UUID';

-- 3. Obriši iz Supabase Auth
-- Ovo mora preko Dashboard: Authentication → Users → Delete
```

**Preporuka:** Umesto brisanja, koristi deaktivaciju!

---

## 🐛 Troubleshooting

### **Problem: User ne može da se uloguje - "Invalid credentials"**

**Proveri:**
1. Email i password tačni?
2. User postoji u Supabase Auth? (Authentication → Users)
3. User profile postoji? 
   ```sql
   SELECT * FROM user_profiles WHERE email = 'user@example.com';
   ```
4. User je aktivan?
   ```sql
   SELECT active FROM user_profiles WHERE email = 'user@example.com';
   ```

---

### **Problem: Conference Admin ne vidi konferencije**

**Proveri:**
1. Da li mu je dodeljena konferencija?
   ```sql
   SELECT c.name 
   FROM conferences c
   JOIN conference_permissions cp ON c.id = cp.conference_id
   WHERE cp.user_id = 'USER_UUID';
   ```

2. Dodeli mu konferenciju (vidi [Korak 5](#korak-5-dodeli-konferenciju))

---

### **Problem: "User profile not found" pri login-u**

**Rešenje:**
```sql
-- Kreiraj user_profile za postojećeg auth user-a
INSERT INTO user_profiles (id, email, full_name, role, active)
VALUES (
  'AUTH_USER_UUID',          -- UUID iz Authentication → Users
  'user@example.com',
  'Ime Prezime',
  'conference_admin',        -- ili 'super_admin'
  true
);
```

---

### **Problem: User vidi sve konferencije (trebalo bi samo svoje)**

**Uzrok:** User je možda `super_admin` umesto `conference_admin`

**Proveri:**
```sql
SELECT role FROM user_profiles WHERE email = 'user@example.com';
```

**Ispravi:**
```sql
UPDATE user_profiles 
SET role = 'conference_admin' 
WHERE email = 'user@example.com';
```

---

## 📊 Korisni SQL Queries

### **Statistika User-a**

```sql
SELECT 
  role,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE active = true) as active_users,
  COUNT(*) FILTER (WHERE last_login IS NOT NULL) as users_who_logged_in,
  COUNT(*) FILTER (WHERE last_login > NOW() - INTERVAL '7 days') as active_last_7_days
FROM user_profiles
GROUP BY role;
```

---

### **User-i Koji Se Nikad Nisu Ulogovali**

```sql
SELECT 
  email,
  full_name,
  role,
  created_at
FROM user_profiles
WHERE last_login IS NULL
ORDER BY created_at DESC;
```

---

### **Pregled Permissions Po Konferencijama**

```sql
SELECT 
  c.name AS conference,
  COUNT(cp.user_id) AS total_admins,
  STRING_AGG(up.email, ', ') AS admin_emails
FROM conferences c
LEFT JOIN conference_permissions cp ON c.id = cp.conference_id
LEFT JOIN user_profiles up ON cp.user_id = up.id
GROUP BY c.name
ORDER BY total_admins DESC;
```

---

## 🎯 Best Practices

### **Security:**
1. ✅ Koristi jake passworde (min 12 karaktera, mešavina)
2. ✅ Deaktiviraj user-e koji više ne rade (umesto brisanja)
3. ✅ Redovno pregledaj `last_login` - deaktiviraj neaktivne
4. ✅ Conference Admin-i SAMO za svoje konferencije

### **Organizacija:**
1. ✅ Koristi smislene email adrese (`admin@company.com` umesto `user123@gmail.com`)
2. ✅ Popuni `organization` polje
3. ✅ Dodaj telefon za hitne kontakte
4. ✅ Dokumentuj ko ima pristup

### **Maintainance:**
1. ✅ Redovno pregledaj neaktivne user-e
2. ✅ Proveri da Conference Admin-i imaju samo potrebne permissions
3. ✅ Audit log provjera (ko šta radi)

---

## 📝 Quick Reference

### **Kreiranje Super Admin (Jedan Command)**

```sql
-- 1. Prvo kreiraj user-a u Supabase Dashboard (Authentication → Add User)
-- 2. Kopiraj UUID
-- 3. Pokreni ovaj SQL:

INSERT INTO user_profiles (id, email, full_name, role, active)
VALUES (
  'PASTE_UUID_HERE',
  'admin@example.com',
  'Admin Name',
  'super_admin',
  true
);
```

---

### **Kreiranje Conference Admin + Dodela Konferencije**

```sql
-- 1. Kreiraj user-a u Dashboard
-- 2. Pokreni:

BEGIN;

-- Kreiraj profile
INSERT INTO user_profiles (id, email, full_name, role, active)
VALUES ('USER_UUID', 'client@example.com', 'Client Name', 'conference_admin', true);

-- Dodeli konferenciju
INSERT INTO conference_permissions (
  user_id, conference_id,
  can_view_registrations, can_export_data, can_manage_payments,
  can_manage_abstracts, can_check_in, can_generate_certificates,
  can_edit_conference, can_delete_data, granted_by
) VALUES (
  'USER_UUID', 'CONFERENCE_UUID',
  true, true, true, true, true, true, false, false, 'YOUR_SUPER_ADMIN_UUID'
);

COMMIT;
```

---

## 🆘 Support

Ako imaš problema:
1. Proveri [Troubleshooting](#troubleshooting) sekciju
2. Proveri server logs (`npm run dev`)
3. Proveri browser console (F12)
4. Kontaktiraj developera

---

**Poslednje ažurirano:** November 29, 2025  
**Verzija:** 1.0

