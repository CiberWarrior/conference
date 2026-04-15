# Abstract Submission Form Fields - Dokumentacija

## Pregled

Abstract submission forma sada sadrži sva standardna polja za znanstvene konferencije sa validacijom i vizualnim feedback-om.

## Struktura Forme

Forma je podijeljena u **3 glavne sekcije**:

### 1. Abstract Details (Plavi okvir)
Osnovna informacije o abstractu

### 2. Authors (Ljubičasti okvir)  
Podaci o autorima

### 3. Custom Fields (Ako su konfigurisana)
Dodatna polja specifična za konferenciju

---

## 1. Abstract Details Sekcija

### Polja:

#### **Abstract Type*** (Radio buttons)
- Obavezno polje
- 3 opcije sa vizualnim stilizovanjem:
  - 📊 **Poster** (zeleni badge u admin panelu)
  - 🎤 **Oral** (plavi badge)
  - ⭐ **Invited Speaker** (ljubičasti badge)

**UI**:
- Veliki radio buttons u grid layout (3 kolone na desktopu, 1 na mobilnom)
- Selected opcija ima plavu border i background
- Hover effect sa transition

---

#### **Title*** (Text input)
- Obavezno polje
- Naslov abstract-a
- Placeholder: "Enter your abstract title"
- Full width input sa fokus animacijom

---

#### **Content*** (Textarea)
- Obavezno polje
- Glavni sadržaj abstract-a
- **Validacija**: 1000-2000 karaktera (sa spacevima)
- 12 redova visine, resize enabled

**Karakteristike**:
- **Live character counter** sa bojom:
  - 🟡 Amber (< 1000): "Need X more"
  - 🟢 Green (1000-2000): "Perfect length"
  - 🔴 Red (> 2000): "X over limit"

**Upozorenja**:
```
⚠️ Please note: Do NOT include references in the abstract text. 
   Tables and graphics are not allowed.
```

**Primjer prikaza**:
```
1543 / 2000 characters
Perfect length ✓
```

---

#### **Keywords*** (Text input)
- Obavezno polje
- Minimum **5 ključnih riječi** odvojenih zarezom
- Live counter koliko keywords je uneseno

**Upute**:
```
Please enter 5 keywords relevant for your abstract using 
the name or acronym that is the best known. Separate them by comma.
```

**Primjer**:
```
machine learning, neural networks, deep learning, AI, classification
```

**Live feedback**:
- Prikazuje broj unesenih keywords
- Zeleno ✓ kada je >= 5
- Amber kada je < 5

---

## 2. Authors Sekcija

### Karakteristike:
- **Neograničen broj autora**
- Collapsible kartice
- Drag & drop reordering (strelice gore/dolje)

### Polja po autoru:

| Polje | Obavezno | Opis |
|-------|----------|------|
| **Ime** | ✅ | First name |
| **Prezime** | ✅ | Last name |
| **Email** | ✅ | Email adresa |
| **Institucija** | ✅ | Organization/University |
| **Država** | ❌ | Country |
| **Grad** | ❌ | City |
| **Glavni autor** | - | Checkbox (samo jedan može biti označen) |

**Napomena**: ORCID polje je **uklonjeno** jer nije standardno na većini konferencija.

---

## 3. Validacija

### Validacija na Submit:

#### Abstract Details:
1. ✅ Title popunjen
2. ✅ Content popunjen
3. ✅ Content između 1000-2000 karaktera
4. ✅ Minimum 5 keywords

#### Authors:
1. ✅ Najmanje 1 autor
2. ✅ Svaki autor ima: ime, prezime, email, afilaciju
3. ✅ Najmanje 1 glavni autor označen

#### Custom Fields:
- Validacija svih required custom polja

### Error Messages:

```javascript
// Examples:
"Abstract title is required"
"Abstract content is too short. Current: 743 characters. Minimum: 1000 characters."
"Abstract content is too long. Current: 2156 characters. Maximum: 2000 characters."
"Please enter at least 5 keywords. Current: 3"
"Author 2: Email is required"
```

---

## 4. Spremanje Podataka

### Database Schema:

Svi abstract details se spremaju u `abstracts.custom_data` JSONB kolonu:

```json
{
  "abstractTitle": "Machine Learning in Healthcare",
  "abstractContent": "This study explores...",
  "abstractKeywords": "ML, healthcare, diagnosis, AI, prediction",
  "abstractType": "oral"
}
```

### Authors:

Spremaju se u `abstracts.authors` JSONB array:

```json
[
  {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "affiliation": "MIT",
    "country": "USA",
    "city": "Boston",
    "isCorresponding": true,
    "order": 1
  }
]
```

---

## 5. Admin Panel Prikaz

### Abstracts Tablica

**Nova kolona "File Name" prikazuje**:

```
🎓 Machine Learning in Healthcare
📎 abstract_ml_healthcare.pdf
🎤 Oral
🔑 ML, healthcare, diagnosis, AI, prediction
```

**Badge boje po tipu**:
- 📊 Poster → Zeleni badge
- 🎤 Oral → Plavi badge  
- ⭐ Invited Speaker → Ljubičasti badge

---

## 6. Email Notifikacije

### Conference Team Email sadrži:

```
Conference: XYZ 2024
Abstract ID: abc-123-def
Title: Machine Learning in Healthcare
Type: ORAL
Keywords: ML, healthcare, diagnosis, AI, prediction

File Name: abstract.pdf
File Size: 2.4 MB

Authors:
1. John Doe (Corresponding)
   Email: john@example.com
   Affiliation: MIT
   Location: USA, Boston

2. Jane Smith
   ...
```

---

## 7. UI/UX Poboljšanja

### Vizualni Indikatori:

1. **Abstract Type Radio Buttons**
   - Grid layout sa hover effects
   - Selected state sa plavom border
   - Icons za svaki tip

2. **Character Counter**
   - Real-time update
   - Color coding (amber/green/red)
   - Helpful messages

3. **Keywords Counter**
   - Shows count dynamically
   - Visual feedback sa bojom

4. **Section Separators**
   - Plavi okvir za Abstract Details (🔵)
   - Ljubičasti okvir za Authors (🟣)
   - Clear visual hierarchy

---

## 8. Responsive Design

### Desktop (md+):
- Radio buttons: 3 columns
- Form fields: optimal spacing
- Full-width textareas

### Mobile:
- Radio buttons: 1 column (stacked)
- Touch-friendly buttons
- Optimized font sizes

---

## 9. Uklonjena Dupla Polja

### Problem Riješen:

Custom polja koja se odnose na autore (Institutions, City, Country, Email, itd.) 
**više se ne prikazuju ispod** jer su već pokrivena u Authors sekciji.

**Filter automatski sakriva**:
- first_name, firstName, ime
- last_name, lastName, prezime, surname
- email, e-mail
- institution, institutions, institucija, affiliation
- country, država, drzava
- city, grad
- author, authors, autor, autori

---

## 10. Statistike (Podaci koje spremamo)

Za svaki abstract imamo:

```typescript
{
  // Basic info
  id: UUID
  conference_id: UUID
  registration_id: UUID | null  // Linked to user registration
  email: string
  
  // File
  file_name: string
  file_path: string
  file_size: number
  
  // Abstract details (custom_data)
  custom_data: {
    abstractTitle: string
    abstractContent: string      // 1000-2000 chars
    abstractKeywords: string     // min 5 keywords
    abstractType: 'poster' | 'oral' | 'invited'
    // ... other custom fields
  }
  
  // Authors (authors array)
  authors: [
    {
      firstName, lastName, email, affiliation,
      country, city, isCorresponding, order
    }
  ]
  
  uploaded_at: timestamp
}
```

---

## 11. Best Practices za Admins

### Kreiranje Custom Polja:

❌ **NE kreirajte**:
- "Author Name" - već postoji u Authors sekciji
- "Email" - već postoji
- "Institution" - već postoji
- "City", "Country" - već postoje

✅ **Kreirajte samo**:
- Topic area / Research field
- Previous participation
- Special requirements
- Funding information
- Ethics approval
- Presentation preferences (npr. preferirani datum)

---

## 12. Testiranje

### Test Scenario 1: Osnovno Submitovanje
```
1. Odaberi Abstract Type: Oral
2. Unesi Title: "Test Abstract"
3. Unesi Content: (tačno 1500 karaktera)
4. Unesi Keywords: "test, abstract, keywords, science, research"
5. Dodaj 2 autora sa svim podacima
6. Submit
→ Trebalo bi uspjeti ✓
```

### Test Scenario 2: Validacija - Content prekratak
```
1. Popuni sve
2. Content: samo 500 karaktera
3. Submit
→ Error: "Abstract content is too short. Current: 500..."
```

### Test Scenario 3: Validacija - Keywords premalo
```
1. Popuni sve
2. Keywords: "test, abstract, science" (samo 3)
3. Submit  
→ Error: "Please enter at least 5 keywords. Current: 3"
```

### Test Scenario 4: Admin Panel
```
1. Submitaj abstract
2. Idi u /admin/abstracts
3. Provjeri da vidiš:
   - Title (bold)
   - Type badge (colored)
   - Keywords sa 🔑 icon
   - Autore sa afilacijama
   - Registration status badge
```

---

## 13. Troubleshooting

### Problem: Character counter ne radi
**Rješenje**: Provjeriti da state `abstractContent` pravilno updateuje

### Problem: Keywords counter prikazuje pogrešan broj
**Rješenje**: Split po zarezi i filter praznih stringova

### Problem: Validacija prolazi iako je content prekratak
**Rješenje**: Provjeriti `abstractContent.length` ne `abstractContent.trim().length`

### Problem: Admin panel ne prikazuje title
**Rješenje**: Provjeriti da je `custom_data.abstractTitle` spremljen u bazu

---

## Zaključak

Abstract submission forma sada sadrži:

✅ **Sve standardne znanstvene polje**
✅ **Real-time validaciju**
✅ **Vizualni feedback**
✅ **Responsive design**
✅ **Admin panel integraciju**
✅ **Email notifikacije**
✅ **Nema duplikata**
✅ **Intuitivno korisničko iskustvo**

Spremno za upotrebu na bilo kojoj znanstvenoj konferenciji! 🎓🚀
