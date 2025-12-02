# 🔐 User Login System (Magic Link)

Dokumentacija za Magic Link login sistem za korisnike konferencijske platforme.

---

## 📋 Sadržaj

1. [Pregled](#pregled)
2. [Kako radi](#kako-radi)
3. [Implementirane funkcionalnosti](#implementirane-funkcionalnosti)
4. [Korištenje](#korištenje)
5. [Sigurnost](#sigurnost)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Pregled

Magic Link login sistem omogućava korisnicima (participantima konferencija) da se prijave bez lozinke. Umjesto lozinke, korisnici dobivaju jedinstveni link na email koji služi za prijavu.

### Prednosti:
- ✅ Nema lozinki za pamćenje
- ✅ Sigurnije od tradicionalnih lozinki
- ✅ Jednostavnije za korisnike
- ✅ Automatsko kreiranje računa pri registraciji

---

## 🔄 Kako radi

### 1. Registracija
Kada se korisnik registrira za konferenciju:
1. Podaci se spremaju u `registrations` tabelu
2. Automatski se kreira Auth korisnik u Supabase Auth
3. Korisnik dobiva confirmation email

### 2. Prijava (Login)
1. Korisnik otvori `/auth/login`
2. Unese svoj email
3. Klikne "Send Login Link"
4. Dobije email s magic linkom
5. Klikne na link u emailu
6. Automatski se prijavi i preusmjeri na dashboard

### 3. Dashboard
Nakon prijave, korisnik vidi:
- Sve svoje registracije
- Status plaćanja
- Detalje konferencija
- Mogućnost odjave

---

## ✨ Implementirane funkcionalnosti

### Backend API rute

#### 1. `POST /api/auth/magic-link`
Šalje magic link na email korisnika.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Check your email for a login link..."
}
```

#### 2. `GET /auth/callback`
Obrađuje callback nakon klika na magic link.

**Query parametri:**
- `token_hash` - Token za verifikaciju
- `type` - Tip tokena
- `next` - URL za redirect (opcionalno)

#### 3. `POST /api/auth/user-logout`
Odjavljuje korisnika i logira aktivnost.

#### 4. `GET /api/user/registrations`
Dohvaća sve registracije prijavljenog korisnika.

**Response:**
```json
{
  "registrations": [
    {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "payment_status": "paid",
      "conferences": {
        "name": "Conference Name",
        "start_date": "2024-12-01",
        "location": "Zagreb, Croatia"
      }
    }
  ]
}
```

### Frontend stranice

#### 1. `/auth/login` - Login stranica
- Email input
- "Send Login Link" button
- Success/error poruke
- Link na registraciju

#### 2. `/user/dashboard` - User Dashboard
- Pregled svih registracija
- Status plaćanja
- Detalji konferencija
- Sign out button

### Database

#### `user_activity_log` tabela
Prati sve aktivnosti korisnika:
- Login/logout
- Pregled registracija
- IP adresa, user agent
- Timestamp

**Struktura:**
```sql
CREATE TABLE user_activity_log (
  id UUID PRIMARY KEY,
  user_id UUID,
  user_email VARCHAR(255),
  action VARCHAR(100),
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(255),
  created_at TIMESTAMP
);
```

### Helper funkcije

#### `logUserActivity()`
Logira aktivnost korisnika.

```typescript
await logUserActivity('login', {
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  details: { method: 'magic_link' }
})
```

---

## 📖 Korištenje

### Za korisnike

1. **Registracija:**
   - Registrirajte se za konferenciju na homepage
   - Dobit ćete confirmation email

2. **Prijava:**
   - Idite na `/auth/login`
   - Unesite email koji ste koristili za registraciju
   - Kliknite "Send Login Link"
   - Provjerite email i kliknite na link
   - Automatski ćete biti prijavljeni

3. **Dashboard:**
   - Nakon prijave vidite sve svoje registracije
   - Možete vidjeti status plaćanja
   - Možete se odjaviti

### Za administratore

1. **Pregled aktivnosti:**
   - Sve aktivnosti korisnika se logiraju u `user_activity_log`
   - Možete vidjeti tko se prijavio, kada, odakle

2. **Upravljanje:**
   - Administratori i dalje koriste `/auth/admin-login`
   - Odvojeni sistemi za administratore i korisnike

---

## 🔐 Sigurnost

### Implementirane mjere:

1. **Magic Link Security:**
   - Linkovi expire nakon 1 sata
   - Jednokratni su (ne mogu se ponovno koristiti)
   - Supabase Auth upravlja tokenima

2. **Session Management:**
   - httpOnly cookies
   - Automatski expiry
   - Refresh tokens

3. **Activity Tracking:**
   - Sve prijave se logiraju
   - IP adrese i user agents se spremaju
   - Timestamp svih aktivnosti

4. **Authentication:**
   - Middleware zaštićuje `/user/*` rute
   - API rute provjeravaju autentifikaciju
   - RLS politike u bazi podataka

5. **Privacy:**
   - Ne otkrivamo postoji li email u sustavu
   - "If account exists..." poruke

---

## 🔧 Konfiguracija

### Environment varijable:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Supabase Email Template:

1. Supabase Dashboard → Authentication → Email Templates
2. Odaberite "Magic Link"
3. Prilagodite template:

```html
<h2>Sign in to MeetFlow</h2>
<p>Click the link below to sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In</a></p>
<p>This link will expire in 1 hour.</p>
```

---

## 🐛 Troubleshooting

### Problem: Magic link ne radi

**Rješenje:**
1. Provjerite email spam folder
2. Provjerite da je `NEXT_PUBLIC_APP_URL` ispravno postavljen
3. Provjerite Supabase Email Template
4. Link traje samo 1 sat

### Problem: "Invalid or expired token"

**Rješenje:**
- Link je iskorišten ili expirao
- Zatražite novi link

### Problem: "No registrations found"

**Rješenje:**
- Korisnik se možda nije registrirao za nijednu konferenciju
- Provjerite da email odgovara onom iz registracije

### Problem: Korisnik se ne može prijaviti

**Rješenje:**
1. Provjerite da je email ispravan
2. Provjerite da korisnik ima registraciju
3. Provjerite Supabase Auth logs
4. Zatražite novi magic link

---

## 📊 Monitoring

### Activity Log

Pregled aktivnosti korisnika:

```sql
SELECT 
  user_email,
  action,
  created_at,
  ip_address
FROM user_activity_log
WHERE action IN ('login', 'logout')
ORDER BY created_at DESC
LIMIT 100;
```

### Statistika prijava:

```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as login_count
FROM user_activity_log
WHERE action = 'login'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 🎯 Sljedeći koraci (opcionaln o)

Funkcionalnosti koje se mogu dodati kasnije:

1. **User Profile**
   - Uređivanje profila
   - Promjena emaila
   - Deaktivacija računa

2. **Advanced Tracking**
   - Real-time activity monitor
   - Security events
   - Failed login attempts

3. **Notifications**
   - Email notifikacije
   - Push notifikacije
   - SMS notifikacije

4. **Multi-factor Authentication**
   - 2FA
   - SMS verification
   - App-based authentication

---

## ✅ Implementirano

- ✅ Magic Link login
- ✅ User Dashboard
- ✅ Activity tracking
- ✅ Middleware zaštita
- ✅ Automatsko kreiranje Auth korisnika
- ✅ Session management
- ✅ Logout funkcionalnost

---

**Verzija:** 1.0  
**Datum:** December 2024  
**Status:** Production Ready

