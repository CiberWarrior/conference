# Custom Registration Fee System (New Design)

## Overview

One custom registration fee = **one price** + **one validity period** + **one capacity**. No global pricing tiers (no early/regular/late). If an organizer wants multiple prices over time, they create multiple fee records.

## What Was Implemented

### 1. TypeScript types (`types/custom-registration-fee.ts`)

- **CustomRegistrationFee** – DB row: id, conference_id, name, valid_from, valid_to, is_active, price_net, price_gross, capacity, currency, display_order, timestamps.
- **CustomRegistrationFeeInput** – Admin create/update: name, dates, is_active, price_net OR price_gross, prices_include_vat, capacity, currency.
- **RegistrationFeeOption** – Public form: id, name, price_gross, currency, is_available, disabled_reason?, sold_count?, capacity?.
- **CustomRegistrationFeeAdmin** – Admin dashboard: extends CustomRegistrationFee with sold_count, is_sold_out.
- **FeeUnavailableReason** – `'sold_out' | 'not_available_yet' | 'expired' | 'inactive'`.

### 2. Database (`supabase/migrations/051_create_custom_registration_fees.sql`)

- **custom_registration_fees** table: id, conference_id, name, valid_from, valid_to, is_active, price_net, price_gross, capacity, currency, display_order, created_at, updated_at. Constraints: valid_to >= valid_from, non-negative prices/capacity.
- **registrations.registration_fee_id** – UUID FK to custom_registration_fees (new). Legacy **registration_fee_type** remains for old data.

### 3. Backend (`lib/custom-registration-fees.ts`)

- **getCustomRegistrationFees(supabase, conferenceId)** – Fetch all fees for a conference.
- **getSoldCountsByFeeId(supabase, conferenceId)** – Count of registrations per fee (where registration_fee_id = fee.id).
- **isFeeSoldOut(capacity, soldCount)** – true when capacity set and sold_count >= capacity.
- **isFeeInValidityWindow(validFrom, validTo, asOf)** – current date in [valid_from, valid_to].
- **getFeeUnavailableReason(fee, soldCount, asOf)** – returns disabled reason when fee not selectable.
- **getAvailableFeesForForm(supabase, conferenceId, asOf?)** – List of RegistrationFeeOption; invalid fees have is_available: false and disabled_reason.
- **getFeesForAdmin(supabase, conferenceId)** – List of CustomRegistrationFeeAdmin (net + gross, sold_count, is_sold_out).

### 4. API for registration form

- **GET /api/conferences/[slug]/registration-fees**
- Response: `{ fees: RegistrationFeeOption[], currency: string }`
- Public form should show only **price_gross**. Invalid fees are still returned with `is_available: false` and `disabled_reason`; do NOT hide the form when no fee is available.

---

## What to REMOVE or DEPRECATE (Old Pricing System)

### Remove / do not use for the new flow

1. **Tier-based pricing in `utils/pricing.ts`**
   - **getCurrentPricingTier** – remove or mark deprecated; no early/regular/late for custom fees.
   - **getCurrentPricing** – remove or deprecate; no global participant/student/accompanying prices by tier.
   - **PricingTier** type (`'early_bird' | 'regular' | 'late'`) – deprecate for registration fee selection.
   - **getEffectiveFeeTypeAmount(ft, tier)** – remove; custom fees have a single price per record.
   - **getFeeTypePricingMode**, **getTierDisplayName** – only needed for legacy UI; can deprecate when form uses new API.

2. **ConferencePricing tier structure (`types/conference.ts`)**
   - **early_bird**, **regular**, **late** (amounts, dates) – deprecate for *registration fee* logic; keep only if still used for display/legacy.
   - **CustomFeeType** (tiered/fixed/free, early_bird/regular/late amounts, price_after_capacity_full) – replace with **CustomRegistrationFee** (DB table); do not extend.
   - **custom_fee_types** on ConferencePricing – for new flow, fees come from **custom_registration_fees** table and GET `/registration-fees`, not from `conference.pricing.custom_fee_types`.

3. **Registration form / API**
   - **registration_fee_type** (values like `early_bird`, `regular`, `fee_type_<id>`) – for new flow, store **registration_fee_id** (UUID) and optionally keep registration_fee_type for backward compatibility during migration.

4. **Charge amount**
   - **getRegistrationChargeAmount** in `utils/pricing.ts` – for registrations that use **registration_fee_id**, compute amount from **custom_registration_fees.price_gross** (or price_net + conference VAT if you need net for invoicing). Do not use tier or CustomFeeType for that path.

### Keep (unchanged or shared)

- **utils/pricing.ts**: **calculatePriceWithVAT**, **calculatePriceWithoutVAT**, **getPriceBreakdownFromInput** – use when admin enters one of net/gross and you need to store both.
- **ConferencePricing.vat_percentage**, **prices_include_vat**, **currency** – use for (1) computing net/gross when creating/updating a fee, (2) default currency when no fees exist.
- **conference.pricing** JSONB – can keep for VAT/currency and any legacy fields until fully migrated; new fee data lives in **custom_registration_fees** table.

### Summary table

| Item | Action |
|------|--------|
| getCurrentPricingTier, getCurrentPricing | Deprecate / remove for fee selection |
| CustomFeeType (tiered/fixed, early/regular/late) | Replace with CustomRegistrationFee (table) |
| custom_fee_types in conference.pricing | New flow: fees from DB + GET /registration-fees |
| registration_fee_type (text) | New flow: use registration_fee_id (UUID) |
| getRegistrationChargeAmount (tier/custom_fee_types path) | Add branch: if registration_fee_id set, use custom_registration_fees.price_gross |
| VAT/currency helpers, conference VAT | Keep; use when storing net+gross for new fees |

---

## Visibility rules (recap)

A fee is **selectable** only if:

- `is_active === true`
- Current date is between `valid_from` and `valid_to` (inclusive)
- Not sold out: `capacity` is null or `sold_count < capacity`

If a fee is invalid, the API still returns it with `is_available: false` and `disabled_reason` (e.g. `"Sold out"`, `"Not available yet"`, `"Expired"`, `"Inactive"`). Do not hide the registration form when fees are misconfigured.
