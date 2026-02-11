# Povezivanje Abstrakata sa Registracijama - Dokumentacija

## ⚠️ VAŽNO: Bez Login-a za Korisnike!

**Ovaj sistem radi POTPUNO BEZ login-a za učesnike konferencije!**

- ✅ Korisnici se registriraju samo sa emailom (bez password-a)
- ✅ Korisnici submituju abstracts sa emailom (bez login-a)
- ✅ Sve je automatski povezano preko email matching-a
- ❌ **NE koristimo** `user_id` ili authentication za učesnike
- ❌ **NE zahtjevamo** login za submit abstract
- ✅ **SAMO admini** imaju login za pristup admin panelu

**Email = Jedini identifikator za učesnike**

---

## Pregled

Sistem automatski povezuje submitted abstracts sa registracijama korisnika **preko email adrese glavnog autora (corresponding author)**. Kada korisnik submituje abstract, sistem provjerava da li već postoji registracija sa tim emailom za istu konferenciju.

## Kako Funkcioniše

### 1. Automatska Detekcija Registracije

Kada korisnik unese email glavnog autora (corresponding author), sistem:

1. **Provjerava email** u bazi podataka
2. **Traži postojeću registraciju** za istu konferenciju
3. **Automatski povezuje** abstract sa registracijom ako postoji
4. **Prikazuje status** korisniku

### 2. Vizualni Indikatori

**Dok provjerava**:
```
🔄 Provjera registracije...
```

**Kada je pronađena registracija**:
```
✅ Povezano sa registracijom
   Ovaj abstract će biti automatski povezan sa vašom prijavom za konferenciju.
```

**Kada registracija nije pronađena**:
```
⚠️  Registracija nije pronađena
   Niste registrovani za konferenciju sa ovim emailom.
   Možete nastaviti sa submitom abstrackta, ali preporučujemo da se registrujete ovdje.
```

## Tehnička Implementacija

### 1. Frontend - Submit Abstract Form

**Lokacija**: `/app/conferences/[slug]/submit-abstract/page.tsx`

**Novi state**:
```typescript
const [registrationId, setRegistrationId] = useState<string | null>(null)
const [checkingRegistration, setCheckingRegistration] = useState(false)
```

**Funkcija za provjeru**:
```typescript
const checkUserRegistration = async (email: string) => {
  const response = await fetch(
    `/api/conferences/${conference.id}/check-registration?email=${email}`
  )
  const data = await response.json()
  if (data.registrationId) {
    setRegistrationId(data.registrationId)
    showSuccess('Pronađena registracija!')
  }
}
```

**Automatski trigger**:
- Pokreće se kada se promijeni email glavnog autora
- Debounce od 1 sekunde da se ne šalje previše zahtjeva
- Radi samo ako je email validan (sadrži @)

### 2. API Endpoint - Check Registration

**Lokacija**: `/app/api/conferences/[conferenceId]/check-registration/route.ts`

**GET** `/api/conferences/[conferenceId]/check-registration?email=user@example.com`

**Response kada je pronađena**:
```json
{
  "found": true,
  "registrationId": "uuid-here",
  "firstName": "John",
  "lastName": "Doe",
  "status": "confirmed"
}
```

**Response kada nije pronađena**:
```json
{
  "found": false,
  "registrationId": null
}
```

### 3. Submit Abstract API Update

**Lokacija**: `/app/api/conferences/[slug]/submit-abstract/route.ts`

Kada se submita abstract, `registrationId` se uključuje u request:

```typescript
formData.append('registrationId', registrationId)
```

U bazi podataka:
```sql
INSERT INTO abstracts (
  ...,
  registration_id
) VALUES (
  ...,
  $registrationId
)
```

### 4. Admin Panel Display

**Lokacija**: `/app/admin/abstracts/page.tsx`

**Nova kolona u email sekciji**:
- Prikazuje email
- Ako je povezano sa registracijom, prikazuje zeleni badge: ✅ "Povezano sa registracijom"

## Filtriranje Duplikata Custom Polja

### Problem

Kada admin kreira custom polja za abstract submission koja se odnose na autore (npr. "Institutions", "City", "Country", "Authors"), ta polja se prikazuju dvaput:
1. U AuthorManager komponenti (pravilno)
2. Kao custom polja ispod (nepotrebno)

### Rješenje

Implementiran je filter koji automatski sakriva author-related custom polja:

```typescript
.filter((field) => {
  const authorFieldNames = [
    'first_name', 'firstName', 'first name', 'ime',
    'last_name', 'lastName', 'last name', 'prezime', 'surname',
    'email', 'e-mail',
    'institution', 'institutions', 'institucija', 'affiliation',
    'country', 'država', 'drzava',
    'city', 'grad',
    'orcid',
    'author', 'authors', 'autor', 'autori'
  ]
  
  const fieldNameLower = field.name?.toLowerCase() || ''
  const fieldLabelLower = field.label?.toLowerCase() || ''
  
  const isAuthorField = authorFieldNames.some(
    authorField => 
      fieldNameLower.includes(authorField.toLowerCase()) ||
      fieldLabelLower.includes(authorField.toLowerCase())
  )
  
  return !isAuthorField
})
```

**Kako radi**:
- Provjerava naziv i labelu svakog custom polja
- Ako sadrži bilo koju riječ koja se odnosi na autore, sakriva ga
- Podržava i engleski i hrvatski jezik

## Korištenje

### Za Korisnike

1. **Otvorite submit abstract stranicu**
   ```
   /conferences/[slug]/submit-abstract
   ```

2. **Unesite podatke prvog autora** (glavnog)
   - Sistem će automatski provjeriti email
   - Ako imate registraciju, vidjećete zelenu poruku

3. **Nastavite sa submitom**
   - Abstract će biti automatski povezan sa vašom registracijom
   - Možete vidjeti sve svoje abstracts u profilu

### Za Admins

1. **Pregledajte abstracts u admin panelu**
   ```
   /admin/abstracts
   ```

2. **Filtrirajte po konferenciji**
   - Vidjećete koje abstracts su povezane sa registracijama
   - Zeleni badge pokazuje povezanost

3. **Kreirajte custom polja pažljivo**
   - Izbjegavajte kreiranje author-related polja
   - Koristite AuthorManager za autor podatke
   - Custom polja koristite samo za dodatne, ne-author informacije

## Database Schema

### abstracts table

```sql
CREATE TABLE abstracts (
  id UUID PRIMARY KEY,
  conference_id UUID REFERENCES conferences(id),
  registration_id UUID REFERENCES registrations(id), -- ← Povezuje sa registracijom
  authors JSONB DEFAULT '[]'::jsonb,
  custom_data JSONB DEFAULT '{}'::jsonb,
  email TEXT,
  file_name TEXT,
  file_path TEXT,
  file_size BIGINT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index za brže querije
CREATE INDEX idx_abstracts_registration ON abstracts(registration_id);
CREATE INDEX idx_abstracts_email ON abstracts(email);
```

## Benefits

### 1. Za Korisnike

✅ **Jednostavnije praćenje** - Svi njihovi abstracts povezani sa registracijom preko emaila  
✅ **Automatska povezanost** - Ne moraju ručno unositi podatke  
✅ **Brža prijava** - Ako su već registrovani, vide automatsku povezanost  
✅ **Bez login-a** - Sve radi preko emaila, bez potrebe za password-om

### 2. Za Organizatore

✅ **Bolji insights** - Znaju ko je registrovan a šta je submitao  
✅ **Lakše organizovanje** - Mogu filtrirati abstracts po registracijama  
✅ **Email komunikacija** - Jednostavnije slanje notification emailova  
✅ **Statistika** - Bolje metrike o učešću

### 3. Za Sistem

✅ **Data integrity** - Manje duplikata i nekonzistentnosti  
✅ **Bolje queries** - Index na registration_id omogućava brže pretrage  
✅ **Relational data** - Jasna veza između abstracts i registracija

## Workflow Dijagram

```
User Submits Abstract
        ↓
Unosi Email Glavnog Autora
        ↓
    [Email Validation]
        ↓
API Check: /check-registration?email=...
        ↓
    [Database Query]
        ↓
    ┌─────────────┐
    │  Pronađeno? │
    └─────┬───────┘
          │
    ┌─────┴─────┐
    ↓           ↓
  DA           NE
    │           │
    │           ↓
    │   Show Warning
    │   (Preporučuje registraciju)
    │           │
    ↓           ↓
Set registrationId = UUID
    │           │
    └─────┬─────┘
          ↓
    Submit Abstract
          ↓
  Save to Database
  (sa registration_id)
          ↓
    Success! ✅
```

## Edge Cases

### 1. Korisnik ima više registracija

**Problem**: Isti email, više registracija za istu konferenciju

**Rješenje**: Uzima se najnovija (ORDER BY created_at DESC)

### 2. Email se promijeni nakon detektovanja

**Problem**: Korisnik prvo unese jedan email, pa ga promijeni

**Rješenje**: useEffect prati izmjene i ponovno provjerava

### 3. Registracija kreirana nakon što je abstract submitovan

**Problem**: Abstract submitovan prije registracije

**Rješenje**: Admin može ručno povezati u admin panelu (budući feature)

### 4. Custom polja sa sličnim imenima

**Problem**: Polje se zove "Author Biography" - da li filtrirati?

**Rješenje**: Filter provjerava da li SADRŽI ključnu riječ, ne exact match

## Troubleshooting

### Problem: Registracija nije detektovana iako postoji

**Mogući uzroci**:
1. Email se razlikuje (case sensitive)
2. Registracija za drugu konferenciju
3. API timeout

**Debug**:
```javascript
// U browser console
fetch('/api/conferences/CONFERENCE_ID/check-registration?email=test@example.com')
  .then(r => r.json())
  .then(console.log)
```

### Problem: Custom polja se još uvijek prikazuju

**Mogući uzroci**:
1. Naziv polja ne sadrži ključne riječi
2. Filter lista ne pokriva taj termin

**Rješenje**: Dodati novi termin u `authorFieldNames` array

### Problem: Badge se ne prikazuje u admin panelu

**Mogući uzroci**:
1. `registration_id` nije spremljen u bazu
2. Abstract submitovan prije implementacije

**Provjera**:
```sql
SELECT id, email, registration_id 
FROM abstracts 
WHERE conference_id = 'UUID';
```

## Future Enhancements

Moguća poboljšanja:

1. **Manual Linking** - Admin može ručno povezati abstract sa registracijom
2. **Bulk Link** - Povezivanje više abstracts odjednom
3. **Unlink Option** - Mogućnost otpojivanja ako je pogrešno povezano
4. **Registration Badge in Email** - Prikazati status u notifikacijama
5. **Email-Based Dashboard** - Korisnik unese email i vidi sve svoje abstracts (bez login-a)
6. **Multiple Emails** - Podrška za više emailova po registraciji
7. **Co-author Registration** - Provjeriti da li su i co-autori registrovani

## Zaključak

Sistem povezivanja abstrakata sa registracijama:

✅ **Implementiran i funkcionalan**  
✅ **Automatska detekcija**  
✅ **Vizualni feedback**  
✅ **Filtriranje duplikata**  
✅ **Admin panel integracija**  
✅ **Database optimizacija**

Sve je spremno za upotrebu! 🚀
