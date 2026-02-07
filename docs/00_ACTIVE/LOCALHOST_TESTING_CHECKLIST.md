# 🧪 Localhost Testing Checklist

**Datum:** $(date)  
**Cilj:** Testiranje novih funkcionalnosti na localhostu

---

## ✅ Pre-Test Provjera

### 1. Environment Variables
Provjeri da imaš u `.env.local`:

```bash
# Obavezno
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Za contact form email
ADMIN_EMAIL=your-email@domain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Opcionalno (za Stripe)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 2. Pokreni Dev Server
```bash
cd "/Users/renata/Desktop/Conference Platform"
npm install  # ako nisi nedavno
npm run dev
```

**Očekivani output:**
```
✓ Ready in X seconds
○ Local:        http://localhost:3000
```

---

## 🧪 Test Scenarios

### Test 1: Admin Panel - Conference Pages ✅

**URL:** `http://localhost:3000/admin/conferences/[id]/pages`

**Što testirati:**
1. ✅ Kreiraj novu stranicu
2. ✅ Dodaj title i slug
3. ✅ Testiraj editor (TiptapEditor):
   - Bold, Italic, Headings
   - Insert Image (upload)
   - Insert Table
   - Insert Video (YouTube/Vimeo)
   - Insert Gallery
   - Insert Layout (1/2/3 columns)
   - Insert CTA
   - Insert Custom HTML
4. ✅ Save stranicu
5. ✅ Provjeri da se stranica sprema u database

---

### Test 2: Hero Layouts ✅

**Lokacija:** Admin → Edit Page → Hero Settings tab

**Što testirati:**
1. ✅ **Centered Layout:**
   - Dodaj hero title
   - Dodaj hero subtitle
   - Dodaj background color (npr. `#3B82F6`)
   - Dodaj hero image URL (opcionalno)
   - Save i provjeri na public stranici

2. ✅ **Split Layout:**
   - Promijeni layout type na "split"
   - Dodaj hero logo URL
   - Dodaj hero info cards (JSON format):
     ```json
     [
       {"label": "START DATE", "value": "Jul 10, 2027", "icon": "calendar"},
       {"label": "LOCATION", "value": "Zagreb, Croatia", "icon": "map-pin"}
     ]
     ```
   - Save i provjeri na public stranici

---

### Test 3: SEO Settings ✅

**Lokacija:** Admin → Edit Page → SEO Settings tab

**Što testirati:**
1. ✅ Dodaj custom meta title (max 60 karaktera)
2. ✅ Dodaj meta description (max 160 karaktera)
3. ✅ Dodaj OG image URL
4. ✅ Save stranicu
5. ✅ Otvori public stranicu i provjeri:
   - Browser tab title (F12 → Elements → `<title>`)
   - Meta description (F12 → Elements → `<meta name="description">`)
   - OG tags (F12 → Elements → `<meta property="og:title">`)

**Test Tool:** Koristi [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) ili [Twitter Card Validator](https://cards-dev.twitter.com/validator)

---

### Test 4: Custom CSS ✅

**Lokacija:** Admin → Edit Page → Advanced tab

**Što testirati:**
1. ✅ Dodaj custom CSS:
   ```css
   .my-custom-class {
     color: red;
     font-size: 24px;
   }
   ```
2. ✅ U editoru dodaj HTML s tom klasom:
   ```html
   <div class="my-custom-class">Test Custom CSS</div>
   ```
3. ✅ Save i provjeri da se CSS primjenjuje na public stranici
4. ✅ Provjeri da CSS ne utječe na druge stranice

---

### Test 5: Contact Form ✅

**Lokacija:** Public conference page (dodaj ContactForm komponentu u editor)

**Što testirati:**
1. ✅ U editoru, klikni "Custom HTML" button
2. ✅ Dodaj ContactForm komponentu:
   ```html
   <div data-component="contact-form" 
        data-conference-id="[CONFERENCE_ID]" 
        data-conference-slug="[CONFERENCE_SLUG]" 
        data-conference-name="[CONFERENCE_NAME]">
   </div>
   ```
   **ILI** koristi React komponentu direktno u editoru (ako je podržano)

3. ✅ Na public stranici:
   - Ispuni formu (Name, Email, Subject, Message)
   - Submit formu
   - Provjeri success poruku
   - Provjeri da se poruka sprema u `contact_inquiries` tabelu u Supabase
   - Provjeri da se email šalje adminu (ako je email konfiguriran)

**API Endpoint:** `POST /api/conferences/[slug]/contact`

---

### Test 6: FAQ Accordion ✅

**Lokacija:** Public conference page

**Što testirati:**
1. ✅ U editoru, klikni "Custom HTML" button
2. ✅ Dodaj FAQ accordion:
   ```html
   <div data-component="faq" 
        data-items='[{"question":"What is this?","answer":"This is an answer."},{"question":"Another question?","answer":"Another answer."}]'>
   </div>
   ```
3. ✅ Provjeri da se accordion prikazuje
4. ✅ Klikni na pitanje i provjeri da se otvara/zatvara

---

### Test 7: Share Buttons ✅

**Lokacija:** Public conference page (automatski se prikazuje)

**Što testirati:**
1. ✅ Provjeri da se share buttons prikazuju na stranici
2. ✅ Testiraj "Copy Link" - provjeri da se link kopira u clipboard
3. ✅ Testiraj "Print" - provjeri print preview
4. ✅ Testiraj "Twitter" - provjeri da se otvara Twitter share dialog
5. ✅ Testiraj "Facebook" - provjeri da se otvara Facebook share dialog
6. ✅ Testiraj "LinkedIn" - provjeri da se otvara LinkedIn share dialog

---

### Test 8: Editor Features ✅

**Lokacija:** Admin → Edit Page → Content tab

**Što testirati:**

#### Table Support:
1. ✅ Klikni "📊 Table" button
2. ✅ Unesi broj redaka i kolona
3. ✅ Provjeri da se tabela umetne
4. ✅ Testiraj editovanje tabele (dodaj tekst u ćelije)

#### Video Embed:
1. ✅ Klikni "▶️ Video" button
2. ✅ Unesi YouTube URL: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
3. ✅ Provjeri da se video embed-uje
4. ✅ Testiraj Vimeo URL: `https://vimeo.com/123456789`

#### Gallery:
1. ✅ Klikni "🖼️ Gallery" button
2. ✅ Unesi broj slika (npr. 3)
3. ✅ Provjeri da se gallery grid kreira

#### Layout:
1. ✅ Klikni "📐 Layout" button
2. ✅ Testiraj 1, 2, i 3 kolone
3. ✅ Provjeri responsive dizajn (resize browser)

#### CTA:
1. ✅ Klikni "🎯 CTA" button
2. ✅ Unesi button text i URL
3. ✅ Provjeri da se CTA blok kreira

---

## 🐛 Common Issues & Solutions

### Problem: "Failed to load page"
**Rješenje:**
- Provjeri da je stranica `published: true`
- Provjeri da conference postoji i je `published: true` i `active: true`
- Provjeri browser console za greške

### Problem: "Contact form ne radi"
**Rješenje:**
- Provjeri da API ruta `/api/conferences/[slug]/contact` postoji
- Provjeri browser Network tab za API pozive
- Provjeri da `conference_slug` u ContactForm komponenti odgovara slug-u u URL-u

### Problem: "Custom CSS se ne primjenjuje"
**Rješenje:**
- Provjeri da je CSS spremljen u database
- Provjeri browser console za CSS greške
- Provjeri da CSS selektori odgovaraju HTML strukturi

### Problem: "Meta tags se ne prikazuju"
**Rješenje:**
- Provjeri da su meta tagovi spremljeni u database
- Provjeri browser Elements tab (F12)
- Provjeri da se meta tagovi dinamički postavljaju u `useEffect`

---

## 📊 Quick Test URLs

```bash
# Admin - List Pages
http://localhost:3000/admin/conferences/[id]/pages

# Admin - Edit Page
http://localhost:3000/admin/conferences/[id]/pages/[pageId]

# Public - View Page
http://localhost:3000/conferences/[slug]/p/[pageSlug]
```

---

## ✅ Success Criteria

Sve testove smatraš uspješnim ako:
- ✅ Stranice se kreiraju i spremaju bez grešaka
- ✅ Editor radi sa svim features
- ✅ Hero layouts se prikazuju ispravno
- ✅ SEO meta tagovi se postavljaju
- ✅ Custom CSS se primjenjuje
- ✅ Contact form šalje poruke
- ✅ Share buttons rade
- ✅ Nema console grešaka

---

## 🚀 Next Steps

Nakon što sve testiraš:
1. ✅ Provjeri da nema console grešaka
2. ✅ Provjeri da nema TypeScript grešaka (`npm run lint`)
3. ✅ Provjeri responsive dizajn na mobile
4. ✅ Testiraj na različitim browserima (Chrome, Firefox, Safari)

**Sretno s testiranjem!** 🎉
