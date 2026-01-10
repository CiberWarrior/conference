# Multiple Participants Feature

## Pregled

Multiple Participants feature omogućava registraciju više sudionika u jednoj prijavi. Ova funkcionalnost je idealna za:
- Grupne registracije (npr. turistička agencija koja registrira cijelu grupu)
- Konferencijske delegacije
- Organizacije koje šalju više članova
- Bilo koji scenarij gdje jedna osoba registrira više sudionika

## Ključne značajke

### 1. Fleksibilna konfiguracija
- **Enable/Disable**: Admin može uključiti ili isključiti multiple participants za svaku konferenciju
- **Min/Max limiti**: Postavite minimalni (default: 1) i maksimalni (default: 5, max: 50) broj sudionika
- **Customizable Label**: Promijenite naziv (npr. "Participant", "Attendee", "Delegate")
- **Obavezna/Opcionalna polja**: Odaberite koja polja su obavezna za svakog sudionika

### 2. Polja po sudioniku
Svaki sudionik može imati:
- **Osnovna polja**: First Name, Last Name, Email (obavezna)
- **Opcionalna polja**: Phone, Country, Institution, Arrival Date, Departure Date
- **Custom fields**: Ako je omogućeno, sva custom polja se primjenjuju na svakog sudionika

### 3. Validacija
- Unique email addresses (opcionalno)
- Validacija datuma (departure nakon arrival)
- Required field validation
- Maximum participant limit enforcement

## Arhitektura

### Database Schema

#### 1. Migration: `026_add_participants_support.sql`
```sql
-- Dodaje participants JSONB kolonu u registrations tablicu
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS participants JSONB DEFAULT '[]'::jsonb;

-- GIN index za efikasne JSONB queries
CREATE INDEX IF NOT EXISTS idx_registrations_participants 
ON registrations USING GIN (participants);
```

**Struktura podataka:**
```json
{
  "participants": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "country": "USA",
      "institution": "University XYZ",
      "customFields": {
        "dietary_requirements": "Vegetarian",
        "tshirt_size": "M"
      }
    }
  ]
}
```

#### 2. Conference Settings
Participant settings se pohranjuju u `conferences.settings.participant_settings`:
```json
{
  "enabled": true,
  "minParticipants": 1,
  "maxParticipants": 10,
  "requireUniqueEmails": true,
  "participantFields": ["firstName", "lastName", "email", "phone", "country", "institution"],
  "customFieldsPerParticipant": true,
  "participantLabel": "Participant"
}
```

### TypeScript Types

#### 1. `types/participant.ts`
Definira sve potrebne tipove za multiple participants:
- `Participant`: Interface za pojedinačnog sudionika
- `ParticipantSettings`: Konfiguracija participant settings
- `DEFAULT_PARTICIPANT_SETTINGS`: Default vrijednosti
- `AVAILABLE_PARTICIPANT_FIELDS`: Lista dostupnih polja

#### 2. `types/conference.ts`
Ažurirano da uključuje `ParticipantSettings` u `ConferenceSettings`

#### 3. `types/registration.ts`
`Registration` interface sada uključuje:
```typescript
export interface Registration extends RegistrationData {
  // ... ostala polja
  participants?: Participant[] // Multiple participants support
}
```

### Components

#### 1. `ParticipantManager` Component
**Lokacija:** `components/admin/ParticipantManager.tsx`

Glavna komponenta za upravljanje multiple participants u registration formi.

**Props:**
- `participants`: Array postojećih sudionika
- `onChange`: Callback za promjene
- `maxParticipants`: Maksimalni broj dozvoljen
- `participantFields`: Polja koja se prikazuju
- `customFields`: Custom polja za primjenu
- `participantLabel`: Label za sudionika
- `customFieldsPerParticipant`: Da li primjenjivati custom fields

**Features:**
- Add/Remove participants
- Expand/Collapse view za svakog sudionika
- Dynamic field rendering based on settings
- Validation for all fields
- Custom fields support per participant

#### 2. `RegistrationForm` Updates
**Lokacija:** `components/RegistrationForm.tsx`

Ažuriran da integriše `ParticipantManager`:
- Dodana `participantSettings` prop
- State management za participants array
- Conditional rendering based on settings
- Integration s postojećom form validacijom

### API Endpoints

#### 1. Registration API (`/api/register`)
**Updates:**
- Validation schema ažuriran da podržava `participants` array
- Validacija za sve participant podatke
- Spremanje participants u bazu
- Email validacija za unique emails (ako je enabled)

#### 2. Form Builder API (`/api/admin/conferences/[id]/registration-form`)
**GET endpoint:**
- Vraća `participantSettings` zajedno s `customFields`

**PUT endpoint:**
- Ažurira `participantSettings` u conference settings
- Validacija participant settings
- Spremanje u bazu

### Admin Interface

#### Form Builder Page
**Lokacija:** `app/admin/conferences/[id]/form-builder/page.tsx`

Dodana nova sekcija "Multiple Participants" koja omogućava:

1. **Toggle Enable/Disable**
2. **Participant Label** - Customizable naziv
3. **Min/Max Participants** - Number inputs
4. **Require Unique Emails** - Checkbox
5. **Custom Fields Per Participant** - Checkbox
6. **Participant Fields Selection** - Multi-select checkboxes

**UI Features:**
- Collapsible section
- Real-time validation
- Unsaved changes warning
- Save/Cancel functionality

### Export Functionality

#### Registrations Export
**Lokacija:** `app/admin/registrations/page.tsx`

Export (Excel/CSV) ažuriran da uključuje:
- Number of Participants kolona
- Participant Names (semicolon-separated)
- Participant Emails (semicolon-separated)

## Kako koristiti

### 1. Konfiguracija (Admin)

**Step 1:** Navigate to Form Builder
- Admin Panel → My Conferences → Select Conference → Registration Form

**Step 2:** Enable Multiple Participants
- Scroll to "Multiple Participants" section
- Toggle ON
- Configure settings:
  - Set participant label (e.g., "Delegate")
  - Set min/max participants (e.g., 1-10)
  - Choose required fields
  - Enable/disable unique email requirement
  - Enable/disable custom fields per participant

**Step 3:** Save Changes
- Click "Save Changes" button
- Settings are now active for registration form

### 2. Registration (Public User)

**Za korisnike:**
1. Visit conference registration page
2. Fill in main registrant information
3. Scroll to "Participants" section (if enabled)
4. Click "Add Participant" to add additional participants
5. Fill in information for each participant
6. Expand/collapse each participant card for easier management
7. Remove participants if needed
8. Submit registration

**Participant numbering:**
- Participants are numbered (Participant 1, Participant 2, etc.)
- Each has expand/collapse functionality
- Shows name and email in collapsed view

### 3. Viewing Registrations (Admin)

**Registrations page:**
- Each registration shows total participant count
- Export includes all participant data
- Filter and search work across all fields

## Permissions

Multiple Participants feature poštuje postojeće permission system:
- **Super Admin**: Full access to all features
- **Conference Admin**: Can manage registration form if has `can_manage_registration_form` permission
- Permission checks u svim API endpointima

## Testing

### Manual Testing Checklist

#### Admin Interface:
- [ ] Can enable/disable multiple participants
- [ ] Can set min/max participants
- [ ] Can customize participant label
- [ ] Can select required fields
- [ ] Can enable/disable unique emails
- [ ] Changes save correctly
- [ ] Settings persist after reload

#### Registration Form:
- [ ] Participant section shows when enabled
- [ ] Can add participants up to max limit
- [ ] Can remove participants (minimum respected)
- [ ] All fields validate correctly
- [ ] Custom fields apply per participant if enabled
- [ ] Email uniqueness enforced if enabled
- [ ] Submission works with participants

#### Export:
- [ ] Participant count in export
- [ ] Participant names in export
- [ ] Participant emails in export

#### Permissions:
- [ ] Non-admin cannot access form builder
- [ ] Conference admin with permission can edit
- [ ] Super admin has full access

## Database Migration

**To apply migration:**

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `supabase/migrations/026_add_participants_support.sql`
4. Run the query
5. Verify:
   - `registrations` table has `participants` column (JSONB)
   - Index `idx_registrations_participants` exists

**Rollback (if needed):**
```sql
-- Remove index
DROP INDEX IF EXISTS idx_registrations_participants;

-- Remove column
ALTER TABLE registrations DROP COLUMN IF EXISTS participants;
```

## Best Practices

### 1. Setting Min/Max Participants
- For group registrations: min=2, max=10
- For flexible events: min=1, max=5
- For large delegations: min=1, max=20

### 2. Required Fields
- Always require: firstName, lastName, email
- Consider optional: phone, institution
- Context-dependent: arrival/departure dates

### 3. Custom Fields
- Enable per-participant for: dietary requirements, shirt sizes, workshops
- Keep global for: payment info, special requests

### 4. Email Validation
- Enable unique emails for: individual communications, certificates
- Disable for: family groups, joint registrations

## Future Enhancements

Potencijalna proširenja:
1. **Bulk Import**: Upload CSV with multiple participants
2. **Participant Types**: Different types (speaker, attendee, VIP)
3. **Individual Pricing**: Different prices per participant type
4. **Participant Badges**: Generate badges for each participant
5. **Participant Certificates**: Individual certificates
6. **Email to All Participants**: Bulk email to all in registration
7. **Participant QR Codes**: Individual check-in codes

## Troubleshooting

### Problem: Participant section not showing
**Solution:** Check that `participantSettings.enabled` is `true` in conference settings

### Problem: Cannot add more participants
**Solution:** Check `maxParticipants` setting - might be at limit

### Problem: Validation errors on submit
**Solution:** Ensure all required fields filled for each participant, check date validations

### Problem: Export missing participant data
**Solution:** Refresh page, check that `participants` column exists in database

## Support

Za pitanja ili probleme:
- Check this documentation first
- Review code comments in components
- Check database schema
- Contact development team

---

**Created:** 2026-01-10  
**Version:** 1.0  
**Status:** Production Ready ✅
