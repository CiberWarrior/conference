# 📁 Organizacija Storage Bucket-a

## ✅ Implementirano

Organizacija Storage bucket-a je implementirana prema best practices sličnim [digitalnisuperheroj.com](https://digitalnisuperheroj.com).

### Struktura Storage Path-a

#### **Abstracts (Organizirano po Registration ID-u)**

```
abstracts/
├── {registration-id}/           # Ako je povezan s registracijom
│   └── {timestamp}_{filename}.docx
├── by-email/                    # Ako nema registration ID ali ima email
│   └── {email-hash}/
│       └── {timestamp}_{filename}.docx
└── {year}/{month}/              # Fallback ako nema ni registration ID ni email
    └── {timestamp}_{filename}.docx
```

**Primjeri:**
- `abstracts/11e8fe89-9ac4-4ab9-a13c-d4274ce290bc/1735123456789_my_abstract.docx`
- `abstracts/by-email/a1b2c3d4/1735123456789_my_abstract.docx`
- `abstracts/2025/01/1735123456789_my_abstract.docx`

### Helper Funkcije

Kreirane su helper funkcije u `lib/storage.ts`:

- `getAbstractFilePath()` - Generira organizirani path za abstracts
- `getInvoiceFilePath()` - Generira path za invoice PDF-ove (spremno za buduću upotrebu)
- `getProfileImagePath()` - Generira path za profile slike (spremno za buduću upotrebu)
- `extractRegistrationIdFromPath()` - Ekstraktira registration ID iz path-a
- `getAbstractPathsForRegistration()` - Vraća path prefix za sve abstracts jedne registracije

## 📋 Migracije

### Migracija 006: Organizacija Storage strukture

```sql
-- Dodaje registration_id u abstracts tablicu
ALTER TABLE abstracts
ADD COLUMN IF NOT EXISTS registration_id UUID REFERENCES registrations(id) ON DELETE SET NULL;

-- Kreira indekse za brže pretraživanje
CREATE INDEX IF NOT EXISTS idx_abstracts_registration_id ON abstracts(registration_id);
CREATE INDEX IF NOT EXISTS idx_abstracts_email_lookup ON abstracts(email) WHERE email IS NOT NULL;
```

**Kako pokrenuti:**
1. Otvorite Supabase SQL Editor
2. Kopirajte sadržaj `supabase/migrations/006_organize_storage_structure.sql`
3. Pokrenite migraciju

## 🔄 Kako funkcionira

### Upload Abstract-a

1. **S Registration ID-om:**
   ```typescript
   // Ako je abstract uploadan nakon registracije
   formData.append('registrationId', registrationId)
   // Path: abstracts/{registrationId}/{timestamp}_{filename}.docx
   ```

2. **Samo s Email-om:**
   ```typescript
   // Ako je abstract uploadan bez registracije
   formData.append('email', email)
   // Path: abstracts/by-email/{emailHash}/{timestamp}_{filename}.docx
   ```

3. **Bez identifikatora:**
   ```typescript
   // Fallback - organizacija po datumu
   // Path: abstracts/{year}/{month}/{timestamp}_{filename}.docx
   ```

### Validacija

- Ako je `registrationId` poslan, provjerava se da registracija postoji
- Ako su i `email` i `registrationId` poslani, provjerava se da se email podudara
- Email hash se koristi za organizaciju ako nema `registrationId`

## 📊 Prednosti nove organizacije

1. **Lakše upravljanje** - Svi abstracts jedne registracije su u jednom folderu
2. **Lakše brisanje** - Možete obrisati sve abstracts registracije odjednom
3. **Lakše backup** - Organizacija po entitetima olakšava backup strategiju
4. **Bolja performansa** - Indeksi na `registration_id` ubrzavaju pretraživanje
5. **Skalabilnost** - Struktura je pripremljena za dodatne bucket-e (invoices, profile-images)

## 🚀 Sljedeći koraci (opcionalno)

### 1. Dodati Invoice Storage Bucket

```typescript
// Kada se generira invoice, spremiti PDF u Storage
const invoicePath = getInvoiceFilePath(registrationId, invoiceId)
// Path: invoices/{registrationId}/invoice-{invoiceId}.pdf
```

### 2. Dodati Profile Images Bucket

```typescript
// Ako dodate korisničke profile
const profilePath = getProfileImagePath(userId, imageId)
// Path: profile-images/{userId}/{imageId}.jpg
```

### 3. Migracija postojećih datoteka

Ako imate postojeće abstracts u staroj strukturi (`abstracts/{filename}`), možete kreirati migracijsku skriptu:

```sql
-- Primjer: Link postojeće abstracts s registracijama po email-u
UPDATE abstracts a
SET registration_id = r.id
FROM registrations r
WHERE a.email = r.email
AND a.registration_id IS NULL;
```

## 📝 Napomene

- **Backward compatibility**: Stara struktura (`abstracts/{filename}`) i dalje radi za download
- **Nova struktura**: Svi novi uploadi koriste organiziranu strukturu
- **RLS politike**: Postojeće RLS politike za Storage i dalje vrijede
- **Download**: Download funkcionalnost radi s bilo kojom strukturom path-a

## 🔍 Provjera

Nakon implementacije, provjerite:

1. ✅ Upload abstract-a s `registrationId` - provjerite da je path `abstracts/{registrationId}/...`
2. ✅ Upload abstract-a samo s `email` - provjerite da je path `abstracts/by-email/{hash}/...`
3. ✅ Upload abstract-a bez identifikatora - provjerite da je path `abstracts/{year}/{month}/...`
4. ✅ Download funkcionalnost radi s novim path-ovima
5. ✅ Admin panel prikazuje `registrationId` u abstracts listi

