# 🔧 Magic Link Setup Guide

Vodič za konfiguraciju Magic Link login sistema u Supabase-u.

---

## ⚠️ Najčešći problemi

### Problem 1: "Redirect URL is not configured"

**Simptomi:**
- Magic link se ne šalje
- Greška: "redirect_to" ili "Invalid redirect URL"

**Rješenje:**

1. Otvorite **Supabase Dashboard** → Vaš projekat
2. Idite na **Authentication** → **URL Configuration**
3. U sekciji **Redirect URLs**, dodajte:
   - Za development (port 3000): `http://localhost:3000/auth/callback`
   - Za development (port 3001): `http://localhost:3001/auth/callback` *(ako koristite custom port)*
   - Za production: `https://yourdomain.com/auth/callback`
4. Kliknite **Save**

**Važno:** 
- Dodajte sve URL-e koje koristite za development
- Port se određuje preko `PORT` environment variable ili `NEXT_PUBLIC_APP_URL`
- Za production, dodajte samo production URL

---

### Problem 2: Email se ne šalje

**Simptomi:**
- Forma se submit-uje bez greške
- Ali email ne stiže

**Rješenje:**

#### Opcija A: Koristite Supabase Email (Development)

1. Supabase Dashboard → **Authentication** → **Email Templates**
2. Provjerite da je **Enable email confirmations** uključeno
3. Za development, Supabase automatski šalje emaile (provjerite spam folder)

#### Opcija B: Konfigurišite Custom SMTP (Production)

1. Supabase Dashboard → **Project Settings** → **Auth**
2. Scroll do **SMTP Settings**
3. Unesite SMTP podatke:
   - **Host:** smtp.gmail.com (ili vaš SMTP server)
   - **Port:** 587
   - **Username:** vaš-email@gmail.com
   - **Password:** app password (ne obična lozinka!)
   - **Sender email:** vaš-email@gmail.com
   - **Sender name:** MeetFlow

**Za Gmail:**
- Morate kreirati "App Password" umjesto obične lozinke
- Google Account → Security → 2-Step Verification → App Passwords

---

### Problem 3: "Email service is not configured"

**Rješenje:**

1. Provjerite SMTP settings u Supabase Dashboard
2. Provjerite da je email servis aktivan
3. Za development, možete koristiti Supabase default email (provjerite spam)

---

## ✅ Checklist za konfiguraciju

### 1. Environment Variables

Provjerite da su postavljene u `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Ili ako koristite custom port:
# NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**Napomena:** Port se određuje preko `PORT` environment variable ili `NEXT_PUBLIC_APP_URL`. Ako koristite `PORT=3001`, postavite `NEXT_PUBLIC_APP_URL=http://localhost:3001`.

### 2. Supabase Auth Settings

- [ ] Redirect URLs su dodati (`/auth/callback`)
- [ ] Email confirmations su omogućene
- [ ] SMTP je konfigurisan (za production)
- [ ] Email templates su prilagođeni

### 3. Test

1. Otvorite `/auth/login`
2. Unesite email koji ima registraciju
3. Kliknite "Send Login Link"
4. Provjerite email (i spam folder)
5. Kliknite na link
6. Trebalo bi da se prijavite i redirect-ujete na dashboard

---

## 🔍 Debugging

### Provjerite server logove

Kada pokrenete `npm run dev`, trebali biste vidjeti:

```
📧 Magic link request for: user@example.com
🔧 Creating Supabase client...
✅ Supabase client created
🔍 Checking registrations for: user@example.com
✅ Registration found: uuid
📤 Attempting to send magic link...
🔗 Redirect URL: http://localhost:3000/auth/callback
# Ili ako koristite custom port:
# 🔗 Redirect URL: http://localhost:3001/auth/callback
✅ Magic link sent successfully!
```

Ako vidite greške, proverite:

1. **"Registration check error"** → Provjerite da tabela `registrations` postoji
2. **"Magic link error"** → Provjerite Redirect URLs i SMTP settings
3. **"Failed to create auth user"** → Provjerite `SUPABASE_SERVICE_ROLE_KEY`

---

## 📧 Email Template Customization

1. Supabase Dashboard → **Authentication** → **Email Templates**
2. Odaberite **Magic Link** template
3. Prilagodite HTML:

```html
<h2>Sign in to MeetFlow</h2>
<p>Click the link below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In</a></p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't request this link, you can safely ignore this email.</p>
```

---

## 🚀 Production Setup

Za production, obavezno:

1. **Dodajte production URL u Redirect URLs:**
   ```
   https://yourdomain.com/auth/callback
   ```

2. **Konfigurišite SMTP:**
   - Koristite profesionalni email servis (SendGrid, Mailgun, AWS SES)
   - Ne koristite Gmail za production (ima rate limits)

3. **Postavite `NEXT_PUBLIC_APP_URL`:**
   ```env
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

4. **Testirajte:**
   - Testirajte sa različitim email adresama
   - Provjerite da linkovi rade
   - Provjerite da redirect radi ispravno

---

## 📚 Dodatni resursi

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [SMTP Configuration](https://supabase.com/docs/guides/auth/auth-smtp)

---

**Ako i dalje imate problema, provjerite:**
1. Browser console za frontend greške
2. Server terminal za backend greške
3. Supabase Dashboard → Logs za Auth greške

