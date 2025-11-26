# 📧 Email Sistem - Dokumentacija

## Pregled

Email sistem je proširen da podržava različite tipove emailova preko Supabase Edge Function. Svi emailovi se šalju preko Resend API-ja.

## Podržani Tipovi Emailova

### 1. `registration_confirmation`
**Kada se šalje:** Nakon što se korisnik registruje  
**Parametri:**
- `registrationId` - ID registracije
- `email` - Email adresa korisnika
- `firstName` - Ime korisnika
- `lastName` - Prezime korisnika
- `paymentUrl` (opcionalno) - URL za plaćanje ako je potrebno

**Primer:**
```typescript
import { sendRegistrationConfirmation } from '@/lib/email'

await sendRegistrationConfirmation(
  registrationId,
  email,
  firstName,
  lastName,
  paymentUrl // opcionalno
)
```

### 2. `payment_confirmation`
**Kada se šalje:** Nakon što korisnik uspešno plati  
**Parametri:**
- `registrationId` - ID registracije
- `email` - Email adresa korisnika
- `firstName` - Ime korisnika
- `lastName` - Prezime korisnika
- `invoiceUrl` (opcionalno) - URL za invoice

**Primer:**
```typescript
import { sendPaymentConfirmation } from '@/lib/email'

await sendPaymentConfirmation(
  registrationId,
  email,
  firstName,
  lastName,
  invoiceUrl // opcionalno
)
```

### 3. `payment_reminder`
**Kada se šalje:** Podsetnik za neplaćene registracije  
**Parametri:**
- `registrationId` - ID registracije
- `email` - Email adresa korisnika
- `firstName` - Ime korisnika
- `lastName` - Prezime korisnika
- `paymentUrl` (opcionalno) - URL za plaćanje
- `customMessage` (opcionalno) - Prilagođena poruka

**Primer:**
```typescript
import { sendPaymentReminder } from '@/lib/email'

await sendPaymentReminder(
  registrationId,
  email,
  firstName,
  lastName,
  paymentUrl,
  'Please complete your payment by the end of this week.' // customMessage
)
```

### 4. `pre_conference_reminder`
**Kada se šalje:** Podsetnik pre konferencije  
**Parametri:**
- `registrationId` - ID registracije
- `email` - Email adresa korisnika
- `firstName` - Ime korisnika
- `lastName` - Prezime korisnika
- `conferenceDate` (opcionalno) - Datum konferencije
- `conferenceLocation` (opcionalno) - Lokacija konferencije
- `conferenceProgram` (opcionalno) - Program konferencije
- `customMessage` (opcionalno) - Prilagođena poruka

**Primer:**
```typescript
import { sendPreConferenceReminder } from '@/lib/email'

await sendPreConferenceReminder(
  registrationId,
  email,
  firstName,
  lastName,
  '2025-03-15',
  'Zagreb, Croatia',
  '9:00 AM - Registration\n10:00 AM - Opening Keynote\n...',
  'Looking forward to seeing you!'
)
```

### 5. `event_details`
**Kada se šalje:** Email sa detaljima događaja  
**Parametri:**
- `registrationId` - ID registracije
- `email` - Email adresa korisnika
- `firstName` - Ime korisnika
- `lastName` - Prezime korisnika
- `conferenceDate` (opcionalno) - Datum konferencije
- `conferenceLocation` (opcionalno) - Lokacija konferencije
- `conferenceProgram` (opcionalno) - Program konferencije
- `customMessage` (opcionalno) - Prilagođena poruka

**Primer:**
```typescript
import { sendEventDetails } from '@/lib/email'

await sendEventDetails(
  registrationId,
  email,
  firstName,
  lastName,
  '2025-03-15',
  'Zagreb, Croatia',
  'Full program details...'
)
```

## Direktno Korišćenje Edge Function-a

Možete direktno pozvati Edge Function sa bilo kojim tipom emaila:

```typescript
const response = await fetch(
  `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-confirmation-email`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      emailType: 'payment_reminder',
      registrationId: '...',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      paymentUrl: 'https://...',
      customMessage: 'Custom message here',
    }),
  }
)
```

## Trenutna Integracija

### Automatski Emailovi

1. **Registration Confirmation** - Šalje se automatski u `app/api/register/route.ts`
2. **Payment Confirmation** - Šalje se automatski u `app/api/stripe-webhook/route.ts` kada se plaćanje završi

### Ručno Slanje Emailova

Možete koristiti helper funkcije iz `lib/email.ts` u bilo kojoj API ruti:

```typescript
import { sendPaymentReminder } from '@/lib/email'

// U API ruti
export async function POST(request: NextRequest) {
  // ... vaš kod ...
  
  await sendPaymentReminder(
    registrationId,
    email,
    firstName,
    lastName,
    paymentUrl
  )
  
  // ... ostatak koda ...
}
```

## Konfiguracija

### Environment Varijable

Potrebne su sledeće environment varijable:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
```

### Resend Konfiguracija

1. Kreiraj account na [resend.com](https://resend.com)
2. Generiši API key
3. Verifikuj domain (ili koristi test domain za development)
4. Postavi `RESEND_API_KEY` u Supabase secrets:
   ```bash
   supabase secrets set RESEND_API_KEY=your_resend_api_key
   ```
5. Ažuriraj `from` email u Edge Function sa svojim verificiranim emailom

## Napomene

- Svi emailovi se šalju asinhrono (ne blokiraju glavni tok)
- Emailovi se šalju preko Resend API-ja
- Template-i su HTML formatirani sa fallback na plain text
- Emailovi su responsive i mobile-friendly

## Buduća Poboljšanja

- [ ] Bulk email sending
- [ ] Email scheduling (cron jobs)
- [ ] Email templates editor u admin panelu
- [ ] Email tracking (open rates, click rates)
- [ ] Multi-language email templates

