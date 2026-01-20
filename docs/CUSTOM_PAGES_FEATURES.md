# Custom Pages - Advanced Features

Ovaj dokument opisuje sve implementirane funkcionalnosti za custom conference pages.

## 📋 Implementirane Funkcionalnosti

### 1. SEO i Meta Tags ✅
- **Custom Meta Title**: Može se postaviti custom meta title za SEO (max 60 karaktera)
- **Meta Description**: Custom meta description za search engine rezultate (max 160 karaktera)
- **Open Graph Image**: Slika koja se prikazuje kada se stranica dijeli na društvenim mrežama (preporučeno: 1200x630px)
- **Automatski Meta Tags**: Dinamički se postavljaju meta tagovi za Twitter i Facebook sharing

**Lokacija**: Admin UI → Edit Page → SEO Settings sekcija

### 2. Editor Poboljšanja ✅

#### Table Support
- **Insert Table**: Dodaj tablicu s custom brojem redaka i kolona
- **Resizable**: Tabele su resizable
- **Styling**: Automatski stilizirane tabele s borderima

**Instalacija paketa**:
```bash
npm install @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header
```

#### Code Syntax Highlighting
- **Code Blocks**: Code blokovi s syntax highlighting
- **Multiple Languages**: Podrška za različite program ske jezike

**Instalacija paketa**:
```bash
npm install @tiptap/extension-code-block-lowlight lowlight
```

#### Custom HTML
- **Insert Custom HTML**: Mogućnost umetanja custom HTML koda direktno u editor
- **Flexibility**: Potpuna kontrola nad HTML strukturom

### 3. Interaktivni Elementi ✅

#### Contact Form (`components/conference/ContactForm.tsx`)
- **Form Fields**: Name, Email, Subject, Message
- **Validation**: Client-side validacija
- **Submission**: Integracija s postojećim `/api/contact` endpointom
- **Success State**: Prikazuje success poruku nakon slanja

**Korištenje u editoru**:
```html
<!-- Insert custom HTML -->
<div data-component="contact-form" data-conference-id="..." data-conference-slug="..." data-conference-name="..."></div>
```

#### FAQ Accordion (`components/conference/FAQAccordion.tsx`)
- **Accordion UI**: Collapsible FAQ sekcije
- **Props**: Prima array FAQ items (question, answer)
- **Styling**: Modern, responsive dizajn

**Korištenje u editoru**:
```html
<!-- Insert custom HTML -->
<div data-component="faq" data-items='[{"question":"Q?","answer":"A"}]'></div>
```

### 4. Content Blokovi ✅

#### Image Gallery
- **Grid Layout**: Automatski grid layout (1 kolona na mobile, 3 na desktop)
- **Customizable**: Može se postaviti broj slika u galeriji
- **Responsive**: Potpuno responsive dizajn

**Korištenje**: Klik na "🖼️ Gallery" button u editor toolbaru

#### Video Embed
- **YouTube Support**: Automatsko prepoznavanje YouTube URL-ova
- **Vimeo Support**: Automatsko prepoznavanje Vimeo URL-ova
- **Responsive**: Aspect ratio se automatski održava
- **Auto-embed**: Automatski se kreira iframe embed

**Korištenje**: Klik na "▶️ Video" button u editor toolbaru, unesi YouTube ili Vimeo URL

### 5. Styling i Branding ✅

#### Custom CSS
- **Per-Page CSS**: Svaka stranica može imati svoj custom CSS
- **Scoped**: CSS se injektira samo na tu stranicu
- **Full Control**: Potpuna kontrola nad stylingom

**Lokacija**: Admin UI → Edit Page → Custom CSS sekcija

**Primjer**:
```css
.my-custom-class {
  color: blue;
  font-size: 18px;
}
```

### 6. Utility Funkcionalnosti ✅

#### Share Buttons (`components/conference/PageShareButtons.tsx`)
- **Twitter Share**: Dijeljenje na Twitter
- **Facebook Share**: Dijeljenje na Facebook
- **LinkedIn Share**: Dijeljenje na LinkedIn
- **Copy Link**: Kopiranje linka u clipboard
- **Print**: Print-friendly verzija stranice

**Lokacija**: Automatski se prikazuje na public stranici

#### Print-Friendly
- **Print Optimization**: Stranica je optimizirana za print
- **Button**: "Print" button u share buttons sekciji

### 7. Layout Templatei ✅

#### Column Layouts
- **1 Column**: Full width single column layout
- **2 Columns**: Two-column grid layout (responsive)
- **3 Columns**: Three-column grid layout (responsive)

**Korištenje**: Klik na "📐 Layout" button u editor toolbaru

### 8. Call-to-Action i Spacer ✅

#### CTA Blocks
- **Customizable**: Custom button text i URL
- **Styling**: Pre-styled CTA blok s blue background
- **Responsive**: Potpuno responsive

**Korištenje**: Klik na "🎯 CTA" button u editor toolbaru

#### Spacer
- **Vertical Spacing**: Dodaje vertikalni spacer između sekcija
- **Customizable Height**: Može se prilagoditi visina

**Korištenje**: Klik na "⬜ Spacer" button u editor toolbaru

## 📦 Potrebni NPM Paketi

Za potpunu funkcionalnost, instaliraj sljedeće pakete:

```bash
npm install @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-code-block-lowlight lowlight
```

## 🗄️ Database Migracije

Primijeni migraciju za SEO i Custom CSS polja:

```sql
-- File: supabase/migrations/044_add_seo_and_custom_css_to_pages.sql
```

## 🎨 Editor Toolbar

Editor toolbar sada uključuje:

1. **Formatting**: Bold, Italic, Underline, Strikethrough, Code
2. **Headings**: H1, H2, H3
3. **Lists**: Bullet list, Numbered list
4. **Blocks**: Blockquote, Code block, Horizontal rule
5. **Media**: Upload Image, Image URL, Link
6. **Advanced**: Table, Video, Gallery, Layout, CTA, Spacer, Custom HTML
7. **Alignment**: Left, Center, Right, Justify

## 📝 Primjeri Korištenja

### Dodavanje Video Embed-a
1. Klik na "▶️ Video" button
2. Unesi YouTube ili Vimeo URL
3. Video se automatski embed-uje

### Kreiranje FAQ Sekcije
1. Klik na "&lt;/&gt; HTML" button
2. Unesi HTML s FAQ accordion komponentom
3. Ili koristi custom HTML direktno u editoru

### Dodavanje Custom CSS
1. Idi u "Custom CSS" sekciju u admin UI
2. Unesi CSS kod
3. CSS se automatski primjenjuje na stranicu

## 🔒 Sigurnost

- **HTML Sanitization**: Svi HTML elementi se sanitiziraju kroz DOMPurify
- **XSS Protection**: Automatska zaštita od XSS napada
- **CSS Scoping**: Custom CSS je scoped na stranicu

## 🚀 Sljedeći Koraci

Moguća poboljšanja za budućnost:
- Drag & drop za gallery slike
- WYSIWYG editor za FAQ items
- Template library za česte layout patterns
- Preview mode u admin UI
- Version history za stranice
