# Symposium / Track Configuration - Senior Developer Solution

## Pregled

**Fleksibilan i skalabilan sistem** za organizovanje abstrakata u simpozije, sekcije, track-ove ili sesije. Admin može potpuno konfigurisati kako želi organizovati svoju konferenciju.

---

## 🎯 Key Features

### 1. **Potpuno Konfigurabilan**
- ✅ Enable/Disable per konferenciju
- ✅ Custom nazivi (Symposium, Section, Track, Theme, itd.)
- ✅ Dinamička lista opcija
- ✅ Obavezno ili opciono
- ✅ Single ili multiple izbor

### 2. **Dva Nivoa Organizacije**
- **Primary**: Symposium/Section (glavni nivo)
- **Secondary**: Track/Session (dodatni nivo)
- Možete koristiti jedan ili oba nivoa

### 3. **Real-time Validacija**
- Validira obavezna polja
- Sprječava submit bez izbora ako je required

### 4. **Admin Panel Integracija**
- Badge display u abstracts tablici
- Email notifikacije
- Export podataka

---

## 📋 Konfiguracija (Admin Settings)

### Lokacija
`/admin/conferences/[id]/settings` → **Simpoziji / Sekcije** sekcija

### Primary Level (Symposium/Section)

#### **Enable Checkbox**
```
☑ Enable Simpozije/Sekcije
   Autori će moći odabrati simpozij ili sekciju prilikom submita abstracta
```

#### **Naziv Polja**
```
Input: "Symposium"
```
- Korisnici vide: "Symposium"
- Možete promijeniti u: "Section", "Track", "Theme", itd.

#### **Opcije**

**Obavezno polje**
```
☑ Obavezno polje
```
- Ako checked: Korisnici MORAJU odabrati
- Ako unchecked: Korisnici mogu preskočiti

**Dozvoli više izbora**
```
☑ Dozvoli više izbora
```
- Ako checked: Checkboxes (može označiti više simpozija)
- Ako unchecked: Dropdown (može odabrati samo jedan)

#### **Lista Simpozija/Sekcija**
```
Textarea (jedan po liniji):
Symposium 1: Molecular Biology
Symposium 2: Genetics
Symposium 3: Biochemistry
Section A: Clinical Studies
Section B: Laboratory Research
```

---

### Secondary Level (Track/Session)

#### **Enable Checkbox**
```
☑ Enable Dodatne Sekcije/Sesije
   Dodajte drugi nivo organizacije (npr. Session unutar Symposium-a)
```

#### **Naziv Polja**
```
Input: "Session"
```

#### **Opcije**

**Obavezno polje**
```
☑ Obavezno polje
```

#### **Lista Sesija/Tema**
```
Textarea (jedan po liniji):
Session 1: Morning Session
Session 2: Afternoon Session
Topic A: Basic Research
Topic B: Applied Research
```

---

## 🎨 Preview (u Admin Settings)

```
┌────────────────────────────────┐
│ 📋 Preview:                    │
│                                │
│ Symposium *                    │
│ [Odaberite symposium... ▼]    │
│                                │
│ Session *                      │
│ [Odaberite session... ▼]      │
└────────────────────────────────┘
```

---

## 💻 Frontend Prikaz (Submit Abstract Form)

### Single Select (Dropdown)

```tsx
┌─────────────────────────────────┐
│ Symposium *                     │
│ [Odaberite symposium...    ▼] │
│   • Symposium 1: Molecular Bio  │
│   • Symposium 2: Genetics       │
│   • Symposium 3: Biochemistry   │
└─────────────────────────────────┘
```

### Multiple Select (Checkboxes)

```tsx
┌─────────────────────────────────┐
│ Symposium *                     │
│ ┌─────────────────────────────┐ │
│ │ ☑ Symposium 1: Molecular Bio│ │
│ │ ☐ Symposium 2: Genetics     │ │
│ │ ☑ Symposium 3: Biochemistry │ │
│ └─────────────────────────────┘ │
│ Odabrano: 2 symposium(a)        │
└─────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Database Schema

Spremljeno u `abstracts.custom_data` JSONB:

```json
{
  "abstractTitle": "Study on X",
  "abstractContent": "...",
  "abstractKeywords": "...",
  "abstractType": "oral",
  "symposium": ["Symposium 1: Molecular Biology"],
  "track": "Session 1: Morning Session"
}
```

**Za multiple izbor**:
```json
"symposium": [
  "Symposium 1: Molecular Biology",
  "Symposium 3: Biochemistry"
]
```

**Za single izbor**:
```json
"symposium": ["Symposium 1: Molecular Biology"]
```

---

### Conference Settings Schema

U `conferences.settings` JSONB:

```typescript
interface ConferenceSettings {
  // Primary level
  symposium_enabled?: boolean
  symposium_label?: string // "Symposium", "Section", "Track"
  symposium_required?: boolean
  symposium_options?: string[] // ["Symposium 1: ...", "Symposium 2: ..."]
  symposium_allow_multiple?: boolean
  
  // Secondary level
  track_enabled?: boolean
  track_label?: string // "Session", "Topic"
  track_required?: boolean
  track_options?: string[]
}
```

---

## 📊 Admin Panel Display

### Abstracts Tablica

```
┌──────────────────────────────────────┐
│ Title: Machine Learning in Biology   │
│ 📎 abstract.pdf                      │
│ 🎤 Oral                              │
│ 🔑 ML, biology, AI                   │
│ 📚 Symposium 1: Molecular Biology    │
│ 🎯 Session 1: Morning Session        │
└──────────────────────────────────────┘
```

**Badges**:
- 📚 Indigo badge → Symposium/Section
- 🎯 Purple badge → Track/Session

---

## 📧 Email Notifications

### Conference Team Email

```
Conference: XYZ 2024
Abstract ID: abc-123
Title: Machine Learning in Biology
Type: ORAL
Keywords: ML, biology, AI
Symposium/Section: Symposium 1: Molecular Biology
Track/Session: Session 1: Morning Session

File Name: abstract.pdf
...
```

---

## ✅ Validacija

### Frontend Validation

```typescript
// Symposium required
if (conference.settings.symposium_enabled && conference.settings.symposium_required) {
  if (selectedSymposium.length === 0) {
    showError(`${conference.settings.symposium_label} is required`)
    return
  }
}

// Track required
if (conference.settings.track_enabled && conference.settings.track_required) {
  if (!selectedTrack) {
    showError(`${conference.settings.track_label} is required`)
    return
  }
}
```

---

## 🎯 Use Cases

### Use Case 1: Simple Conference (1 nivo)

**Setup**:
- ✅ Enable Symposium
- Label: "Section"
- Required: Yes
- Multiple: No
- Options: Section A, Section B, Section C

**Result**: Korisnici moraju odabrati jednu sekciju

---

### Use Case 2: Large Conference (2 nivoa)

**Setup**:
- ✅ Enable Symposium
  - Label: "Symposium"
  - Required: Yes
  - Multiple: No
  - Options: Symposium 1, Symposium 2, Symposium 3
  
- ✅ Enable Track
  - Label: "Session"
  - Required: No
  - Options: Morning, Afternoon, Evening

**Result**: Korisnici moraju odabrati simpozij, a sesija je opciona

---

### Use Case 3: Interdisciplinary Conference (Multiple)

**Setup**:
- ✅ Enable Symposium
  - Label: "Research Area"
  - Required: Yes
  - Multiple: ✅ Yes
  - Options: Biology, Chemistry, Physics, Math

**Result**: Korisnici mogu označiti više research area-a

---

## 📈 Filtering & Reporting

### Filter Abstracts by Symposium

Admin može filtrovati abstracts po:
- Symposium/Section
- Track/Session
- Abstract Type
- Keywords

### Export Data

CSV export uključuje:
```csv
ID, Title, Authors, Type, Symposium, Track, Status
abc-123, "ML in Bio", "John Doe", Oral, "Symposium 1", "Morning", Accepted
```

---

## 🔄 Migration Path

### Existing Conferences

Ako konferencija već ima abstracts:
1. Enable symposium/track konfiguraciju
2. Definirajte opcije
3. Stari abstracts nemaju symposium/track (prikazuje se kao N/A)
4. Novi abstracts će imati obavezu da odaberu

### Backwards Compatibility

- Ako symposium nije enabled → Ne prikazuje se u formi
- Ako symposium options prazna → Ne prikazuje se
- Stari abstracts bez symposium → Prikazuje se N/A ili prazan badge

---

## 🎨 UI/UX Best Practices

### 1. **Progressive Disclosure**
- Prikazuje se samo ako je enabled
- Ne overload forma sa opcijama

### 2. **Clear Labels**
- Admin može customizovati nazive
- Korisnici vide intuitivne nazive (ne "Option 1", nego "Symposium 1: Molecular Biology")

### 3. **Visual Hierarchy**
- Primary (Symposium) → Indigo color
- Secondary (Track) → Purple color
- Clear color coding u badges

### 4. **Feedback**
- Multiple select pokazuje "Odabrano: X symposium(a)"
- Required polja imaju * indikator
- Validacija prije submita

---

## 🐛 Troubleshooting

### Problem: Symposium se ne prikazuje na formi

**Provjera**:
1. Da li je `symposium_enabled: true`?
2. Da li ima `symposium_options` u settings?
3. Da li je lista opcija prazna?

**Debug**:
```javascript
console.log(conference.settings.symposium_enabled)
console.log(conference.settings.symposium_options)
```

---

### Problem: Validacija ne radi

**Provjera**:
1. Da li je `symposium_required: true`?
2. Da li je `selectedSymposium` prazan array?

**Fix**: Provjeriti da validacija radi prije submita

---

### Problem: Admin ne vidi symposium u tablici

**Provjera**:
1. Da li je abstract submitovan NAKON što je symposium enabled?
2. Da li je `custom_data.symposium` spremljen u bazu?

**Query**:
```sql
SELECT id, custom_data->'symposium' as symposium 
FROM abstracts 
WHERE conference_id = 'xyz';
```

---

## 🚀 Future Enhancements

Moguća poboljšanja:

1. **Hierarchical Structure**
   - Track-ovi specifični za određeni Symposium
   - Dropdown cascade (odaberi Symposium → prikaži samo relevantne Track-ove)

2. **Color Coding**
   - Admin može odabrati boju za svaki Symposium
   - Badge u admin panelu prikazuje custom boju

3. **Symposium Chairs**
   - Assign moderatore/chairs za svaki Symposium
   - Automatski notify chairs kada se submituje abstract

4. **Advanced Filtering**
   - Multi-select filter u admin panelu
   - "Show only Symposium 1 AND Session Morning"

5. **Statistics**
   - Dashboard sa distribucijom abstrakata po Symposium-ima
   - Pie chart visualization

6. **Auto-assign**
   - Based on keywords, auto-suggest Symposium
   - ML-based recommendation

---

## 📚 Best Practices za Admins

### ✅ DO:

1. **Clear Naming**
   - ✅ "Symposium 1: Molecular Biology"
   - ❌ "Symposium 1"

2. **Logical Grouping**
   - Group related topics
   - Don't create too many options (< 15 ideal)

3. **Consistent Format**
   ```
   Symposium 1: Topic Name
   Symposium 2: Topic Name
   Section A: Description
   Section B: Description
   ```

4. **Test Preview**
   - Use preview u admin settings
   - Testirati kako izgleda na formi

### ❌ DON'T:

1. **Too Many Options**
   - Avoid 50+ symposium-a
   - Korisnici će biti overwhelmed

2. **Vague Names**
   - ❌ "General Session"
   - ✅ "Clinical Research: Cardiovascular"

3. **Mixed Formats**
   - Ne miješati formate u istoj listi
   - Consistency is key

---

## 🎓 Example Configurations

### Medical Conference

```
Symposium (Required, Single):
- Symposium 1: Cardiology
- Symposium 2: Neurology
- Symposium 3: Oncology
- Symposium 4: Pediatrics

Track (Optional, Single):
- Clinical Case Studies
- Basic Research
- Review Articles
```

---

### Computer Science Conference

```
Track (Required, Multiple):
- Machine Learning
- Computer Vision
- Natural Language Processing
- Robotics
- Theory & Algorithms

Session (Required, Single):
- Oral Presentation
- Poster Session
- Demo Session
```

---

### Biology Conference

```
Section (Required, Single):
- Molecular Biology
- Ecology
- Genetics
- Evolution
- Biochemistry

Format (Required, Single):
- Full Paper (20 min)
- Short Paper (10 min)
- Poster
- Invited Talk
```

---

## 📖 Summary

**Senior Developer Solution features**:

✅ **Flexible** - Adapt to any conference structure  
✅ **Scalable** - Works for 10 or 1000 abstracts  
✅ **Configurable** - No code changes needed  
✅ **User-friendly** - Intuitive for admins and users  
✅ **Maintainable** - Clean architecture  
✅ **Extensible** - Easy to add more features  

**Perfect for**:
- Scientific conferences
- Academic symposiums
- Multi-track events
- Sectioned workshops
- Themed sessions

🚀 **Ready to use!**
