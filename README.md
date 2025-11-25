# Conference Registration Form

Web aplikacija za prijavu na konferenciju s opcionalnim plaćanjem i automatskim email potvrdama.

## Tehnologije

- **Frontend**: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Backend/Baza**: Supabase (PostgreSQL)
- **Email**: Supabase Edge Functions + Resend API
- **Plaćanje**: Stripe (opcionalno)

## 🚀 Brzi Start

### 1. Instaliraj dependencies:
```bash
npm install
```

### 2. Postavi Supabase bazu podataka

**📖 Detaljne upute:** Pogledajte [SETUP_BAZA_PODATAKA.md](./SETUP_BAZA_PODATAKA.md)

**Kratko:**
1. Kreiraj projekt na [supabase.com](https://supabase.com)
2. U Supabase SQL Editoru pokreni `supabase/migrations/000_complete_setup.sql`
3. Kopiraj API ključeve iz Supabase Settings → API

### 3. Postavi environment varijable

Kreiraj `.env.local` datoteku u root direktoriju:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Pokreni aplikaciju:
```bash
npm run dev
```

Aplikacija će biti dostupna na `http://localhost:3000`

## 📊 Gdje se podaci pohranjuju?

Svi podaci korisnika se pohranjuju u **Supabase bazu podataka** (PostgreSQL u cloudu). 
- Besplatno do 500MB baze podataka
- Automatski backup
- Sigurna pohrana podataka

**⚠️ Važno:** Podaci se spremaju SAMO u Supabase - nema dodatne pohrane na drugim lokacijama. Preporučujemo redovne backupove kroz admin panel ili API endpoint.

**📖 Detalji o praksi pohrane:** Pogledajte [DATA_STORAGE_PRACTICES.md](./DATA_STORAGE_PRACTICES.md)

## Struktura projekta

- `app/` - Next.js App Router stranice i API rute
- `components/` - React komponente
- `lib/` - Utility funkcije i konfiguracije
- `types/` - TypeScript tipovi
- `supabase/` - Supabase Edge Functions i migracije

