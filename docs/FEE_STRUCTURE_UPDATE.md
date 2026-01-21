# Fee Structure Update - MeetFlow

## Što je novo?

MeetFlow sada podržava **fleksibilniji** i **jasniji** sistem za definiranje registration fee-a!

---

## Stara vs Nova Struktura

### ❌ Stara struktura (prije):
```
Standard Pricing:
- Early Bird: 400 EUR
- Regular: 500 EUR
- Late: 600 EUR

Student Discount: 60 EUR (oduzima se)
→ Student plaća: 340 / 440 / 540 EUR
```

**Problem**: Konfuzno za admina - mora računati koliki discount treba.

---

### ✅ Nova struktura (sad):
```
Standard Participant:
├─ Early Bird: 400 EUR
├─ Regular: 500 EUR
└─ Late: 600 EUR

Student:
├─ Early Bird: 340 EUR  ← Fiksna cijena
├─ Regular: 440 EUR
└─ Late: 540 EUR

Custom Fee Types (opciono):
├─ VIP Member:
│   ├─ Early Bird: 300 EUR
│   ├─ Regular: 400 EUR
│   └─ Late: 500 EUR
│
└─ Senior Citizen:
    ├─ Early Bird: 350 EUR
    ├─ Regular: 450 EUR
    └─ Late: 550 EUR
```

**Prednosti**:
- ✅ Kristalno jasne cijene
- ✅ Nema računanja
- ✅ Mogućnost custom fee types (VIP, Senior, itd.)

---

## Kako koristiti (Admin)

### 1. Postavke Standard & Student Pricing

U **Conference Settings** > **Registration Fee**:

1. **Standard Participant** - upiši cijene za sve 3 tiera
2. **Student Pricing** - upiši fiksne cijene za studente
3. **Save**

### 2. Dodavanje Custom Fee Types (opciono)

Ako trebaš dodatne kategorije (npr. VIP Member):

1. Scroll do **Custom Fee Types**
2. Klikni **Add Fee Type**
3. Unesi:
   - Name: npr. "VIP Member"
   - Description: npr. "Special pricing for VIP members"
   - Early Bird / Regular / Late cijene
4. **Save**

---

## Kako funkcionira (Public Registration Form)

Sudionici vide sve dostupne opcije kao kartice:

```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Early Bird  │ │   Regular   │ │   Student   │ │ VIP Member  │
│             │ │             │ │             │ │             │
│   400 EUR   │ │   500 EUR   │ │   340 EUR   │ │   300 EUR   │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

---

## Migracija postojećih konferencija

Sve postojeće konferencije su automatski migrirane:

- **Student Discount** je konveriran u **Student Fixed Pricing**
- Stara cijena: `Standard - Discount = Student Price`
- Nova cijena: ista kao stara (automatski izračunata)

**Primjer**:
- Staro: Regular 500 EUR, Discount 60 EUR → Student 440 EUR
- Novo: Regular 500 EUR, Student Regular 440 EUR ✅

---

## Backward Compatibility

- `student_discount` polje je zadržano u bazi za backward compatibility
- Novi `student` pricing ima prioritet
- Stari kod će i dalje raditi

---

## Database Schema

```typescript
interface ConferencePricing {
  // Standard pricing
  early_bird: { amount: number; deadline?: string }
  regular: { amount: number }
  late: { amount: number }
  
  // Student pricing (NEW)
  student?: {
    early_bird: number
    regular: number
    late: number
  }
  
  // Custom fee types (NEW)
  custom_fee_types?: Array<{
    id: string
    name: string
    description?: string
    early_bird: number
    regular: number
    late: number
  }>
  
  // Legacy (kept for compatibility)
  student_discount?: number
}
```

---

## FAQ

### Što ako ne želim student pricing?
- Postavi istu cijenu kao standard ili ostavi 0
- Neće se prikazati na registration formi ako je 0

### Mogu li imati više od jednog custom fee type-a?
- Da! Dodaj koliko god želiš (VIP, Senior, Member, itd.)

### Trebam li ručno migrirati postojeće konferencije?
- Ne, automatski je migrirano
- Možeš ih urediti i prilagoditi po želji

### Što s custom_pricing_fields?
- To je legacy funkcija (ostaje za backward compatibility)
- Koristi **custom_fee_types** za bolje iskustvo

---

## Support

Ako imaš pitanja ili problem:
- Provjeri Admin UI: Conference Settings > Registration Fee
- Kontaktiraj support tim
