# 🧪 Test Plan za Production Deploy

## 📋 Pre-test provjere

### 1. Environment Varijable u Vercel
Provjerite u Vercel Dashboard → Settings → Environment Variables:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` - postavljen
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - postavljen
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - postavljen
- [ ] `NEXT_PUBLIC_APP_URL` - postavljen na production URL
- [ ] `STRIPE_SECRET_KEY` - postavljen (ako koristite plaćanje)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - postavljen (ako koristite plaćanje)
- [ ] `STRIPE_WEBHOOK_SECRET` - postavljen (ako koristite plaćanje)

## 🧪 Test Scenariji

### Test 1: Osnovna funkcionalnost stranice

**URL:** `https://your-app.vercel.app`

**Koraci:**
1. [ ] Otvorite production URL u browseru
2. [ ] Provjerite da se stranica učitava bez grešaka
3. [ ] Provjerite da se forma prikazuje ispravno
4. [ ] Provjerite da su svi elementi vidljivi (polja, gumbi, ikone)

**Očekivani rezultat:** Stranica se učitava, forma je vidljiva i funkcionalna

---

### Test 2: Registracija bez plaćanja

**Koraci:**
1. [ ] Ispunite formu:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `test@example.com` (koristite svoj email za provjeru)
   - Phone: `+1234567890`
   - Country: Odaberite bilo koju
   - Institution: `Test Institution`
   - Arrival Date: Odaberite budući datum
   - Departure Date: Odaberite datum nakon arrival date
   - Payment Required: **NE označavajte** (isključeno)
2. [ ] Kliknite "Register Now"
3. [ ] Provjerite da se prikazuje success poruka
4. [ ] Provjerite u Supabase Table Editor da je registracija spremljena

**Očekivani rezultat:** 
- Success poruka se prikazuje
- Registracija je spremljena u Supabase
- `payment_status` je `not_required`

---

### Test 3: Registracija s plaćanjem (bez Payment by Card)

**Koraci:**
1. [ ] Ispunite formu (koristite novi email, npr. `test2@example.com`)
2. [ ] Označite "Payment Required" toggle
3. [ ] **NE označavajte** "Payment by Card"
4. [ ] Kliknite "Register Now"
5. [ ] Provjerite da se prikazuje success poruka s gumbom "Proceed to Payment"
6. [ ] Kliknite "Proceed to Payment"
7. [ ] Provjerite da ste preusmjereni na Stripe Checkout stranicu

**Očekivani rezultat:**
- Success poruka s payment linkom
- Redirect na Stripe Checkout
- U Supabase, `payment_status` je `pending`

---

### Test 4: Registracija s direktnim plaćanjem (Payment by Card)

**Koraci:**
1. [ ] Ispunite formu (koristite novi email, npr. `test3@example.com`)
2. [ ] Označite "Payment Required" toggle
3. [ ] **Označite** "Payment by Card"
4. [ ] Provjerite da se prikazuje sekcija "Podržane kartice"
5. [ ] Kliknite "Register Now"
6. [ ] Provjerite da se prikazuje PaymentForm direktno u formi
7. [ ] Koristite Stripe test karticu:
   - Broj kartice: `4242 4242 4242 4242`
   - Expiry: bilo koji budući datum (npr. `12/25`)
   - CVC: bilo koji 3 broja (npr. `123`)
   - ZIP: bilo koji 5 brojeva (npr. `12345`)
8. [ ] Kliknite "Pay €50.00"
9. [ ] Provjerite da se prikazuje success poruka
10. [ ] Provjerite u Supabase da je `payment_status` = `paid`
11. [ ] Provjerite da je `invoice_id` i `invoice_url` popunjeno

**Očekivani rezultat:**
- PaymentForm se prikazuje nakon registracije
- Plaćanje prolazi uspješno
- Success poruka s linkom na račun
- U Supabase, sve je ažurirano (`paid`, `invoice_id`, `invoice_url`)

---

### Test 5: Stripe Webhook

**Koraci:**
1. [ ] U Stripe Dashboard → Developers → Webhooks
2. [ ] Pronađite svoj webhook endpoint
3. [ ] Kliknite "Send test webhook"
4. [ ] Odaberite event: `payment_intent.succeeded`
5. [ ] Kliknite "Send test webhook"
6. [ ] Provjerite da webhook prima zahtjev (status 200)
7. [ ] Provjerite u Supabase da je registracija ažurirana

**Očekivani rezultat:**
- Webhook prima zahtjev uspješno
- Registracija je ažurirana u Supabase

---

### Test 6: Admin Panel

**URL:** `https://your-app.vercel.app/admin`

**Koraci:**
1. [ ] Otvorite admin panel
2. [ ] Provjerite da se dashboard učitava
3. [ ] Provjerite da se prikazuju statistike (ukupno registracija, plaćanja, itd.)
4. [ ] Idite na "Registrations"
5. [ ] Provjerite da se prikazuju sve registracije
6. [ ] Testirajte search funkcionalnost
7. [ ] Testirajte filter po payment statusu
8. [ ] Kliknite "Export CSV" - provjerite da se CSV preuzima
9. [ ] Kliknite "Full Backup" - provjerite da se backup preuzima
10. [ ] Idite na "Abstracts" (ako imate uploadane abstracts)
11. [ ] Provjerite da se abstracts prikazuju

**Očekivani rezultat:**
- Admin panel se učitava
- Sve funkcionalnosti rade
- CSV i backup se preuzimaju

---

### Test 7: Abstract Upload

**URL:** `https://your-app.vercel.app/abstracts`

**Koraci:**
1. [ ] Otvorite abstracts stranicu
2. [ ] Kliknite "Choose File" i odaberite Word dokument (.doc ili .docx)
3. [ ] Unesite email (opcionalno)
4. [ ] Kliknite "Upload Abstract"
5. [ ] Provjerite success poruku
6. [ ] Provjerite u Supabase Storage da je datoteka uploadana u organiziranoj strukturi:
   - `abstracts/{registrationId}/...` ili
   - `abstracts/by-email/{hash}/...` ili
   - `abstracts/{year}/{month}/...`
7. [ ] Provjerite u Supabase Table Editor da je abstract spremljen u `abstracts` tablicu

**Očekivani rezultat:**
- Upload uspješan
- Datoteka je u Storage-u u organiziranoj strukturi
- Metadata je spremljena u bazu

---

### Test 8: Error Handling

**Koraci:**
1. [ ] Pokušajte registrirati se s istim email-om dva puta
   - **Očekivani rezultat:** Poruka "Email already registered"
2. [ ] Pokušajte registrirati se s neispravnim email formatom
   - **Očekivani rezultat:** Validacijska greška
3. [ ] Pokušajte registrirati se s departure date prije arrival date
   - **Očekivani rezultat:** Validacijska greška
4. [ ] Pokušajte uploadati neispravan tip datoteke (npr. PDF umjesto Word)
   - **Očekivani rezultat:** Greška o neispravnom tipu datoteke

**Očekivani rezultat:** Sve greške se prikazuju ispravno

---

### Test 9: Responsive Design

**Koraci:**
1. [ ] Otvorite aplikaciju na desktopu (1920x1080)
2. [ ] Otvorite aplikaciju na tabletu (768x1024)
3. [ ] Otvorite aplikaciju na mobitelu (375x667)
4. [ ] Provjerite da se sve prikazuje ispravno na svim veličinama

**Očekivani rezultat:** Aplikacija je responsive i radi na svim uređajima

---

### Test 10: Performance

**Koraci:**
1. [ ] Otvorite Chrome DevTools → Network tab
2. [ ] Učitajte stranicu
3. [ ] Provjerite vrijeme učitavanja (trebalo bi biti < 3 sekunde)
4. [ ] Provjerite Lighthouse score (u DevTools → Lighthouse)
   - Performance: > 80
   - Accessibility: > 90
   - Best Practices: > 90
   - SEO: > 80

**Očekivani rezultat:** Dobri performance metriki

---

## 🐛 Ako nešto ne radi

### Problem: Stranica se ne učitava
- Provjerite Vercel deployment status
- Provjerite build logove u Vercel Dashboardu
- Provjerite da su environment varijable postavljene

### Problem: Registracija ne radi
- Provjerite Supabase connection (environment varijable)
- Provjerite RLS politike u Supabase
- Provjerite browser console za greške

### Problem: Plaćanje ne radi
- Provjerite Stripe keys u Vercel environment varijablama
- Provjerite da koristite production keys (ne test keys)
- Provjerite Stripe webhook URL u Stripe Dashboardu

### Problem: Webhook ne radi
- Provjerite `STRIPE_WEBHOOK_SECRET` u Vercel
- Provjerite webhook URL u Stripe Dashboardu
- Provjerite Vercel function logs za greške

---

## ✅ Finalni Checklist

- [ ] Sve testove prošao/la
- [ ] Nema kritičnih grešaka
- [ ] Sve funkcionalnosti rade
- [ ] Performance je dobar
- [ ] Responsive design radi
- [ ] Admin panel radi
- [ ] Plaćanje radi (ako je konfigurirano)
- [ ] Webhook radi (ako je konfigurirano)

---

**Napomena:** Koristite test email adrese i test kartice za testiranje. Ne koristite prave podatke dok ne potvrdite da sve radi!

