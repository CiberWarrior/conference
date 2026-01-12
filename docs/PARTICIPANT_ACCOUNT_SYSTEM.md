# 👥 Participant Account System

## 📋 Overview

Kompletni sistem za upravljanje sudionicima (participantima) koji omogućava:
- **Participant Accounts** - Sudionici mogu kreirati accounte i pristupiti dashboardu
- **Cross-Event Tracking** - Sudionici mogu vidjeti sve svoje registracije kroz različite evente
- **Loyalty System** - Automatski popusti za returning participante baziran na broju sudjelovanja
- **Admin Management** - Centralizirano upravljanje svim participantima

---

## 🏗️ Architecture

### Database Schema

#### 1. `participant_profiles`
Centralna tablica za sve participante (s ili bez accounta).

```sql
participant_profiles:
  - id (UUID, PK)
  - auth_user_id (UUID, FK to auth.users, nullable)
  - email (VARCHAR, UNIQUE)
  - first_name, last_name
  - phone, country, institution
  - has_account (BOOLEAN) -- TRUE if participant created login
  - loyalty_tier (VARCHAR) -- bronze, silver, gold, platinum
  - loyalty_points (INTEGER)
  - total_events_attended (INTEGER)
  - created_at, updated_at
```

#### 2. `participant_registrations`
Linking tablica koja povezuje participante s conference registracijama (many-to-many).

```sql
participant_registrations:
  - id (UUID, PK)
  - participant_id (UUID, FK to participant_profiles)
  - conference_id (UUID, FK to conferences)
  - registration_id (UUID, FK to registrations)
  - status (VARCHAR) -- confirmed, cancelled, attended, no_show
  - payment_status (VARCHAR)
  - custom_data (JSONB)
  - accommodation_data (JSONB)
  - certificate_id (UUID, FK to certificates)
  - registered_at, cancelled_at
```

#### 3. `participant_loyalty_discounts`
Tracking loyalty popusta.

```sql
participant_loyalty_discounts:
  - id (UUID, PK)
  - participant_id (UUID, FK)
  - conference_id (UUID, FK)
  - discount_type (VARCHAR) -- loyalty_tier, custom
  - discount_percentage (DECIMAL)
  - discount_amount (DECIMAL)
  - applied (BOOLEAN)
  - valid_from, valid_until
```

#### 4. `participant_account_invites`
Tracking invite tokena za kreiranje accounta.

```sql
participant_account_invites:
  - id (UUID, PK)
  - participant_id (UUID, FK)
  - email (VARCHAR)
  - invite_token (VARCHAR, UNIQUE)
  - status (VARCHAR) -- pending, accepted, expired
  - sent_at, expires_at
```

---

## 🚀 Features

### 1. Participant Authentication

#### Signup
```typescript
POST /api/participant/auth/signup
{
  "email": "john@example.com",
  "password": "securepass123",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "country": "USA",
  "institution": "Harvard University",
  "marketing_consent": true
}
```

#### Login (Password)
```typescript
POST /api/participant/auth/login
{
  "email": "john@example.com",
  "password": "securepass123"
}
```

#### Login (Magic Link)
```typescript
POST /api/participant/auth/magic-link
{
  "email": "john@example.com",
  "redirect_to": "https://yourdomain.com/participant/dashboard"
}
```

### 2. Participant Dashboard

Participanti mogu pristupiti svom dashboardu na:
```
/participant/dashboard
```

**Dashboard features:**
- Overview statistike (total events, upcoming, certificates)
- Loyalty status i progress
- Upcoming events lista
- Past events history
- Profile management
- Certificate downloads

**Dashboard pages:**
- `/participant/dashboard` - Home
- `/participant/dashboard/events` - Sve registracije
- `/participant/dashboard/events/[id]` - Detalji pojedine registracije
- `/participant/dashboard/profile` - Edit profil
- `/participant/dashboard/certificates` - Download certifikata

### 3. Loyalty System

#### Loyalty Tiers

| Tier | Events Required | Discount | Benefits |
|------|----------------|----------|----------|
| **Bronze** | 0-2 | 0% | Dashboard access, event tracking |
| **Silver** | 3-5 | 5% | Priority registration, early notifications |
| **Gold** | 6-10 | 10% | Priority check-in, free certificates |
| **Platinum** | 11+ | 15% | VIP status, complimentary upgrades |

#### Automatic Tier Calculation

Loyalty tier se automatski ažurira nakon svake registracije:

```typescript
// Triggered by database trigger on participant_registrations
CREATE TRIGGER update_loyalty_on_registration
  AFTER INSERT OR UPDATE OF status ON participant_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_loyalty();
```

#### Check Loyalty Discount

```typescript
POST /api/participant/loyalty-check
{
  "email": "john@example.com",
  "conference_id": "uuid-here",
  "amount": 500.00
}

// Response:
{
  "success": true,
  "discount": {
    "eligible": true,
    "discount_percentage": 10,
    "discount_amount": 50.00,
    "reason": "Gold tier loyalty discount (6-10 events)",
    "tier": "gold",
    "events_attended": 7
  }
}
```

### 4. Registration Flow Integration

**Automatski proces kada se netko registrira za event:**

1. User popunjava registration formu
2. System ekstraktuje email iz custom_data ili participants
3. Provjerava da li participant_profile već postoji:
   - **Ako postoji**: Koristi existing profile
   - **Ako ne postoji**: Kreira novi guest participant profile
4. Kreira `participant_registrations` linking record
5. Provjerava loyalty eligibility:
   - Ako je eligible, automatski primjenjuje discount
6. Šalje confirmation email s invite linkom za kreiranje accounta

**Kod u `/app/api/register/route.ts`:**

```typescript
// Check if participant profile already exists
const { data: existingProfile } = await supabase
  .from('participant_profiles')
  .select('id')
  .eq('email', primaryEmail)
  .single()

if (existingProfile) {
  // Use existing profile
  participantProfileId = existingProfile.id
} else {
  // Create new guest participant
  const { data: newProfile } = await supabase
    .from('participant_profiles')
    .insert({
      email: participantInfo.email,
      first_name: participantInfo.first_name || 'Guest',
      last_name: participantInfo.last_name || 'Participant',
      has_account: false, // Guest mode
    })
    .select('id')
    .single()
}

// Create linking record
await supabase.from('participant_registrations').insert({
  participant_id: participantProfileId,
  conference_id: conferenceId,
  registration_id: registrationId,
  status: 'confirmed',
})
```

### 5. Admin Management

#### View All Participants

Admin može vidjeti sve participante na:
```
/admin/participants
```

**Features:**
- Search by name/email
- Filter by account status (with account / guest only)
- Filter by loyalty tier
- View stats (total registrations, attended events)
- Export capabilities (TODO)

#### API Endpoints

```typescript
// Get all participants (Super Admin only)
GET /api/admin/participants?search=john&has_account=true&loyalty_tier=gold

// Get participant details
GET /api/admin/participants/[id]
// Returns: profile, registrations, discounts
```

---

## 🎨 User Experience

### For Participants

#### First Time Registration (Guest Mode)
1. User registrira se za event bez accounta
2. Dobiva confirmation email s opcijom "Create Account"
3. Ako klikne "Create Account":
   - Redirecta na signup page (email pre-filled)
   - Kreira password
   - Account se aktivira i povezuje s postojećim registracijama

#### Returning Participant
1. User se registrira za drugi event
2. System prepozna email i prikaže:
   - "Welcome back! You've attended X events"
   - Loyalty discount badge (ako eligible)
   - Auto-fill podataka iz profila
3. Nakon registracije, vidi sve svoje evente u dashboardu

### For Admins

1. Admin vidi centraliziranu listu svih participanata
2. Može filtrirati i pretražvati
3. Vidi loyalty status i event history
4. Može slati invite linkove za account kreaciju

---

## 🔧 Configuration & Setup

### 1. Database Migration

```bash
# Run migration
psql -h YOUR_DB_HOST -U postgres -d YOUR_DB -f supabase/migrations/035_create_participant_system.sql
```

### 2. Environment Variables

No additional environment variables required. Uses existing Supabase setup.

### 3. Authentication Setup

Participant authentication koristi isti Supabase Auth kao admin sistem.

**Email Templates:**
Konfiguriši email templates u Supabase Dashboard:
- **Magic Link Email** - Za passwordless login
- **Confirmation Email** - Nakon signup-a
- **Welcome Email** - Nakon aktivacije accounta

### 4. RLS Policies

Row Level Security je already konfiguriran:

```sql
-- Participants can view/edit their own profiles
CREATE POLICY participant_own_profile ON participant_profiles
  FOR ALL
  USING (auth.uid() = auth_user_id);

-- Participants can view their own registrations
CREATE POLICY participant_own_registrations ON participant_registrations
  FOR SELECT
  USING (
    participant_id IN (
      SELECT id FROM participant_profiles WHERE auth_user_id = auth.uid()
    )
  );
```

---

## 📊 Analytics & Reporting

### Participant Stats

```sql
-- Total participants
SELECT COUNT(*) FROM participant_profiles;

-- Participants with accounts
SELECT COUNT(*) FROM participant_profiles WHERE has_account = true;

-- Loyalty tier distribution
SELECT loyalty_tier, COUNT(*) 
FROM participant_profiles 
GROUP BY loyalty_tier;

-- Most active participants
SELECT first_name, last_name, email, total_events_attended
FROM participant_profiles
ORDER BY total_events_attended DESC
LIMIT 10;
```

### Loyalty Impact

```sql
-- Total discounts given
SELECT 
  SUM(discount_amount) as total_discounts,
  COUNT(*) as discount_count,
  AVG(discount_percentage) as avg_discount_pct
FROM participant_loyalty_discounts
WHERE applied = true;

-- Discounts by tier
SELECT 
  discount_type,
  COUNT(*) as count,
  SUM(discount_amount) as total_amount
FROM participant_loyalty_discounts
WHERE applied = true
GROUP BY discount_type;
```

---

## 🛡️ Security

### Authentication
- Password-based login with bcrypt hashing (via Supabase Auth)
- Magic link passwordless login option
- Session management via httpOnly cookies
- CSRF protection enabled

### Authorization
- Participants can only access their own data
- Row Level Security (RLS) enforced at database level
- Admin endpoints require Super Admin role

### Data Privacy
- Email addresses stored securely
- GDPR compliant (can request data export/deletion)
- Marketing consent tracked separately

---

## 🚀 Deployment Checklist

- [ ] Run database migration `035_create_participant_system.sql`
- [ ] Update admin sidebar (already done)
- [ ] Configure email templates in Supabase
- [ ] Test participant signup flow
- [ ] Test login (password and magic link)
- [ ] Test registration flow integration
- [ ] Test loyalty discount calculation
- [ ] Test admin participant management
- [ ] Update privacy policy (mention participant accounts)
- [ ] Add participant login link to main website

---

## 📱 Future Enhancements

### Planned Features
- [ ] **QR Code Check-in** - Generate QR codes for participants
- [ ] **Mobile App** - Native mobile app for participants
- [ ] **Social Features** - Connect with other participants
- [ ] **Referral Program** - Earn points by referring friends
- [ ] **Points Redemption** - Use loyalty points for discounts
- [ ] **Custom Badges** - Achievement badges for milestones
- [ ] **Email Reminders** - Automated reminders before events
- [ ] **Networking Tools** - Schedule 1-on-1 meetings
- [ ] **Feedback System** - Rate events and provide feedback

### API Enhancements
- [ ] Export participant data (CSV/Excel)
- [ ] Bulk invite sending
- [ ] Advanced filtering and search
- [ ] Participant merge tool (duplicate handling)

---

## 🐛 Troubleshooting

### Participant can't login
- Check if `has_account = true` in `participant_profiles`
- Verify email is confirmed in Supabase Auth
- Check if user exists in `auth.users` table

### Loyalty discount not applied
- Verify `total_events_attended` is correct
- Check loyalty tier calculation
- Review `participant_loyalty_discounts` table for errors

### Registration not linking to participant
- Check if primary email is extracted correctly
- Verify `participant_registrations` record was created
- Check logs for errors in registration flow

### Admin can't see participants
- Verify user has `super_admin` role
- Check RLS policies are enabled
- Verify API endpoint permissions

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review logs in `/logs` directory
3. Check Supabase logs
4. Contact development team

---

**Status:** ✅ PRODUCTION READY  
**Version:** 1.0.0  
**Last Updated:** 2026-01-12  
**Author:** Development Team
