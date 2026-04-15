# Event Architecture Proposal

## Problem
Trenutno imamo samo `conferences` tabelu, ali trebamo podržati različite tipove događaja:
- Conferences (konferencije)
- Workshops (radionice)
- Seminars (seminari)
- Webinars (vebinari)
- Training courses (obuke)
- i drugi tipovi događaja

## Predloženo Rešenje: Single Table Inheritance (STI)

### Opcija 1: Rename `conferences` → `events` (PREPORUČENO)
**Prednosti:**
- ✅ Jednostavnije - jedna tabela za sve tipove
- ✅ Lako dodavanje novih tipova
- ✅ Jedinstveni slug per event type
- ✅ Jednostavnije query-je
- ✅ Manje JOIN-ova

**Nedostaci:**
- ⚠️ Tabela može postati velika (ali sa dobrim indeksima nije problem)
- ⚠️ Neke kolone će biti NULL za određene tipove (ali to je OK)

### Opcija 2: Polymorphic Association
**Prednosti:**
- ✅ Normalizovano
- ✅ Specifične kolone po tipu

**Nedostaci:**
- ❌ Komplikovanije query-je
- ❌ Više JOIN-ova
- ❌ Teže održavanje

## Implementacija (Opcija 1 - Preporučeno)

### 1. Database Schema Changes

```sql
-- Step 1: Add event_type column to conferences table
ALTER TABLE conferences 
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'conference' 
CHECK (event_type IN ('conference', 'workshop', 'seminar', 'webinar', 'training', 'other'));

-- Step 2: Update slug to be unique per event_type (optional, or keep global unique)
-- Option A: Global unique slug (simpler)
-- Option B: Unique per event_type (more flexible)
CREATE UNIQUE INDEX IF NOT EXISTS idx_conferences_slug_event_type 
ON conferences(slug, event_type);

-- Step 3: Add event-specific settings in JSONB
-- settings JSONB već postoji, samo dodati event_type specific fields

-- Step 4: Rename table (optional, ali preporučeno)
-- ALTER TABLE conferences RENAME TO events;
-- ALTER TABLE conference_permissions RENAME TO event_permissions;
-- ALTER TABLE conference_permissions RENAME COLUMN conference_id TO event_id;
```

### 2. TypeScript Types

```typescript
export type EventType = 'conference' | 'workshop' | 'seminar' | 'webinar' | 'training' | 'other'

export interface Event {
  id: string
  name: string
  slug: string
  event_type: EventType  // NEW
  description?: string
  // ... rest of fields
}

// Type-specific interfaces
export interface ConferenceEvent extends Event {
  event_type: 'conference'
  settings: ConferenceSettings
}

export interface WorkshopEvent extends Event {
  event_type: 'workshop'
  settings: WorkshopSettings
}
```

### 3. Migration Strategy

**Faza 1: Dodati event_type kolonu (backward compatible)**
- Dodati `event_type` kolonu sa default 'conference'
- Postojeći podaci automatski postaju 'conference'
- Ažurirati TypeScript tipove

**Faza 2: Ažurirati aplikaciju**
- Dodati event type selector u formu
- Ažurirati filtere i pretrage
- Dodati event type specific settings

**Faza 3: (Opciono) Rename tabela**
- Rename `conferences` → `events`
- Rename `conference_permissions` → `event_permissions`
- Ažurirati sve reference u kodu

## Preporuka

**Korak 1 (Sada):** Dodati `event_type` kolonu u `conferences` tabelu
- Backward compatible
- Ne menja postojeće funkcionalnosti
- Omogućava dodavanje novih tipova

**Korak 2 (Kasnije):** Kada dodamo druge tipove događaja
- Rename tabela u `events`
- Dodati event type specific templates
- Dodati event type specific settings

## Event Type Specific Settings

Različiti tipovi događaja mogu imati različite settings u JSONB:

```typescript
// Conference settings
{
  registration_enabled: true,
  abstract_submission_enabled: true,
  payment_required: true,
  // ...
}

// Workshop settings
{
  registration_enabled: true,
  max_participants: 20,
  materials_included: true,
  // ...
}

// Webinar settings
{
  registration_enabled: true,
  recording_available: true,
  qa_enabled: true,
  // ...
}
```

## Benefits

1. **Skalabilnost** - Lako dodavanje novih tipova
2. **Fleksibilnost** - JSONB omogućava različite settings po tipu
3. **Jednostavnost** - Jedna tabela, jednostavniji query-je
4. **Backward Compatible** - Postojeći podaci rade bez problema
