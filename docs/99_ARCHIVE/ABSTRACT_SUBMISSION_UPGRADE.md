# Abstract Submission Upgrade Plan

## Problem
- Trenutno ima hardcoded file upload u abstract submission formi
- Ne postoji fleksibilnost za dodavanje različitih tipova polja
- Admin ne može odlučiti hoće li file upload ili text paste

## Rješenje

### 1. Novi tipovi polja (COMPLETED ✅)
- `longtext` - textarea sa character limitom (max 5000 znakova)
- `file` - file upload za abstract dokumente

### 2. Type Definitions (COMPLETED ✅)
```typescript
type: 'text' | 'textarea' | 'longtext' | 'number' | 'email' | 'tel' | 'date' | 'select' | 'radio' | 'checkbox' | 'file' | 'separator'
fileTypes?: string[] // ['.pdf', '.doc', '.docx']
maxFileSize?: number // u MB
validation?: {
  maxLength?: number // za longtext (max 5000)
  minLength?: number
}
```

### 3. Admin Field Editor (COMPLETED ✅)
- Dodani novi tipovi u dropdown
- UI za konfiguraciju file upload opcija (file types, max size)
- UI za konfiguraciju longtext (character limit)

### 4. Abstract Submission Form (TODO)
**Treba ukloniti:**
- Hardcoded file upload sekciju (lines 649-703)
- Hardcoded file state i handleFileChange

**Treba dodati:**
- Renderovanje `file` polja kada je dodano kao custom field
- Renderovanje `longtext` polja sa character counterom
- File upload handling kroz custom fields
- Character counter za longtext polja

### 5. Implementation Details

#### File Upload Field Rendering:
```tsx
{field.type === 'file' && (
  <div>
    <label>{field.label} {field.required && <span>*</span>}</label>
    <input
      type="file"
      accept={field.fileTypes?.join(',') || '.pdf,.doc,.docx'}
      onChange={(e) => handleFileUpload(field.name, e.target.files?.[0])}
      required={field.required}
    />
    {field.description && <p>{field.description}</p>}
    <p>Max size: {field.maxFileSize || 10} MB</p>
  </div>
)}
```

#### Long Text Field Rendering:
```tsx
{field.type === 'longtext' && (
  <div>
    <label>{field.label} {field.required && <span>*</span>}</label>
    <textarea
      value={customFields[field.name] || ''}
      onChange={(e) => handleLongTextChange(field.name, e.target.value)}
      maxLength={field.validation?.maxLength || 5000}
      required={field.required}
      rows={12}
    />
    <div className="text-sm text-gray-600">
      {(customFields[field.name]?.length || 0)} / {field.validation?.maxLength || 5000} characters
    </div>
    {field.description && <p>{field.description}</p>}
  </div>
)}
```

## Benefits
1. **Fleksibilnost** - Admin odlučuje koje polje dodati (file ili text paste)
2. **Character Counter** - Korisnici vide koliko znakova imaju
3. **Validacija** - Automatska validacija file size i character limit
4. **Multiple Files** - Može se dodati više file polja ako treba
5. **Text + File** - Mogu postojati oba odjednom ako admin želi

## Migration Path
1. Admin dodaje novo custom field tipa "file" ili "longtext"
2. Stari hardcoded file upload može ostati privremeno za backward compatibility
3. Kasnije se može ukloniti kada svi eventi pređu na novi sistem
