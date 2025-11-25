# 📊 Analiza organizacije baze podataka - digitalnisuperheroj.com

## 🔍 Što sam otkrio analizom stranice

### 1. **Supabase kao glavna baza podataka**

Iz network zahtjeva vidim da koriste **Supabase** za pohranu podataka:

```
https://zximqkmwxouuomslhsai.supabase.co/storage/v1/object/public/profile-images/...
```

**Supabase Storage koriste za:**
- ✅ **Profile slike korisnika** (`profile-images` bucket)
- ✅ Vjerojatno i druge datoteke (video, dokumenti, itd.)

### 2. **Struktura organizacije podataka**

#### **Statické datoteke:**
- `/course/logo/` - Logo slike za tečajeve (1.png, 2.png, 3.png, itd.)
- `/img/` - Opće slike (logo.png, davor-debrecin.png, itd.)
- `/patterns/` - Pattern slike za dizajn

#### **Dinamičke datoteke (Supabase Storage):**
- `profile-images/` - Profile slike korisnika
  - Struktura: `profile-images/{user-id}/{image-id}.jpg`
  - Primjer: `profile-images/11e8fe89-9ac4-4ab9-a13c-d4274ce290bc/12f71238-04d3-49a9-9379-79b8b96b0a5e.jpg`

### 3. **Pretpostavljena struktura baze podataka**

Na temelju analize stranice, vjerojatno imaju sljedeće tablice u Supabase:

#### **Tablica: `users` ili `profiles`**
```sql
- id (UUID)
- email
- name
- profile_image_url (link na Supabase Storage)
- created_at
- updated_at
```

#### **Tablica: `courses`**
```sql
- id (UUID)
- title
- description
- logo_url (link na /course/logo/{id}.png)
- price
- instructor_id (FK na users)
- created_at
- updated_at
```

#### **Tablica: `enrollments` ili `registrations`**
```sql
- id (UUID)
- user_id (FK na users)
- course_id (FK na courses)
- payment_status
- enrolled_at
- completed_at
```

#### **Tablica: `course_content`**
```sql
- id (UUID)
- course_id (FK na courses)
- lesson_number
- title
- video_url
- content
- created_at
```

### 4. **Organizacija Storage bucket-a**

**Supabase Storage struktura:**
```
storage/
├── profile-images/          # Profile slike korisnika
│   └── {user-id}/
│       └── {image-id}.jpg
├── course-videos/          # Video materijali (pretpostavka)
├── course-files/           # PDF, dokumenti (pretpostavka)
└── abstracts/              # Ako imaju upload funkcionalnost
```

### 5. **Tehnologije koje koriste**

- ✅ **Astro** - Frontend framework (`/_astro/` fajlovi)
- ✅ **Supabase** - Backend i baza podataka
- ✅ **Supabase Storage** - Za datoteke
- ✅ **Vercel** - Hosting (vidim `/_vercel/` u network zahtjevima)
- ✅ **Google Analytics** - Tracking
- ✅ **Facebook Pixel** - Marketing tracking
- ✅ **Twitter Analytics** - Marketing tracking

## 📋 Ključne razlike u odnosu na vašu aplikaciju

### **Što oni imaju što možete dodati:**

1. **Organizirani Storage bucket-i**
   - Razdvojeni bucket-i za različite tipove datoteka
   - Struktura: `{bucket-name}/{user-id}/{file-id}.ext`

2. **Profile slike korisnika**
   - Svaki korisnik ima svoj folder u Storage-u
   - Lako upravljanje i brisanje korisničkih datoteka

3. **Statické vs dinamičke datoteke**
   - Statičke slike (logo, ikone) u `/public` folderu
   - Dinamičke datoteke (user uploads) u Supabase Storage

4. **Organizacija po entitetima**
   - Svaki entitet (user, course) ima svoj folder u Storage-u
   - Lakše backup i upravljanje

## 💡 Preporuke za vašu aplikaciju

### 1. **Organizirajte Storage bucket-e**

```typescript
// Trenutno imate:
abstracts/                    # Sve datoteke u jednom bucket-u

// Preporučeno:
abstracts/                    # Abstract datoteke
  └── {registration-id}/
      └── {file-name}.pdf

profile-images/              # Profile slike (ako dodate korisničke profile)
  └── {user-id}/
      └── {image-id}.jpg

invoices/                    # Generirani računi (ako želite spremati PDF-ove)
  └── {registration-id}/
      └── invoice-{invoice-id}.pdf
```

### 2. **Dodajte organizaciju po korisnicima**

Ako planirate dodati korisničke profile:

```sql
-- Dodajte u registrations tablicu
ALTER TABLE registrations
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Kreirajte index
CREATE INDEX IF NOT EXISTS idx_registrations_user_id 
ON registrations(user_id);
```

### 3. **Struktura Storage bucket-a**

```typescript
// Supabase Storage organizacija
const storageStructure = {
  abstracts: {
    path: 'abstracts/{registrationId}/{fileName}',
    public: false, // Samo admin može pristupiti
  },
  profileImages: {
    path: 'profile-images/{userId}/{imageId}.jpg',
    public: true, // Javno dostupno
  },
  invoices: {
    path: 'invoices/{registrationId}/invoice-{invoiceId}.pdf',
    public: false, // Samo korisnik i admin
  },
}
```

### 4. **Dodajte organizaciju po datumu**

```typescript
// Organizacija po godini/mjesecu za lakše backup
abstracts/
  └── 2025/
      └── 01/  // Siječanj
          └── {registration-id}/
              └── {file-name}.pdf
```

## 🎯 Sažetak

**digitalnisuperheroj.com koristi:**

1. ✅ **Supabase PostgreSQL** - za struktuirane podatke (users, courses, enrollments)
2. ✅ **Supabase Storage** - za datoteke (profile slike, dokumente)
3. ✅ **Organizirane bucket-e** - različiti bucket-i za različite tipove datoteka
4. ✅ **Struktura po korisnicima** - svaki korisnik ima svoj folder
5. ✅ **Statické datoteke** - logo, ikone u `/public` folderu

**Vaša aplikacija trenutno koristi:**

1. ✅ **Supabase PostgreSQL** - za registracije
2. ✅ **Supabase Storage** - za abstracts
3. ⚠️ **Mogu poboljšati** - organizaciju Storage bucket-a
4. ⚠️ **Mogu dodati** - organizaciju po korisnicima/datumima

## 📝 Sljedeći koraci

1. **Organizirajte Storage bucket-e** - Razdvojite različite tipove datoteka
2. **Dodajte strukturu po korisnicima** - Ako planirate korisničke profile
3. **Implementirajte organizaciju po datumu** - Za lakše backup i upravljanje
4. **Dodajte RLS politike za Storage** - Za sigurnost pristupa datotekama

