# 💰 Multi-Currency & Bank Transfer Payment System

## 📋 Overview

Kompletni **multi-currency i bank transfer** payment sistem za međunarodne konferencije koji omogućava:
- ✅ **Multi-currency pricing** - Prihvat plaćanja u različitim valutama (EUR, USD, GBP, CHF, CAD, AUD, JPY, CNY, HRK)
- ✅ **Bank Transfer** opcija - Plaćanje putem bankovnog transfera sa automatskim "poziv na broj" (payment reference)
- ✅ **Auto-Reminders** - Automatski podsjetniciafter 3 dana za neplaćene registracije
- ✅ **Manual Verification** - Admin može manually verificirati bank transfere
- ✅ **Payment History** - Kompletna povijest plaćanja po konferencijama i userima

---

## 🏗️ Arhitektura

### 1. Database Schema

#### **Nove kolone u `user_profiles` (Organizatori)**
```sql
-- Bank Account Info
bank_account_number VARCHAR(34)      -- IBAN broj računa
bank_account_holder VARCHAR(255)     -- Naziv vlasnika računa
bank_name VARCHAR(255)                -- Naziv banke
swift_bic VARCHAR(11)                 -- SWIFT/BIC za međunarodne transfere
bank_address TEXT                     -- Adresa banke (optional)
bank_account_currency VARCHAR(10)    -- Valuta računa (default: EUR)
```

#### **Nove kolone u `registrations`**
```sql
-- Payment Method & Multi-Currency Support
payment_method VARCHAR(50) DEFAULT 'card'  -- card | bank_transfer | cash | other
payment_reference VARCHAR(100)             -- Unique payment reference (poziv na broj)
payment_currency VARCHAR(10) DEFAULT 'EUR' -- Currency used for payment
payment_amount DECIMAL(10, 2)              -- Amount paid

-- Bank Transfer Verification
bank_transfer_proof_url TEXT               -- Proof of payment upload
bank_transfer_verified BOOLEAN DEFAULT false
bank_transfer_verified_at TIMESTAMP
bank_transfer_verified_by UUID             -- Admin who verified
```

#### **Nova tablica `payment_reminders`**
```sql
CREATE TABLE payment_reminders (
  id UUID PRIMARY KEY,
  registration_id UUID NOT NULL,
  conference_id UUID NOT NULL,
  reminder_type VARCHAR(50) DEFAULT 'payment_pending',
  reminder_count INTEGER DEFAULT 0,
  scheduled_for TIMESTAMP NOT NULL,        -- Kada poslati reminder (e.g., +3 days)
  sent_at TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  email_subject TEXT,
  email_body TEXT,
  email_error TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### **Nova tablica `supported_currencies`**
```sql
CREATE TABLE supported_currencies (
  code VARCHAR(10) PRIMARY KEY,  -- EUR, USD, GBP, etc.
  name VARCHAR(100) NOT NULL,    -- Euro, US Dollar, etc.
  symbol VARCHAR(10),            -- €, $, £, etc.
  decimal_places INTEGER DEFAULT 2,
  active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);
```

---

## 💻 Implementation Details

### **1. Multi-Currency Support**

#### **ConferencePricing Type (TypeScript)**
```typescript
export interface ConferencePricing {
  currency: string // Default currency
  currencies?: string[] // Supported currencies: ['EUR', 'USD', 'GBP']
  
  early_bird: {
    amount: number | Record<string, number>
    // Single: { amount: 150 }
    // Multi: { amount: { EUR: 150, USD: 170, GBP: 130 } }
    deadline?: string
  }
  
  regular: {
    amount: number | Record<string, number>
  }
  
  late: {
    amount: number | Record<string, number>
  }
  
  student_discount: number | Record<string, number>
  vat_percentage?: number
}
```

#### **Utility Functions**
```typescript
// Get currency symbol
getCurrencySymbol(currencyCode: string): string

// Format price with symbol
formatPriceWithSymbol(amount: number, currency: string): string
// Examples:
// formatPriceWithSymbol(150, 'EUR') → "150.00 €"
// formatPriceWithSymbol(170, 'USD') → "$170.00"

// Get price amount from multi-currency object
getPriceAmount(priceField: number | Record<string, number>, currency: string): number
// Examples:
// getPriceAmount(150, 'EUR') → 150
// getPriceAmount({ EUR: 150, USD: 170 }, 'USD') → 170
```

---

### **2. Bank Transfer Flow**

#### **A. User Registration (Select Payment Method)**
1. User odabire conference i registrira se
2. **Step 1:** Odabere "Bank Transfer" kao payment method
3. **Step 2:** Vidi bank account details organizatora:
   - IBAN
   - Account Holder Name
   - Bank Name
   - SWIFT/BIC (for international)
   - **Payment Reference** (auto-generated): `ICD11-001-7234`
4. **Step 3:** User prenosi novac i **može uploadati proof of payment** (opciono)

#### **B. Auto-Generate Payment Reference (poziv na broj)**
```typescript
// Function: generate_payment_reference(conference_code, registration_number)
// Returns: "ICD11-001-7234"

Conference Code: ICD11
Registration Number: 001
Random Suffix: 7234 (4-digit random)
```

#### **C. Auto-Reminders (3, 7, 14 days)**
- **Trigger:** Automatically scheduled when `payment_status = 'pending'` (for bank transfer and pay-later).
- **Schedule:** Reminders at **3, 7, and 14 days** after registration (see `PAYMENT_OPTIONS_GUIDE.md`).
- **Email Content:** Reminder to complete payment with bank transfer details (when applicable).

```sql
-- Trigger on registration INSERT
CREATE TRIGGER trigger_create_payment_reminder
  AFTER INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION create_payment_reminder_on_registration();
```

#### **D. Admin Manual Verification**
1. Admin otvara **Payments** tab u dashboardu
2. Vidi listu pending bank transfers
3. Verifikuje proof of payment
4. Klikne **"Mark as Paid"** → `bank_transfer_verified = true`
5. Status se mijenja u `payment_status = 'paid'`

---

### **3. Conference Settings UI**

#### **Currency Selection (Admin Panel)**
```
┌─────────────────────────────────────┐
│ Supported Currencies                │
├─────────────────────────────────────┤
│ ☑ EUR (€) - Default                 │
│ ☑ USD ($)                            │
│ ☑ GBP (£)                            │
│ ☐ CHF                                │
│ ☐ CAD (CA$)                          │
└─────────────────────────────────────┘

Early Bird Pricing:
┌─────────┬──────────┐
│ EUR     │ 150.00 € │
│ USD     │ 170.00 $ │
│ GBP     │ 130.00 £ │
└─────────┴──────────┘
```

---

## 🎯 Admin Bank Account Setup

### **Account Settings Page**

Admini mogu upisati bankovni račun u **Account Settings**:

```
┌──────────────────────────────────────────────┐
│ 💳 Bank Account Settings                     │
├──────────────────────────────────────────────┤
│ Bank Account Number (IBAN):                  │
│ [HR1234567890123456789                    ]  │
│                                               │
│ Account Holder Name:                          │
│ [My Organization Name                     ]  │
│                                               │
│ Bank Name:                                    │
│ [Zagrebačka banka                         ]  │
│                                               │
│ SWIFT/BIC Code:                               │
│ [ZABAHR2X                                 ]  │
│                                               │
│ Bank Address (optional):                      │
│ [Trg bana Jelačića 10, Zagreb, Croatia   ]  │
│                                               │
│ Account Currency:                             │
│ [EUR (€) ▼]                                  │
│                                               │
│ [Save Bank Settings]  [Cancel]               │
└──────────────────────────────────────────────┘
```

> **Note:** Ako bankovni račun nije postavljen, opcija "Bank Transfer" se **neće prikazivati** na registration formi.

---

## 📧 Payment Reminder System

### **Automated Reminders**

#### **Trigger:** 3 dana nakon registracije (ako status = 'pending')

#### **Email Template:**
```
Subject: Payment Reminder - [Conference Name] Registration

Dear [Participant Name],

This is a friendly reminder that your registration for [Conference Name] is pending payment.

Registration Details:
- Registration Number: ICD11-001
- Amount Due: 150.00 EUR
- Payment Reference: ICD11-001-7234

Payment Instructions:
Please transfer the amount to the following bank account:

Bank: Zagrebačka banka
IBAN: HR1234567890123456789
SWIFT/BIC: ZABAHR2X
Account Holder: My Organization Name

**IMPORTANT:** Please include the payment reference: ICD11-001-7234

Once payment is received, we will confirm your registration.

Best regards,
[Conference Team]
```

---

## 🔄 Registration Form Updates

### **Payment Method Selection**

```
┌─────────────────────────────────────────┐
│ Select Payment Method                   │
├─────────────────────────────────────────┤
│ ⚪ Credit/Debit Card (Stripe)           │
│    Pay securely with card              │
│                                         │
│ ⚪ Bank Transfer                        │
│    Transfer to our bank account        │
│    (Manual verification required)      │
└─────────────────────────────────────────┘

[If Bank Transfer selected]
┌─────────────────────────────────────────┐
│ 🏦 Bank Transfer Instructions           │
├─────────────────────────────────────────┤
│ Please transfer 150.00 € to:            │
│                                         │
│ Bank: Zagrebačka banka                  │
│ IBAN: HR1234567890123456789             │
│ SWIFT/BIC: ZABAHR2X                     │
│ Account Holder: My Organization         │
│                                         │
│ **Payment Reference:**                  │
│ ICD11-001-7234                          │
│                                         │
│ Upload Proof of Payment (optional):     │
│ [Choose File]                           │
└─────────────────────────────────────────┘
```

---

## 🛠️ Next Steps (Implementation TODO)

✅ **Completed:**
1. Database migration (`040_add_multi_currency_and_bank_transfer.sql`)
2. TypeScript types updated (`Conference`, `Registration`)
3. Utility functions for multi-currency (`utils/pricing.ts`)
4. Account Settings UI for Bank Account

⏳ **Pending:**
1. **Conference Settings UI** - Add currency selector and multi-currency pricing inputs
2. **Registration Form UI** - Add payment method selector (card vs bank transfer)
3. **Bank Transfer Instructions Display** - Show bank details with payment reference
4. **Admin Payment Verification UI** - List of pending bank transfers with verification button
5. **Payment Reminder Cron Job** - Scheduled job to send reminders (can use Vercel Cron or Supabase Functions)

---

## 📝 Testing Guide

### **Test Scenario 1: Multi-Currency Pricing**
1. Login as Conference Admin
2. Go to **Conference Settings** → **Pricing**
3. Enable multiple currencies: EUR, USD, GBP
4. Set prices:
   - Early Bird: EUR 150, USD 170, GBP 130
   - Regular: EUR 200, USD 220, GBP 180
5. Save conference
6. Open registration form as participant
7. Select currency → verify correct price displays

### **Test Scenario 2: Bank Transfer**
1. Login as Conference Admin
2. Go to **Account Settings** → **Bank Account Settings**
3. Fill in bank details (IBAN, Bank Name, SWIFT, etc.)
4. Save settings
5. Open registration form as participant
6. Select "Bank Transfer" as payment method
7. Verify bank details display with unique payment reference
8. Upload proof of payment
9. Submit registration
10. As Admin, go to **Payments** dashboard
11. Find pending bank transfer
12. Verify proof of payment
13. Mark as paid → status changes to 'paid'

### **Test Scenario 3: Payment Reminder**
1. Register with bank transfer (don't pay)
2. Wait 3 days (or manually trigger reminder in DB)
3. Check email → should receive payment reminder
4. Verify reminder includes bank details and payment reference

---

## 🌍 Supported Currencies

| Code | Name              | Symbol | Decimal Places |
|------|-------------------|--------|----------------|
| EUR  | Euro              | €      | 2              |
| USD  | US Dollar         | $      | 2              |
| GBP  | British Pound     | £      | 2              |
| CHF  | Swiss Franc       | CHF    | 2              |
| CAD  | Canadian Dollar   | CA$    | 2              |
| AUD  | Australian Dollar | A$     | 2              |
| JPY  | Japanese Yen      | ¥      | 0              |
| CNY  | Chinese Yuan      | ¥      | 2              |
| HRK  | Croatian Kuna     | kn     | 2              |

---

## ❓ FAQ

### **Q: Što je "poziv na broj"?**
**A:** Unique payment reference koji se generira za svaku registraciju (npr. `ICD11-001-7234`). Koristi se da admin zna koji participant je uplatinlio.

### **Q: Mogu li imati različite cijene za različite valute?**
**A:** Da! Možeš postaviti različite cijene za svaku valutu (npr. EUR 150, USD 170, GBP 130).

### **Q: Što ako participant ne uplati nakon 3 dana?**
**A:** Auto-reminder se šalje nakon 3 dana. Možeš podesiti koliko puta želiš slati remindere ili ih slati manualno.

### **Q: Kako admin zna da je participant uplatio?**
**A:** Admin može vidjeti pending bank transfers u **Payments** dashboardu i manually verificirati svaku uplatu.

### **Q: Može li participant uploadati dokaz plaćanja?**
**A:** Da! Participant može uploadati screenshot/PDF dokaza plaćanja prilikom registracije (opciono).

---

## 🔐 Security Notes

- **Payment Reference** je unique i sadrži random suffix za sigurnost
- **Bank Account Details** se prikazuju samo ako su konfigurirani u Account Settings
- **Proof of Payment Upload** koristi Supabase Storage sa RLS policies
- **Admin Verification** osigurava da samo plaćeni participanti dobiju pristup

---

## 📞 Support

Za pitanja ili pomoć:
- Email: support@yourconference.com
- Documentation: `/docs/MULTI_CURRENCY_AND_BANK_TRANSFER_GUIDE.md`

---

**Last Updated:** January 2026  
**Version:** 1.0.0
