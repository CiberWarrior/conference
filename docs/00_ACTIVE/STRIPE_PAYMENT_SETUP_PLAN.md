# 💳 Stripe Payment Setup Guide - MeetFlow

**Datum:** 2026-07-14  
**Status:** Priprema za implementaciju  
**Cilj:** Dodati Stripe plaćanje nakon uspješnog beta testiranja

---

## 📋 **TIMELINE - 3 FAZE**

### **FAZA 1: Beta Test BEZ Plaćanja** ✅ (SADA)
- Testiraj osnovne funkcionalnosti
- Registracija sa "Pay Later" opcijom
- Provjeri da sve radi kako treba
- Trajanje: 1-2 sedmice

### **FAZA 2: Stripe Setup** ⏳ (KASNIJE)
- Setup Stripe account
- Konfiguriši keys
- Setup webhook
- Trajanje: 2-3 sata

### **FAZA 3: Payment Testing** ⏳ (NAKON SETUP-A)
- Test mode plaćanje
- Test kartice
- Provjera webhook-a
- Live mode aktivacija

---

## 🔧 **FAZA 2: STRIPE SETUP KORACI**

### **Korak 1: Kreiraj Stripe Account (10 min)**

1. **Otvori:** https://dashboard.stripe.com/register
2. **Kreiraj account:**
   - Email: (tvoj business email)
   - Password: (siguran password)
   - Country: Croatia / United States
3. **Verifikuj email**
4. **Ostani u TEST MODE** (za sada)
   - Check da piše "Test mode" u gornjem lijevom uglu
   - Ne aktiviraj live mode dok ne testiraš!

---

### **Korak 2: Dobij API Keys (5 min)**

1. **U Stripe Dashboard:**
   - Klikni **Developers** (lijevi menu)
   - Klikni **API keys**

2. **Copy TEST keys:**
   ```
   Publishable key: pk_test_51...
   Secret key: sk_test_51...
   ```

3. **⚠️ VAŽNO:**
   - Koristi SAMO **test** keys (pk_test_ i sk_test_)
   - NE koristi live keys dok ne testiraš!
   - Live keys su za pravo plaćanje sa pravim karticama

---

### **Korak 3: Dodaj Keys u Localhost (5 min)**

**Uredi:** `.env.local`

**Zamijeni linije 23-25 sa:**
```bash
# Stripe Configuration (TEST MODE)
STRIPE_SECRET_KEY=sk_test_tvoj_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_tvoj_publishable_key
# STRIPE_WEBHOOK_SECRET=whsec_your_secret (dodati kasnije)
```

**Restart dev server:**
```bash
# Ctrl+C za stop
npm run dev
```

---

### **Korak 4: Dodaj Keys na Vercel (10 min)**

1. **Otvori:** https://vercel.com/dashboard
2. **Odaberi projekt:** meetflow
3. **Idi na:** Settings → Environment Variables
4. **Dodaj 2 nove varijable:**

**Varijabla 1:**
```
Name: STRIPE_SECRET_KEY
Value: sk_test_tvoj_secret_key
Environment: All (Production, Preview, Development)
```

**Varijabla 2:**
```
Name: NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
Value: pk_test_tvoj_publishable_key
Environment: All
```

5. **Redeploy:**
   - Deployments → ... → Redeploy

---

### **Korak 5: Setup Stripe Webhook (15 min)**

**Što je webhook?**
- Stripe šalje notifikaciju aplikaciji kada se plaćanje desi
- Aplikacija ažurira payment status automatski

**Setup:**

1. **U Stripe Dashboard:**
   - Developers → Webhooks
   - Klikni **Add endpoint**

2. **Za LOCALHOST testing:**
   ```
   Endpoint URL: http://localhost:3000/api/stripe-webhook
   Description: Local testing
   Events: payment_intent.succeeded, payment_intent.payment_failed
   ```
   **Ili koristi Stripe CLI** (preporučeno):
   ```bash
   # Install Stripe CLI
   brew install stripe/stripe-cli/stripe
   
   # Login
   stripe login
   
   # Forward webhook to localhost
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   
   # Copy webhook secret koji dobiješ (whsec_...)
   ```

3. **Za PRODUCTION:**
   ```
   Endpoint URL: https://your-url.vercel.app/api/stripe-webhook
   Description: Production webhook
   Events: payment_intent.succeeded, payment_intent.payment_failed
   ```

4. **Copy Webhook Secret:**
   - Nakon kreiranja, copy "Signing secret" (whsec_...)
   - Dodaj u `.env.local`:
     ```bash
     STRIPE_WEBHOOK_SECRET=whsec_tvoj_webhook_secret
     ```
   - Dodaj na Vercel (kao env var)

---

## 🧪 **FAZA 3: PAYMENT TESTING**

### **Test na Localhost (30 min)**

1. **Pokreni app:**
   ```bash
   npm run dev
   # Otvori: http://localhost:3000
   ```

2. **Kreiraj test konferenciju**
3. **Otvori registraciju:** `/conferences/test/register`
4. **Odaberi:** "Pay Now - Credit Card"
5. **Koristi Stripe test karticu:**
   ```
   Card number: 4242 4242 4242 4242
   Expiry: 12/34 (bilo koji budući datum)
   CVC: 123 (bilo koja 3 broja)
   Name: Test User
   ```

6. **Submit formu**

**✅ OČEKIVANO:**
- Payment se procesira
- "Payment successful" poruka
- U admin: payment_status = "completed"
- U Stripe dashboard: vidiš payment

**❌ GREŠKA:**
- "Payment failed" → Provjeri keys
- Webhook error → Provjeri webhook secret
- Network error → Provjeri da je Stripe CLI ili webhook aktivan

---

### **Test na Production (30 min)**

**Nakon što localhost radi:**

1. **Deploy na Vercel** (sa svim keys)
2. **Otvori production URL**
3. **Testiraj payment** (ista test kartica)
4. **Provjeri:**
   - Payment radi?
   - Webhook ažurira status?
   - Stripe dashboard pokazuje payment?

---

## 📊 **STRIPE TEST KARTICE**

### **Uspješna Plaćanja:**
```
4242 4242 4242 4242 - Osnovna
4000 0566 5566 5556 - 3D Secure (authentication)
```

### **Neuspješna Plaćanja (za testiranje grešaka):**
```
4000 0000 0000 0002 - Card declined
4000 0000 0000 9995 - Insufficient funds
4000 0000 0000 0069 - Expired card
```

**Za sve kartice:**
- Expiry: bilo koji budući datum
- CVC: bilo koja 3 broja
- ZIP: bilo koji 5-znamenkasti

---

## ✅ **KADA JE STRIPE SPREMAN ZA LIVE?**

### **Checklist prije LIVE mode:**
- [ ] Test mode plaćanja rade perfektno
- [ ] Webhook radi (status se ažurira)
- [ ] Registracije se spremaju sa correct payment status
- [ ] Admin vidi payment history
- [ ] Payment confirmations rade
- [ ] Testirao sa 5+ test transakcija
- [ ] Nema grešaka u console/logs

### **Aktivacija LIVE mode:**
1. **U Stripe Dashboard:**
   - Complete business verification
   - Activate live mode
2. **Copy LIVE keys:**
   ```
   pk_live_...
   sk_live_...
   ```
3. **Zamijeni TEST keys sa LIVE keys:**
   - U `.env.local`
   - Na Vercel-u
4. **Setup LIVE webhook:**
   - Sa production URL-om
   - Copy live webhook secret
5. **Test sa pravom karticom** (mala suma, npr. $0.50)
6. **Ako radi → GO LIVE!** 🚀

---

## 🚨 **VAŽNA UPOZORENJA**

### **Test Mode:**
- ✅ Besplatno
- ✅ Test kartice
- ✅ Nema pravog novca
- ✅ Za development i testing

### **Live Mode:**
- ⚠️ Prave kartice
- ⚠️ Pravi novac
- ⚠️ Stripe fees (2.9% + $0.30)
- ⚠️ Samo za production

### **Sigurnost:**
- ❌ NIKAD ne commituj API keys u Git
- ❌ NIKAD ne dijelji secret keys
- ❌ NIKAD ne koristi live keys u test mode
- ✅ Uvijek koristi environment variables
- ✅ `.env.local` je u `.gitignore`

---

## 📝 **PAYMENT TESTING CHECKLIST**

### **Localhost Testing:**
- [ ] Stripe keys dodati u `.env.local`
- [ ] Dev server pokrenut
- [ ] Webhook setup (Stripe CLI ili ngrok)
- [ ] Test payment sa 4242... karticom
- [ ] Payment status se ažurira u database
- [ ] Admin vidi payment u listi
- [ ] Nema grešaka u console

### **Production Testing:**
- [ ] Stripe keys dodati na Vercel
- [ ] Production webhook registriran
- [ ] Redeploy aplikacije
- [ ] Test payment na production URL
- [ ] Payment status ažuriran
- [ ] Stripe dashboard pokazuje payment
- [ ] Email confirmation poslan (ako koristiš)

### **Live Mode Testing:**
- [ ] Business verification complete
- [ ] Live keys aktivirani
- [ ] Live webhook setup
- [ ] Test sa pravom karticom ($0.50)
- [ ] Refund test
- [ ] Production monitoring aktivan

---

## 🎯 **SLJEDEĆI KORACI**

### **SADA (FAZA 1 - Beta Test):**
1. ✅ Testiraj app bez plaćanja
2. ✅ Koristi "Pay Later" opciju
3. ✅ Prikupi feedback od beta testera

### **KASNIJE (FAZA 2 - Stripe Setup):**
1. ⏳ Kreiraj Stripe account
2. ⏳ Dobij test API keys
3. ⏳ Dodaj keys (localhost + Vercel)
4. ⏳ Setup webhook

### **NAKON SETUP-A (FAZA 3 - Testing):**
1. ⏳ Test payment na localhost
2. ⏳ Test payment na production
3. ⏳ Aktiviraj live mode
4. ⏳ GO LIVE! 🚀

---

## 📚 **RESURSI**

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Stripe Docs:** https://stripe.com/docs
- **Test Cards:** https://stripe.com/docs/testing
- **Webhook Guide:** https://stripe.com/docs/webhooks
- **Stripe CLI:** https://stripe.com/docs/stripe-cli

---

**Status:** Pripremljeno za implementaciju nakon beta testa  
**Procijenjeno vrijeme:** 2-3 sata za kompletni setup  
**Sljedeći korak:** Završi beta test, pa počni sa Korakom 1
