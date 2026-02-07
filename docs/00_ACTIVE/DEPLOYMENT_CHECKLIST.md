# Deployment Checklist - MeetFlow Production

Ovaj dokument opisuje sve korake potrebne za uspješan deployment MeetFlow platforme na Vercel.

---

## Pre-Deployment Checklist

### 1. Kod i Build

- [ ] Sav kod je committan i pushnut na GitHub
- [ ] `npm run build` prolazi bez grešaka
- [ ] `npm run lint` ne prijavljuje greške
- [ ] Testovi prolaze (`npm test` - kad se instalira Jest)
- [ ] Nema TODO komentara u produkcijskom kodu (pregled kritičnih)

### 2. Environment Variables

#### Obavezne varijable (Vercel Environment Variables):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Stripe (Production Keys!)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
RESEND_API_KEY=re_...
ADMIN_EMAIL=admin@yourdomain.com

# Rate Limiting (Upstash)
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

#### Provjera:
- [ ] Sve varijable su postavljene u Vercel Dashboard
- [ ] Stripe koristi LIVE ključeve (ne test)
- [ ] URL-ovi su production URL-ovi
- [ ] Service role key je siguran (nije izložen klijentu)

### 3. Supabase Konfiguracija

- [ ] RLS policies su omogućene na svim tablicama
- [ ] Migracije su primijenjene (`supabase db push`)
- [ ] Storage buckets imaju pravilne politike
- [ ] Database ima backup konfiguriran
- [ ] Connection pooling je omogućen (Supabase Pooler)

### 4. Stripe Konfiguracija

- [ ] Webhook endpoint je registriran u Stripe Dashboard
- [ ] Webhook URL: `https://your-domain.com/api/stripe-webhook`
- [ ] Events za webhook: `payment_intent.succeeded`, `payment_intent.payment_failed`
- [ ] Webhook signing secret je postavljen
- [ ] Test payment u live mode radi

### 5. DNS i Domain

- [ ] Domena je kupljena i konfigurirana
- [ ] DNS records pokazuju na Vercel
- [ ] SSL certifikat je aktivan (Vercel automatski)
- [ ] www redirect je postavljen (opciono)

---

## Deployment Koraci

### Korak 1: Vercel Setup

1. **Kreiraj novi projekt na Vercel**
   - Poveži GitHub repozitorij
   - Odaberi `Next.js` kao framework preset
   - Build command: `npm run build`
   - Output directory: `.next`

2. **Postavi Environment Variables**
   - Kopiraj sve varijable iz gornje sekcije
   - Postavi za Production, Preview i Development

### Korak 2: Deploy

1. **Pokreni deployment**
   ```bash
   # Ili putem GitHub pusha
   git push origin main
   
   # Ili Vercel CLI
   vercel --prod
   ```

2. **Provjeri build log**
   - Build mora proći bez grešaka
   - Provjeri upozorenja (warnings)

### Korak 3: Post-Deployment Provjere

#### Osnovne provjere:
- [ ] Stranica se otvara bez grešaka
- [ ] Admin login radi
- [ ] Dashboard se učitava
- [ ] Konferencije se prikazuju

#### Funkcionalnost:
- [ ] Registracija sudionika radi
- [ ] Plaćanje karticom radi (mala test transakcija)
- [ ] Email notifikacije se šalju
- [ ] Check-in sistem radi

#### Sigurnost:
- [ ] HTTPS je aktivan
- [ ] Nema mixed content warnings
- [ ] Auth cookies su httpOnly i secure
- [ ] Rate limiting radi

---

## Monitoring Setup

### 1. Vercel Analytics
- [ ] Omogući Vercel Analytics u dashboardu
- [ ] Provjeri Core Web Vitals

### 2. Error Tracking (Opcionalno)
- [ ] Postavi Sentry ili Rollbar
- [ ] Konfiguriraj error alerting

### 3. Uptime Monitoring
- [ ] Postavi Better Uptime, Pingdom ili slično
- [ ] Konfiguriraj alert kad je stranica nedostupna

### 4. Database Monitoring
- [ ] Provjeri Supabase Dashboard za query performance
- [ ] Postavi alert za visoko opterećenje

---

## Rollback Plan

U slučaju problema:

1. **Vercel Rollback**
   - Idi na Vercel Dashboard > Deployments
   - Odaberi prethodni deployment
   - Klikni "Promote to Production"

2. **Database Rollback**
   - Supabase ima point-in-time recovery
   - Kontaktiraj Supabase support ako je potrebno

---

## Post-Launch Zadaci

### Tjedan 1
- [ ] Monitorirati error logove dnevno
- [ ] Provjeriti performance metriku
- [ ] Odgovoriti na user feedback
- [ ] Napraviti backup baze podataka

### Tjedan 2-4
- [ ] Analizirati usage patterns
- [ ] Optimizirati spore query-je
- [ ] Planirati bug fixes
- [ ] Pripremiti next release

---

## Kontakti za Hitne Situacije

| Servis | Kontakt | Napomena |
|--------|---------|----------|
| Vercel | support@vercel.com | Status: status.vercel.com |
| Supabase | support@supabase.io | Status: status.supabase.com |
| Stripe | support@stripe.com | Dashboard za issues |
| Resend | support@resend.com | Email delivery issues |

---

## Checklist Potpis

- **Deployer**: ________________
- **Datum**: ________________
- **Verzija**: ________________
- **Domain**: ________________

### Napomene
```
_____________________________________________________________________
_____________________________________________________________________
```
