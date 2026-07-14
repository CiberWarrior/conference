# 🚀 Vodič za Deploy na Vercel

## 📋 Preduvjeti

1. ✅ GitHub repository s kodom
2. ✅ Vercel account (besplatno na [vercel.com](https://vercel.com))
3. ✅ Supabase projekt postavljen
4. ✅ Stripe account (opcionalno - za plaćanje)

## 🔧 Korak 1: Priprema za Deploy

### 1.1. Provjeri da sve radi lokalno

```bash
# Instaliraj dependencies
npm install

# Build aplikacije
npm run build

# Testiraj production build lokalno
npm start
```

### 1.2. Provjeri environment varijable

Provjeri da imaš sve potrebne environment varijable spremne za postavljanje u Vercel.

## 🌐 Korak 2: Deploy na Vercel

### 2.1. Konektuj GitHub repository

1. Idite na [vercel.com](https://vercel.com)
2. Kliknite **"Add New..."** → **"Project"**
3. Importujte GitHub repository
4. Odaberite repository: **`conference`**

### 2.2. Konfiguracija projekta

Vercel će automatski detektirati Next.js projekt. Provjerite:

- **Framework Preset**: Next.js
- **Root Directory**: `./` (ako je root, ili odaberite folder)
- **Build Command**: `npm run build` (automatski)
- **Output Directory**: `.next` (automatski)
- **Install Command**: `npm install` (automatski)

### 2.3. Postavi Environment Varijable

U Vercel projektu, idite na **Settings** → **Environment Variables** i dodajte:

#### **Obavezno:**

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

#### **Opcionalno (za Stripe plaćanje):**

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

#### **Opcionalno (za email):**

```env
# Resend Configuration (ako koristite email)
RESEND_API_KEY=re_your_resend_api_key
```

**⚠️ Važno:**
- Za **Production** koristite `sk_live_` i `pk_live_` Stripe ključeve
- Za **Preview** koristite `sk_test_` i `pk_test_` Stripe ključeve
- `NEXT_PUBLIC_APP_URL` mora biti točan production URL

### 2.4. Deploy

1. Kliknite **"Deploy"**
2. Pričekajte da se build završi (2-5 minuta)
3. Aplikacija će biti dostupna na `https://your-app.vercel.app`

## 🔗 Korak 3: Postavi Stripe Webhook

### 3.1. Stripe Dashboard

1. Idite na [dashboard.stripe.com](https://dashboard.stripe.com)
2. **Developers** → **Webhooks**
3. Kliknite **"Add endpoint"**

### 3.2. Webhook Konfiguracija

- **Endpoint URL**: `https://your-app.vercel.app/api/stripe-webhook`
- **Description**: "Conference Registration Webhook"
- **Events to send**:
  - `checkout.session.completed`
  - `payment_intent.succeeded`

### 3.3. Kopiraj Webhook Secret

1. Nakon kreiranja webhook-a, kliknite na endpoint
2. Kopirajte **"Signing secret"** (počinje s `whsec_`)
3. Dodajte u Vercel Environment Variables kao `STRIPE_WEBHOOK_SECRET`

## ✅ Korak 4: Provjera Deploy-a

### 4.1. Provjeri da aplikacija radi

1. Otvorite `https://your-app.vercel.app`
2. Provjerite da se stranica učitava
3. Testiraj registracijsku formu

### 4.2. Provjeri API rute

- ✅ `/api/register` - Registracija
- ✅ `/api/create-payment-intent` - Kreiranje payment intenta
- ✅ `/api/confirm-payment` - Potvrda plaćanja
- ✅ `/api/stripe-webhook` - Stripe webhook (testiraj iz Stripe Dashboarda)

### 4.3. Provjeri Stripe Webhook

1. U Stripe Dashboardu → **Webhooks** → **Send test webhook**
2. Odaberite event: `payment_intent.succeeded`
3. Provjeri da webhook prima zahtjev

## 🔄 Korak 5: Automatski Deploy

Nakon prvog deploy-a, Vercel će automatski deployati svaki put kada pushate na `main` branch:

```bash
git push origin main
```

Vercel će automatski:
1. Detektirati promjene
2. Pokrenuti build
3. Deployati novu verziju

## 🌍 Korak 6: Custom Domain (Opcionalno)

### 6.1. Dodaj Custom Domain

1. U Vercel projektu → **Settings** → **Domains**
2. Dodajte svoj domain (npr. `conference.example.com`)
3. Slijedite upute za DNS konfiguraciju

### 6.2. Ažuriraj Environment Varijable

Nakon postavljanja custom domain-a, ažurirajte:

```env
NEXT_PUBLIC_APP_URL=https://conference.example.com
```

I u Stripe webhook URL-u:
```
https://conference.example.com/api/stripe-webhook
```

## 🐛 Troubleshooting

### Problem: Build fails

**Rješenje:**
- Provjerite da su sve environment varijable postavljene
- Provjerite `package.json` da su svi dependencies ispravni
- Provjerite build logove u Vercel dashboardu

### Problem: Stripe webhook ne radi

**Rješenje:**
- Provjerite da je `STRIPE_WEBHOOK_SECRET` postavljen u Vercel
- Provjerite da je webhook URL točan u Stripe Dashboardu
- Provjerite da su eventi (`payment_intent.succeeded`, `checkout.session.completed`) odabrani

### Problem: Supabase connection error

**Rješenje:**
- Provjerite da su `NEXT_PUBLIC_SUPABASE_URL` i `NEXT_PUBLIC_SUPABASE_ANON_KEY` postavljeni
- Provjerite da je `SUPABASE_SERVICE_ROLE_KEY` postavljen za API rute
- Provjerite RLS politike u Supabase

### Problem: Environment varijable se ne učitavaju

**Rješenje:**
- Provjerite da su varijable postavljene za **Production** environment
- Restartajte deployment nakon dodavanja novih varijabli
- Provjerite da varijable koje počinju s `NEXT_PUBLIC_` su javne

## 📊 Monitoring

### Vercel Analytics

Vercel automatski prati:
- Performance metrike
- Error logove
- Build status

Pristupite u Vercel Dashboardu → **Analytics**

### Supabase Dashboard

Pratite:
- Database queries
- Storage usage
- API calls

Pristupite u Supabase Dashboardu

## 🔒 Security Best Practices

1. ✅ **Nikada ne commitajte** environment varijable u Git
2. ✅ Koristite **Vercel Environment Variables** za sve tajne
3. ✅ Ograničite **RLS politike** u Supabase za production
4. ✅ Koristite **production Stripe keys** samo u production environmentu
5. ✅ Redovito ažurirajte dependencies (`npm audit`)

## 📝 Checklist za Production Deploy

- [ ] Build prolazi lokalno (`npm run build`)
- [ ] Sve environment varijable postavljene u Vercel
- [ ] Stripe webhook konfiguriran s production URL-om
- [ ] `NEXT_PUBLIC_APP_URL` postavljen na production URL
- [ ] Production Stripe keys postavljeni (ne test keys)
- [ ] Supabase RLS politike provjerene
- [ ] Custom domain konfiguriran (ako koristiš)
- [ ] Testirao registraciju i plaćanje na production URL-u

## 🎉 Gotovo!

Nakon što prođete kroz sve korake, vaša aplikacija će biti live na Vercel-u!

**Production URL**: `https://your-app.vercel.app`

Sretno s deploy-om! 🚀

