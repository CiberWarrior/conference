# Conference Registration Form

Web aplikacija za prijavu na konferenciju s opcionalnim plaćanjem i automatskim email potvrdama.

## Tehnologije

- **Frontend**: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS
- **Backend/Baza**: Supabase (PostgreSQL)
- **Email**: Supabase Edge Functions + Resend API
- **Plaćanje**: Stripe (opcionalno)

## Setup

1. Instaliraj dependencies:
```bash
npm install
```

2. Kopiraj `.env.local.example` u `.env.local` i popuni svoje Supabase i Resend API ključeve

3. Postavi Supabase bazu:
   - Kreiraj Supabase projekt
   - Pokreni SQL migraciju iz `supabase/migrations/` direktorija
   - Postavi Resend API key u Supabase Edge Function secrets

4. Pokreni development server:
```bash
npm run dev
```

## Struktura projekta

- `app/` - Next.js App Router stranice i API rute
- `components/` - React komponente
- `lib/` - Utility funkcije i konfiguracije
- `types/` - TypeScript tipovi
- `supabase/` - Supabase Edge Functions i migracije

