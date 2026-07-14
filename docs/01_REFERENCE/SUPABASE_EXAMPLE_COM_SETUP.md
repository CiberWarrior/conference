# 🔧 Supabase Configuration za example.com Domenu

Vodič za konfiguraciju Supabase-a da prihvaća `example.com` email domenu za development.

---

## ⚠️ Problem

Supabase standardni SMTP server **blokira `example.com` domenu** iz sigurnosnih razloga. Ovo je security best practice jer `example.com` je rezervisana domena za dokumentaciju.

**Greška:**
```
Error: Email address "testuser@example.com" is invalid
```

---

## ✅ Rješenja

### Opcija 1: Custom SMTP Server (Preporučeno za Development)

Konfiguriraj custom SMTP server u Supabase Dashboardu koji će prihvatiti `example.com` domenu.

#### Koraci:

1. **Izaberi SMTP Provider:**
   - **Gmail** (najlakše za development)
   - **SendGrid** (besplatno do 100 emaila/dan)
   - **Resend** (besplatno do 3,000 emaila/mjesec)
   - **Mailgun** (besplatno do 5,000 emaila/mjesec)

2. **Konfiguriraj SMTP u Supabase Dashboardu:**
   
   **Lokacija:** Supabase Dashboard → Project Settings → Auth → SMTP Settings
   
   **Za Gmail:**
   ```
   Host: smtp.gmail.com
   Port: 587
   Username: your-email@gmail.com
   Password: [App Password - ne obična lozinka!]
   Sender email: your-email@gmail.com
   Sender name: MeetFlow
   ```
   
   **Za SendGrid:**
   ```
   Host: smtp.sendgrid.net
   Port: 587
   Username: apikey
   Password: [SendGrid API Key]
   Sender email: your-email@yourdomain.com
   Sender name: MeetFlow
   ```
   
   **Za Resend:**
   ```
   Host: smtp.resend.com
   Port: 587
   Username: resend
   Password: [Resend API Key]
   Sender email: your-email@yourdomain.com
   Sender name: MeetFlow
   ```

3. **Kreiraj Gmail App Password (ako koristiš Gmail):**
   - Google Account → Security → 2-Step Verification → App Passwords
   - Generiši App Password za "Mail"
   - Koristi taj password umjesto obične lozinke

4. **Testiraj:**
   - Provjeri da email funkcionalnost radi (npr. registration confirmation email)
   - Provjeri da email stiže

---

### Opcija 2: Koristi Pravi Email Domen (Najlakše)

Umjesto `example.com`, koristi pravi email domen za testiranje:

1. **Kreiraj test registraciju sa pravim emailom:**
   ```sql
   INSERT INTO registrations (
     first_name,
     last_name,
     email,
     phone,
     payment_status
   ) VALUES (
     'Test',
     'User',
     'testuser@gmail.com',  -- 👈 Koristi pravi email
     '+1234567890',
     'not_required'
   );
   ```

2. **Provjeri da email funkcionalnost radi**

---

### Opcija 3: Supabase Local Development (Ako koristiš Supabase CLI)

Ako koristiš Supabase CLI za lokalni development, možeš konfigurisati lokalni SMTP server.

**Provjeri `supabase/config.toml`:**
```toml
[auth.email]
enable_signup = true
double_confirm_changes = true
enable_confirmations = false
```

**Napomena:** Lokalni Supabase development može imati drugačije ograničenja.

---

## 🔍 Provjera Konfiguracije

### 1. Provjeri Supabase SMTP Settings

**Lokacija:** Supabase Dashboard → Project Settings → Auth → SMTP Settings

**Provjeri:**
- ✅ SMTP je konfigurisan
- ✅ Sender email je postavljen
- ✅ Test email radi

---

### 2. Provjeri Redirect URLs

**Lokacija:** Supabase Dashboard → Authentication → URL Configuration

**Dodaj:**
- `http://localhost:3000/auth/callback`
- Ako koristiš drugi port (npr. 3001), dodaj: `http://localhost:3001/auth/callback`

---

### 3. Test Email Functionality

**Komanda:**
```bash
# Test registration confirmation email
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "conference_id": "your-conference-id",
    "first_name": "Test",
    "last_name": "User",
    "email": "testuser@example.com",
    "phone": "+1234567890"
  }'
```

**Očekivani rezultat:**
- Registration successful
- Confirmation email sent

---

## 📋 Checklist

- [ ] SMTP server konfigurisan u Supabase Dashboardu
- [ ] Sender email postavljen
- [ ] Test email radi
- [ ] Registration confirmation email testiran

---

## 🐛 Troubleshooting

### Problem: "Email address is invalid"

**Uzrok:** Supabase standardni SMTP blokira `example.com`

**Rješenje:** Konfiguriraj custom SMTP server (Opcija 1)

---

### Problem: "SMTP connection failed"

**Uzrok:** Neispravni SMTP credentials

**Rješenje:**
- Provjeri SMTP credentials
- Za Gmail, koristi App Password (ne običnu lozinku)
- Provjeri da je 2-Step Verification uključeno na Gmail accountu

---

### Problem: Email se ne šalje

**Uzrok:** SMTP nije pravilno konfigurisan

**Rješenje:**
- Provjeri SMTP settings u Supabase Dashboardu
- Provjeri da je sender email ispravan
- Testiraj SMTP connection

---

## 💡 Preporuke

1. **Za Development:** Koristi Gmail sa App Password (najlakše setup)
2. **Za Production:** Koristi profesionalni SMTP servis (SendGrid, Resend, Mailgun)
3. **Za Testiranje:** Možeš koristiti pravi email domen umjesto `example.com`

---

**Za detaljne upute o SMTP konfiguraciji, pogledaj:**
- [Supabase SMTP Documentation](https://supabase.com/docs/guides/auth/auth-smtp)

