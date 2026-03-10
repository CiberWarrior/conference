# MeetFlow - Conference Management Platform

A multi-tenant conference management system built with Next.js 14, Supabase, and TypeScript. Supports bilingual UI (English / Croatian), Stripe payments, abstract submissions, check-in via QR, certificate generation, and a full admin dashboard with RBAC.

## Features

### Multi-Level Admin System (RBAC)
- **Super Admin** – full platform access, user management, all conferences
- **Conference Admin** – scoped access to assigned conferences only
- 8 granular permission types per user per conference
- Supabase Auth with Row Level Security (RLS) for data isolation
- Separate admin client (`SERVICE_ROLE_KEY`) isolated from the browser bundle

### Conference Management
- Create and manage multiple conferences
- Configurable registration forms with custom fields per conference
- Registration fee types (early bird, regular, etc.) with per-conference pricing
- Abstract submission and review workflow
- CMS pages per conference (`/conferences/[slug]/p/[pageSlug]`) with TipTap rich-text editor, SEO meta fields, hero layouts, and custom CSS
- Check-in system with QR code scanning
- Certificate generation and bulk download

### Registration & Payments
- Dynamic registration forms driven by conference configuration
- Participant management (single or group registrations)
- Stripe payment integration (card payments, bank transfer option)
- Automatic invoice generation via Stripe
- Payment history tracking
- Payment reminders and payment offer links
- Zero-fee registrations skip the payment flow entirely

### Admin Dashboard
- Real-time analytics and registration statistics
- Payment tracking and export
- Abstract management (approve / reject / review)
- Check-in monitoring
- Multi-format data export (Excel, CSV, JSON, clipboard)

### Lead Generation
- Professional contact form on homepage
- Lead tracking with status workflow (New → Contacted → Qualified → Converted)
- Payment offer links for subscription plans
- Multi-format export

### Internationalisation (i18n)
- Bilingual UI: English and Croatian
- Powered by `next-intl` with `messages/en.json` and `messages/hr.json`
- Language switch available on public pages

### Email System
- Registration confirmation emails
- Payment confirmation and reminders
- Conference team notifications
- Abstract submission confirmations
- Welcome emails for new admin users
- Sent via Resend API + Supabase Edge Functions

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template and fill in values
cp .env.local.example .env.local

# Run development server
npm run dev

# Run tests
npm test

# Production build
npm run build
```

See [docs/QUICK_START.md](docs/QUICK_START.md) for the full setup guide.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `NEXT_PUBLIC_APP_URL` | Public app URL |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `RESEND_API_KEY` | Resend email API key |
| `EMAIL_FROM` | Sender address for outgoing emails |
| `ADMIN_EMAIL` | Admin notification recipient |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token |

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Payments | Stripe |
| Styling | Tailwind CSS |
| i18n | next-intl (EN, HR) |
| Rich Text | TipTap |
| Rate Limiting | Upstash Redis |
| Email | Resend API |
| Charts | Recharts |
| QR | html5-qrcode / qrcode.react |
| Export | jspdf, xlsx, docx |
| Deployment | Vercel |

## Project Structure

```
├── app/
│   ├── admin/                # Protected admin dashboard
│   │   ├── dashboard/        # Analytics & overview
│   │   ├── conferences/      # Conference CRUD & settings
│   │   ├── registrations/    # Registration management
│   │   ├── participants/     # Participant details
│   │   ├── payments/         # Payment tracking
│   │   ├── abstracts/        # Abstract review
│   │   ├── checkin/          # QR check-in
│   │   ├── certificates/     # Certificate generation
│   │   ├── inquiries/        # Lead management
│   │   ├── tickets/          # Support tickets
│   │   ├── users/            # User management (RBAC)
│   │   └── account/          # Admin account settings
│   ├── auth/                 # Admin authentication
│   ├── api/                  # API routes
│   │   ├── register/         # Public registration
│   │   ├── create-payment-intent/
│   │   ├── confirm-payment/
│   │   ├── stripe-webhook/
│   │   ├── contact/          # Contact form
│   │   ├── conferences/      # Public conference APIs
│   │   └── admin/            # Protected admin APIs
│   ├── conferences/[slug]/   # Public conference pages
│   │   ├── register/         # Registration form
│   │   ├── submit-abstract/  # Abstract submission
│   │   └── p/[pageSlug]/     # CMS pages
│   └── participant/          # Participant portal (optional)
├── components/
│   ├── admin/                # Admin UI components (54 reusable components)
│   ├── conference/           # Conference-specific components
│   └── registration/         # Registration flow components
├── contexts/
│   ├── AuthContext.tsx        # Authentication state
│   └── ConferenceContext.tsx  # Conference selection (admin)
├── lib/
│   ├── supabase.ts           # Supabase client (anon key)
│   ├── supabase-admin.ts     # Supabase admin client (service role, server-only)
│   ├── auth.ts               # Auth helpers
│   ├── stripe.ts             # Stripe client
│   ├── email.ts              # Email service (Resend)
│   ├── logger.ts             # Structured logging
│   └── rate-limit.ts         # Upstash rate limiting
├── types/                    # TypeScript type definitions
├── utils/                    # Validators and helpers
├── constants/                # App constants
├── hooks/                    # Custom React hooks
├── messages/                 # i18n translations (en.json, hr.json)
├── i18n/                     # next-intl config
├── supabase/
│   ├── migrations/           # Database migrations (45+)
│   └── functions/            # Edge Functions
├── scripts/                  # Setup & optimisation scripts
└── docs/                     # Documentation
```

## Security

- Supabase Auth with httpOnly session cookies
- Row Level Security (RLS) on all tables
- Server-side authorisation checks in middleware and API routes
- Admin client (`SERVICE_ROLE_KEY`) isolated in `lib/supabase-admin.ts` with `server-only` import guard
- Stripe webhook signature verification
- Rate limiting on registration and payment endpoints (Upstash)
- Input validation with Zod
- XSS protection via DOMPurify for user-generated HTML
- CSRF protection via Next.js conventions

## Database

Managed via Supabase migrations in `supabase/migrations/`. Key tables:

- `conferences` – conference metadata and settings
- `registrations` – participant registrations with custom data
- `registration_fees` – fee types per conference
- `abstracts` – abstract submissions
- `user_profiles` – admin profiles (super_admin, conference_admin)
- `conference_permissions` – RBAC permissions per user per conference
- `contact_inquiries` – lead generation
- `payment_history` – payment audit trail
- `conference_pages` – CMS pages with SEO and hero layout fields
- `admin_audit_log` – admin action audit trail
- `subscriptions` – platform subscription records

## Documentation

All docs are in the `docs/` folder:

| Document | Purpose |
|----------|---------|
| [QUICK_START.md](docs/QUICK_START.md) | Get started quickly |
| [SETUP_INSTRUCTIONS.md](docs/SETUP_INSTRUCTIONS.md) | Detailed setup guide |
| [SYSTEM_ARCHITECTURE_SUMMARY.md](docs/SYSTEM_ARCHITECTURE_SUMMARY.md) | Architecture overview |
| [VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md) | Production deployment |
| [docs/00_ACTIVE/](docs/00_ACTIVE/) | Active checklists and project context |

## Deployment

The platform is production-ready for Vercel. See [docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md) and [docs/00_ACTIVE/DEPLOYMENT_CHECKLIST.md](docs/00_ACTIVE/DEPLOYMENT_CHECKLIST.md) for the full checklist.

```bash
# Deploy via Vercel CLI
vercel --prod

# Or push to main branch for automatic deployment
git push origin main
```

## License

Private project – All rights reserved.
