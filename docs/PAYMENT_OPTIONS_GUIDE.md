# 💳 Payment Options Guide - "Pay Now" vs "Pay Later"

## 📋 Overview

Kompletni **flexible payment system** koji omogućava korisnicima da odaberu **kada i kako** žele platiti:
- ✅ **Pay Now - Credit Card** - Instant confirmation (Stripe)
- ✅ **Pay Now - Bank Transfer** - Manual verification (1-2 days)
- ✅ **Pay Later** - Register now, pay later (flexible deadline)

---

## 🎯 **BEST PRACTICE - Industry Standard**

### **Kako to rade velike konferencije?**

| Conference | Payment Options | Default Behavior |
|-----------|----------------|------------------|
| **IEEE Conferences** | Pay Now (Card), Pay Now (Invoice), Pay Later | ✅ Pay Later (default) |
| **ACM Conferences** | Pay Now (Card), Pay Now (Bank), Pay Later | ✅ Pay Later (default) |
| **ISMB** | Pay Now (Card), Pay Now (Wire Transfer), Pay Later | ✅ Pay Later (default) |
| **AAAI** | Pay Now (Card), Pay Later | ✅ Pay Later (default) |

### **Why "Pay Later" is Default?**

1. ✅ **Lower barrier to entry** - More registrations (many people register early, pay later)
2. ✅ **Corporate invoices** - Companies need PO (Purchase Order) before payment
3. ✅ **Budget approvals** - Academics need department approval
4. ✅ **Early bird pricing** - Register early to secure price, pay later
5. ✅ **No abandoned registrations** - Payment failures don't block registration

---

## 🏗️ **How It Works - 3 Scenarios**

### **Scenario 1: Pay Now - Credit Card (Instant Confirmation)**

```
User Flow:
1. User fills out registration form
2. Selects "Pay Now - Credit Card"
3. Submits registration
4. → Redirected to Stripe payment page
5. Enters card details
6. Payment processed instantly
7. ✅ Registration confirmed immediately
8. Email: "Registration Confirmed + Payment Receipt"
```

**Database State:**
```sql
payment_method: 'card'
payment_status: 'paid' (after Stripe webhook)
payment_intent_id: 'pi_abc123...'
```

---

### **Scenario 2: Pay Now - Bank Transfer (Manual Verification)**

```
User Flow:
1. User fills out registration form
2. Selects "Pay Now - Bank Transfer"
3. Sees bank account details + unique payment reference
4. Optionally uploads proof of payment
5. Submits registration
6. → Success message "Transfer money within 7 days"
7. Email: "Registration Pending + Bank Transfer Instructions"
8. Admin verifies payment (1-2 business days)
9. ✅ Status changed to 'paid'
10. Email: "Payment Confirmed"
```

**Database State:**
```sql
payment_method: 'bank_transfer'
payment_status: 'pending' → 'paid' (after admin verification)
payment_reference: 'ICD11-001-7234' (unique)
bank_transfer_proof_url: 'https://...' (optional)
bank_transfer_verified: true (after admin approval)
```

---

### **Scenario 3: Pay Later (Flexible Deadline)**

```
User Flow:
1. User fills out registration form
2. Selects "Pay Later" (default)
3. Submits registration
4. → Success message "Payment due by [DEADLINE]"
5. Email: "Registration Confirmed + Payment Instructions"
6. User receives payment link in email
7. User clicks link and pays (any time before deadline)
8. ✅ Status changed to 'paid'

Auto-Reminders:
- Day 3: "Reminder: Payment pending"
- Day 7: "Reminder: Payment due soon"
- Day 14: "Final reminder: Payment overdue"
```

**Database State:**
```sql
payment_method: null (not selected yet)
payment_status: 'pending'
payment_reminders: [
  { scheduled_for: NOW() + 3 days, status: 'pending' },
  { scheduled_for: NOW() + 7 days, status: 'pending' },
  { scheduled_for: NOW() + 14 days, status: 'pending' }
]
```

---

## 💻 **Implementation Details**

### **1. Registration Form UI**

```tsx
// Payment Preference Selection (components/RegistrationForm.tsx)
const [paymentPreference, setPaymentPreference] = useState<
  'pay_now_card' | 'pay_now_bank' | 'pay_later'
>('pay_later') // Default: Pay Later

// Radio buttons:
⚪ Pay Now - Credit/Debit Card (Instant confirmation)
⚪ Pay Now - Bank Transfer (Manual verification, 1-2 days)
⚪ Pay Later (Register now, pay later) ← DEFAULT
```

---

### **2. Backend Logic**

```typescript
// app/api/register/route.ts

// Determine payment method and status based on preference
if (payment_preference === 'pay_now_card') {
  payment_method = 'card'
  payment_status = 'pending' // Will become 'paid' after Stripe webhook
} else if (payment_preference === 'pay_now_bank') {
  payment_method = 'bank_transfer'
  payment_status = 'pending' // Will become 'paid' after admin verification
} else if (payment_preference === 'pay_later') {
  payment_method = null // Not selected yet
  payment_status = 'pending' // Still needs to pay, but later
}

// Insert registration
await supabase.from('registrations').insert({
  ...data,
  payment_method,
  payment_status,
})
```

---

### **3. Payment Reminder System**

#### **Database Trigger (Auto-create reminders)**

```sql
-- supabase/migrations/040_add_multi_currency_and_bank_transfer.sql

CREATE FUNCTION create_payment_reminder_on_registration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'pending' THEN
    -- Schedule reminders at 3, 7, 14 days
    INSERT INTO payment_reminders (
      registration_id,
      conference_id,
      scheduled_for,
      status
    ) VALUES 
      (NEW.id, NEW.conference_id, NOW() + INTERVAL '3 days', 'pending'),
      (NEW.id, NEW.conference_id, NOW() + INTERVAL '7 days', 'pending'),
      (NEW.id, NEW.conference_id, NOW() + INTERVAL '14 days', 'pending');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_payment_reminder
  AFTER INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION create_payment_reminder_on_registration();
```

#### **Cron Job (Send reminders)**

Create **Vercel Cron Job** or **Supabase Edge Function** to send reminders:

**Option A: Vercel Cron** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/send-payment-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

**Option B: Supabase Edge Function** (cron trigger every day at 9 AM):
```typescript
// supabase/functions/send-payment-reminders/index.ts

import { createClient } from '@supabase/supabase-js'

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get all pending reminders that are due
  const { data: reminders } = await supabase
    .from('payment_reminders')
    .select('*, registrations(*), conferences(*)')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())

  for (const reminder of reminders || []) {
    // Send email
    await sendPaymentReminderEmail(reminder)
    
    // Mark as sent
    await supabase
      .from('payment_reminders')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', reminder.id)
  }

  return new Response(JSON.stringify({ sent: reminders?.length || 0 }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

---

## 🎨 **UX/UI - What Users See**

### **Registration Form - Payment Options**

```
┌─────────────────────────────────────────────────────┐
│ 💳 Payment Options                                  │
├─────────────────────────────────────────────────────┤
│ ⚪ Pay Now - Credit/Debit Card                      │
│    Pay securely with Stripe (Instant confirmation) │
│    [Instant] badge                                  │
│                                                     │
│ ⚪ Pay Now - Bank Transfer                          │
│    Transfer to our bank account (1-2 days)         │
│    [1-2 days] badge                                 │
│                                                     │
│ ⚫ Pay Later (Selected)                             │
│    Register now, receive payment instructions      │
│    [Flexible] badge                                 │
│                                                     │
│    📧 You will receive an email with payment       │
│       instructions and a payment link.             │
│       Reminders will be sent after 3, 7, 14 days.  │
└─────────────────────────────────────────────────────┘
```

---

## 📧 **Email Templates**

### **Email 1: Registration Confirmed (Pay Later)**

```
Subject: Registration Confirmed - [Conference Name]

Dear [Name],

Your registration for [Conference Name] has been confirmed!

Registration Details:
- Registration Number: ICD11-001
- Registration Type: Early Bird
- Amount Due: 150.00 EUR

Payment Instructions:
You can complete your payment at any time by clicking the link below:
[Pay Now Button]

Payment Deadline: [30 days before conference]

We will send you reminders to help you remember to complete your payment.

Best regards,
[Conference Team]
```

---

### **Email 2: Payment Reminder (After 3 days)**

```
Subject: Payment Reminder - [Conference Name] Registration

Dear [Name],

This is a friendly reminder that your registration payment is still pending.

Registration Details:
- Registration Number: ICD11-001
- Amount Due: 150.00 EUR
- Payment Deadline: [DATE]

[Pay Now Button]

Need help? Reply to this email and we'll assist you.

Best regards,
[Conference Team]
```

---

## 🔄 **Admin Workflow**

### **Admin Dashboard - Pending Payments**

```
┌────────────────────────────────────────────────────────────────┐
│ 💰 Pending Payments (Bank Transfers)                          │
├────────────────────────────────────────────────────────────────┤
│ Registration   Name          Amount    Payment Ref    Proof    │
│ ICD11-001      John Doe      150 EUR   ICD11-001-7234 [View]  │
│                                                        [✓ Mark  │
│                                                         as Paid]│
│ ICD11-002      Jane Smith    170 USD   ICD11-002-8921 [None]  │
│                                                        [✓ Mark  │
│                                                         as Paid]│
└────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ **Configuration Options**

### **Conference Settings (Admin Panel)**

Admins can customize payment behavior per conference:

```tsx
// Conference Settings → Payment
{
  payment_required: boolean // Enable/disable payment
  payment_deadline_days: number // Days before conference (default: 30)
  auto_reminders: boolean // Enable/disable auto-reminders
  reminder_schedule: [3, 7, 14] // Days after registration
  allow_pay_later: boolean // Allow "Pay Later" option
  allow_bank_transfer: boolean // Allow bank transfer option
}
```

---

## ✅ **Benefits of This Approach**

### **For Users:**
1. ✅ **Flexibility** - Choose when and how to pay
2. ✅ **No payment failures block registration** - Can register even if payment method fails
3. ✅ **Corporate invoices** - Register first, company pays later
4. ✅ **Multiple attempts** - Can try different payment methods
5. ✅ **Early bird pricing** - Register early, pay later

### **For Admins:**
1. ✅ **More registrations** - Lower barrier to entry
2. ✅ **Better cash flow** - Reminders ensure payment
3. ✅ **Manual verification** - Control over bank transfers
4. ✅ **Transparency** - Track payment status per registration
5. ✅ **Flexibility** - Can configure per conference

---

## 🚀 **Testing Scenarios**

### **Test 1: Pay Later (Default)**
1. Register without selecting payment method
2. Submit registration → Success
3. Check email → Payment instructions received
4. Wait 3 days → Reminder email received
5. Click "Pay Now" in email → Redirected to payment page
6. Complete payment → Status = 'paid'

### **Test 2: Pay Now - Credit Card**
1. Register and select "Pay Now - Card"
2. Submit registration → Redirect to Stripe
3. Enter card details → Payment processed
4. Stripe webhook → Status = 'paid'
5. Check email → Confirmation + Receipt

### **Test 3: Pay Now - Bank Transfer**
1. Register and select "Pay Now - Bank Transfer"
2. See bank account details + payment reference
3. Upload proof of payment (optional)
4. Submit registration → Success message
5. Admin verifies payment → Status = 'paid'
6. Check email → Confirmation

---

## 📊 **Database Schema**

```sql
-- registrations table
payment_method VARCHAR(50) -- 'card', 'bank_transfer', 'cash', null
payment_status VARCHAR(50) -- 'pending', 'paid', 'not_required'
payment_reference VARCHAR(100) -- Unique reference for bank transfers
bank_transfer_proof_url TEXT -- Uploaded proof
bank_transfer_verified BOOLEAN -- Admin verification flag

-- payment_reminders table
registration_id UUID
conference_id UUID
scheduled_for TIMESTAMP -- When to send reminder
sent_at TIMESTAMP -- When reminder was sent
status VARCHAR(50) -- 'pending', 'sent', 'failed', 'cancelled'
```

---

## ❓ **FAQ**

### **Q: Why is "Pay Later" the default option?**
**A:** Industry standard. Most conferences allow registration without immediate payment to maximize registrations. Payment failures shouldn't block registration.

### **Q: What if someone never pays?**
**A:** Auto-reminders are sent at 3, 7, 14 days. Admin can manually follow up or cancel registration.

### **Q: Can I make payment mandatory at registration?**
**A:** Yes! In conference settings, you can disable "Pay Later" option and require immediate payment.

### **Q: How do I know if a bank transfer was received?**
**A:** Admin dashboard shows all pending bank transfers. Admin manually verifies each one.

### **Q: Can users change their payment method after registering?**
**A:** Yes! They receive a payment link in email where they can select any available method.

---

## 🎓 **Best Practices**

1. ✅ **Default to "Pay Later"** - Maximizes registrations
2. ✅ **Clear deadlines** - Specify payment deadline (e.g., 30 days before event)
3. ✅ **Multiple reminders** - 3, 7, 14 days (not annoying, just helpful)
4. ✅ **Easy payment link** - One-click from email
5. ✅ **Admin control** - Manual verification for bank transfers
6. ✅ **Transparent status** - Users always know payment status
7. ✅ **Flexible options** - Card, Bank Transfer, Pay Later

---

**Last Updated:** January 2026  
**Version:** 1.0.0
