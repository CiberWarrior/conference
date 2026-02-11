# Abstract Authors and Custom Fields - Dokumentacija

## Pregled

Sistem za prijavu sažetaka (abstracts) sada podržava:

1. **Ručno dodavanje više autora** - puno strukturiranih podataka o autorima
2. **Custom polja za abstrakte** - admini mogu kreirati prilagođene obrasce ovisno o konferenciji

## 1. Dodavanje Autora

### Frontend (Submit Abstract Form)

Korisnici sada mogu dodavati više autora sa sljedećim poljima:

- **Osnovna polja** (obavezna):
  - Ime
  - Prezime
  - Email
  - Institucija / Organizacija

- **Dodatna polja** (opciona):
  - Država
  - Grad
  - ORCID iD

- **Posebne oznake**:
  - Glavni autor (autor za korespondenciju) - označen sa ★
  - Redoslijed autora (može se mijenjati strelicama gore/dolje)

### Komponenta: AuthorManager

Lokacija: `/components/admin/AuthorManager.tsx`

**Značajke**:
- Collapsible kartice za svakog autora
- Drag & drop za promjenu redoslijeda
- Validacija obaveznih polja
- Označavanje glavnog autora
- Podrška za do 20 autora po abstrakt submission

**Korištenje**:
```tsx
<AuthorManager
  authors={authors}
  onChange={setAuthors}
  maxAuthors={20}
  customFields={[]}
  showCustomFields={false}
/>
```

### Struktura Podataka

**Author interface** (`/types/author.ts`):
```typescript
interface Author {
  firstName?: string
  lastName?: string
  email?: string
  affiliation?: string
  country?: string
  city?: string
  orcid?: string
  isCorresponding?: boolean
  order?: number
  customFields?: Record<string, any>
}
```

**Spremanje u bazu**:
- Autori se spremaju kao JSONB array u `abstracts.authors` kolonu
- Svaki abstract može imati neograničen broj autora
- Data je strukturirana i lako pretraživa

## 2. Custom Polja za Abstrakte

### Admin Interface

**Lokacija**: `/admin/conferences/[id]/settings` → sekcija "Prilagođena polja za prijavu sažetaka"

Admini mogu kreirati custom polja s opcijama:

1. **Vrsta polja**:
   - Tekst (kratki odgovor)
   - Textarea (dugački odgovor)
   - Longtext (paste long text - do 5000 znakova)
   - Email
   - Telefon
   - Broj
   - Datum
   - Dropdown (select)
   - Radio buttons
   - Checkbox
   - File upload
   - Separator (section break)

2. **Konfiguracija**:
   - Naziv polja (interni - za backend)
   - Oznaka polja (prikaz - što vide korisnici)
   - Placeholder tekst
   - Opis / Pomoćni tekst
   - Obavezno polje (checkbox)

3. **Posebne opcije**:
   - **Select/Radio**: Lista opcija (jedna po liniji) + "Load All Countries" button
   - **File upload**: Dozvoljeni tipovi datoteka, max veličina (MB)
   - **Longtext**: Min/max broj znakova

### Komponenta: CollapsibleFieldEditor

Lokacija: `/components/admin/CollapsibleFieldEditor.tsx`

**Značajke**:
- Drag & drop za promjenu redoslijeda polja
- Collapsible preview s oznakom vrste polja
- Inline editing svih opcija
- Automatska validacija

### Rendering na Submit Abstract Form

Custom polja se automatski renderaju na submit-abstract formi iza sekcije za autore.

**Podržane tipove polja**:
- Svi gore navedeni tipovi
- Validacija obaveznih polja
- File uploads se uploadaju zajedno s abstract dokumentom
- Podaci se spremaju u `abstracts.custom_data` JSONB kolonu

## 3. Database Schema

### Migracija: `053_add_authors_to_abstracts.sql`

```sql
-- Add authors JSONB column
ALTER TABLE abstracts
ADD COLUMN IF NOT EXISTS authors JSONB DEFAULT '[]'::jsonb;

-- Create GIN index
CREATE INDEX IF NOT EXISTS idx_abstracts_authors 
ON abstracts USING GIN (authors);
```

### Primjer podataka:

```json
{
  "authors": [
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "affiliation": "University XYZ",
      "country": "USA",
      "city": "New York",
      "orcid": "0000-0001-2345-6789",
      "isCorresponding": true,
      "order": 1
    },
    {
      "firstName": "Jane",
      "lastName": "Smith",
      "email": "jane@example.com",
      "affiliation": "Institute ABC",
      "country": "UK",
      "city": "London",
      "isCorresponding": false,
      "order": 2
    }
  ]
}
```

## 4. API Changes

### POST `/api/conferences/[slug]/submit-abstract`

**Nove parametre**:
- `authors` (JSON string) - array autora

**Response**:
- Uključuje autor informacije u email notifikacijama
- Sprema autore u `abstracts.authors` kolonu

**Validacija**:
- Minimalno 1 autor obavezan
- Svaki autor mora imati: ime, prezime, email, afilacija
- Najmanje 1 autor mora biti označen kao "corresponding"

## 5. Admin Abstracts Page

**Lokacija**: `/app/admin/abstracts/page.tsx`

**Nove kolone u tablici**:
- **Autori** kolona prikazuje:
  - Prva 2 autora (ime, prezime, afilacija)
  - Glavni autor označen sa ★
  - "+X više" ako ima više od 2 autora

**Primjer**:
```
★ John Doe
  University XYZ
  
  Jane Smith
  Institute ABC
  
  +3 više
```

## 6. Email Notifications

Konferencijski team email sada uključuje informacije o autorima:

**HTML format**:
- Autor lista s imenima, emailovima, afilacijama
- Highlighting glavnog autora (Corresponding)
- Prikaz države i grada

**Plain text format**:
- Formatirana lista autora
- Numbered (1., 2., 3., ...)
- Sve relevantne informacije

## 7. Workflow za Admins

### Kreiranje Custom Obrasca za Abstrakte:

1. Idi na `/admin/conferences/[id]/settings`
2. Scroll do sekcije "Prilagođena polja za prijavu sažetaka"
3. Klikni "Dodaj polje" ili "Dodaj separator"
4. Konfiguriraj polje:
   - Unesi naziv (interni) - koristi se u bazi
   - Unesi oznaku (prikaz) - vidi korisnik
   - Odaberi vrstu polja
   - Dodaj placeholder i opis
   - Označi ako je obavezno
5. Koristi drag & drop za promjenu redoslijeda
6. Klikni "Spremi" da pohrane promjene

### Pregled Submitted Abstracts s Autorima:

1. Idi na `/admin/abstracts`
2. Filtriraj po konferenciji
3. Tablica prikazuje autore u posebnoj koloni
4. Klikni na abstract za download
5. Pregled email notifikacija s detaljima autora

## 8. Korisničko Iskustvo (UX)

### Za Podnositelje Abstracts:

1. Otvore stranicu za submit abstract
2. Vide sekciju "Autori" s jednim autorom već dodanim
3. Mogu dodavati više autora klikom na "Dodaj autora"
4. Ispunjavaju podatke za svakog autora
5. Označavaju glavnog autora
6. Mijenjaju redoslijed strelicama
7. Ispunjavaju custom polja (ako su konfigurirana)
8. Submitaju abstract

### Validacija:
- Real-time validacija obaveznih polja
- Error messages za svako polje
- Ne može submitati dok nisu sva obavezna polja popunjena

## 9. Budući Dodaci (Moguća proširenja)

Moguća proširenja sistema:

1. **Author Custom Fields**: Admini mogu dodati custom polja specifično za autore
2. **Author Search**: Pretraga abstracts po imenu autora
3. **Author Profiles**: Link autora na njihove profile (ako su registrirani)
4. **Co-author Invitations**: Automatsko slanje emaila co-autorima
5. **Author Affiliations Database**: Predloženi afilije based on history
6. **ORCID Integration**: Auto-fill autor podataka iz ORCID API
7. **Export Authors**: CSV export autora za sve abstrakte

## 10. Troubleshooting

### Problem: Autori se ne prikazuju u admin tablici
**Rješenje**: Pokrenite migraciju `053_add_authors_to_abstracts.sql`

### Problem: Validacija ne prolazi za autore
**Rješenje**: Provjerite da svi autori imaju ime, prezime, email i afilaciju

### Problem: Custom polja se ne prikazuju na submit form
**Rješenje**: Provjerite da su custom polja spremljena u conference settings

### Problem: Email notifikacije ne prikazuju autore
**Rješenje**: Provjerite da API route pravilno parsira `authors` JSON

## Zaključak

Sistem sada omogućava potpunu kontrolu nad abstract submission procesom:

✅ **Strukturirani podaci o autorima**
✅ **Fleksibilna custom polja**
✅ **Intuitivno korisničko sučelje**
✅ **Moćni admin alati**
✅ **Detaljne email notifikacije**

Sve je spremno za upotrebu! 🚀
