# QA Testing Checklist - MeetFlow

Ovaj dokument sadrži kompletnu listu testova koje treba provesti prije produkcijskog deployamenta.

## Testna Okolina

Prije testiranja, provjerite:
- [ ] Lokalni development server radi (`npm run dev`)
- [ ] Supabase je konfiguriran i dostupan
- [ ] Stripe test mode je aktivan (ako testirate plaćanje)
- [ ] Upstash Redis je konfiguriran (za rate limiting)

---

## 1. Autentikacija i Autorizacija

### 1.1 Admin Login
- [ ] Login s validnim kredencijalima funkcionira
- [ ] Login s nevalidnim kredencijalima prikazuje grešku
- [ ] Rate limiting radi (5 pokušaja u 15 minuta)
- [ ] "Forgot password" flow funkcionira
- [ ] Session se pravilno održava nakon refresha stranice
- [ ] Logout briše session i preusmjerava na login

### 1.2 Role-Based Access Control (RBAC)
- [ ] Super Admin ima pristup svim konferencijama
- [ ] Conference Admin vidi samo dodijeljene konferencije
- [ ] Neautorizirani korisnici ne mogu pristupiti /admin/* rutama
- [ ] Inactive korisnici ne mogu se prijaviti

### 1.3 Impersonation (Super Admin)
- [ ] Super Admin može impersonirati Conference Admina
- [ ] Impersonation prikazuje samo konferencije tog admina
- [ ] Stop impersonation vraća originalni prikaz

---

## 2. Upravljanje Konferencijama

### 2.1 Kreiranje Konferencije
- [ ] Kreiranje nove konferencije radi
- [ ] Slug se automatski generira iz naziva
- [ ] Validacija obaveznih polja radi
- [ ] Upload logo-a funkcionira
- [ ] Postavke se pravilno spremaju (JSON polja)

### 2.2 Uređivanje Konferencije
- [ ] Sva polja se pravilno učitavaju
- [ ] Izmjene se pravilno spremaju
- [ ] Preview konferencije radi
- [ ] Publish/Unpublish funkcionira

### 2.3 Custom Fields
- [ ] Dodavanje custom registration polja radi
- [ ] Svi tipovi polja rade (text, select, checkbox, etc.)
- [ ] Drag & drop reordering radi
- [ ] Required validacija radi za obavezna polja

### 2.4 Pricing Configuration
- [ ] Early bird, regular, late pricing se sprema
- [ ] Custom pricing fields se mogu dodavati
- [ ] VAT/PDV konfiguracija radi
- [ ] Multi-currency podrška (ako je omogućena)

---

## 3. Registracija Sudionika

### 3.1 Registracijska Forma
- [ ] Forma se pravilno prikazuje s custom poljima
- [ ] Validacija svih polja radi
- [ ] Odabir fee type-a radi (early bird, regular, student, etc.)
- [ ] Rate limiting radi (3 registracije na sat)

### 3.2 Multiple Participants
- [ ] Dodavanje više sudionika radi
- [ ] Minimalni/maksimalni broj sudionika se poštuje
- [ ] Validacija za svakog sudionika radi

### 3.3 Accommodation
- [ ] Odabir datuma dolaska/odlaska radi
- [ ] Hotel opcije se prikazuju
- [ ] Cijena se pravilno računa

### 3.4 Payment Flow
- [ ] Pay Now (Card) - Stripe payment radi
- [ ] Pay Now (Bank Transfer) - prikazuje instrukcije
- [ ] Pay Later - registracija se sprema bez plaćanja
- [ ] Webhook pravilno ažurira payment status

---

## 4. Admin Dashboard

### 4.1 Statistike
- [ ] Total registrations se pravilno računa
- [ ] Paid/Pending/Not Required brojevi su točni
- [ ] Check-in statistike su točne
- [ ] Grafovi se pravilno renderiraju

### 4.2 Platform Overview (Super Admin)
- [ ] Total conferences broj je točan
- [ ] Total users broj je točan
- [ ] Revenue se pravilno zbraja

---

## 5. Upravljanje Registracijama

### 5.1 Lista Registracija
- [ ] Sve registracije se prikazuju
- [ ] Filtriranje radi (po statusu, datumu)
- [ ] Pretraživanje radi
- [ ] Paginacija radi

### 5.2 Export
- [ ] Export u Excel radi
- [ ] Export u CSV radi
- [ ] Export u JSON radi
- [ ] Clipboard copy radi

### 5.3 Bulk Actions
- [ ] Bulk delete radi (samo za Super Admin)
- [ ] Bulk certificate generation radi
- [ ] Bulk email radi

---

## 6. Plaćanje

### 6.1 Stripe Integration
- [ ] Payment Intent kreiranje radi
- [ ] Uspješno plaćanje ažurira status
- [ ] Neuspješno plaćanje se pravilno handla
- [ ] Webhook signature verification radi

### 6.2 Refunds
- [ ] Refund request se može kreirati
- [ ] Stripe refund se procesira
- [ ] Payment history se ažurira

### 6.3 Invoice Generation
- [ ] PDF invoice se generira
- [ ] Invoice sadrži sve podatke
- [ ] Email slanje invoice-a radi

---

## 7. Check-In System

### 7.1 Manual Check-In
- [ ] Pretraživanje registracija radi
- [ ] Check-in button ažurira status
- [ ] Timestamp se pravilno sprema

### 7.2 QR Code
- [ ] QR kod se generira za svaku registraciju
- [ ] QR skener radi
- [ ] Auto check-in nakon skeniranja radi

---

## 8. Certifikati

### 8.1 Generiranje
- [ ] Individual certificate generation radi
- [ ] PDF se pravilno generira
- [ ] Podaci na certifikatu su točni

### 8.2 Bulk Generation
- [ ] Bulk generation radi
- [ ] Download ZIP-a radi

### 8.3 Email
- [ ] Email slanje certifikata radi
- [ ] Custom message se pravilno uključuje

---

## 9. Conference Pages (CMS)

### 9.1 Page Creation
- [ ] Kreiranje nove stranice radi
- [ ] TipTap editor radi
- [ ] Image upload radi
- [ ] SEO polja se spremaju

### 9.2 Public View
- [ ] Stranice se pravilno prikazuju
- [ ] Navigation radi
- [ ] Responsive design radi

---

## 10. Email System

### 10.1 Confirmation Emails
- [ ] Registration confirmation se šalje
- [ ] Payment confirmation se šalje
- [ ] Certificate email se šalje

### 10.2 Notification Emails
- [ ] Team notification za nove registracije radi
- [ ] Payment reminder radi

---

## 11. Security

### 11.1 Input Validation
- [ ] XSS napadi su blokirani
- [ ] SQL injection je nemoguć (Supabase)
- [ ] File upload validacija radi

### 11.2 Rate Limiting
- [ ] Login rate limiting radi
- [ ] Registration rate limiting radi
- [ ] API rate limiting radi

### 11.3 Authorization
- [ ] RLS policies rade
- [ ] API routes provjeravaju auth
- [ ] Middleware zaštita radi

---

## 12. Performance

### 12.1 Page Load
- [ ] Dashboard se učitava ispod 3 sekunde
- [ ] Registration forma se brzo učitava
- [ ] Images su optimizirane

### 12.2 Database
- [ ] Query-ji su efikasni
- [ ] Indexes su na mjestu
- [ ] Connection pooling radi

---

## Potpis Testera

- **Tester**: ________________
- **Datum**: ________________
- **Verzija**: ________________
- **Okolina**: [ ] Localhost [ ] Staging [ ] Production

### Napomene
_Ovdje zabilježite bilo kakve probleme ili opažanja tijekom testiranja:_

```
_____________________________________________________________________
_____________________________________________________________________
_____________________________________________________________________
```
