# 📁 Project Structure - MeetFlow Conference Platform

Kompletna struktura projekta sa objašnjenjima svakog direktorijuma i fajla.

## 🌳 Directory Tree

```
Conference Platform/
├── .env.local                    # Environment variables (gitignored)
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── .eslintrc.json                # ESLint configuration
├── middleware.ts                 # Next.js middleware for auth & routing
├── next.config.mjs               # Next.js configuration
├── next-env.d.ts                # Next.js TypeScript definitions
├── package.json                  # Dependencies and scripts
├── package-lock.json            # Locked dependencies
├── postcss.config.mjs           # PostCSS configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── vercel.json                  # Vercel deployment configuration
│
├── app/                          # Next.js App Router (main application)
│   ├── layout.tsx               # Root layout component
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   │
│   ├── admin/                   # Admin dashboard section
│   │   ├── layout.tsx           # Admin layout with sidebar
│   │   ├── page.tsx             # Admin dashboard home
│   │   │
│   │   ├── (auth)/              # Auth group route
│   │   │   └── layout.tsx       # Auth layout wrapper
│   │   │
│   │   ├── dashboard/           # Dashboard analytics
│   │   │   └── page.tsx
│   │   │
│   │   ├── users/               # User management (RBAC)
│   │   │   ├── page.tsx         # Users list
│   │   │   ├── new/
│   │   │   │   └── page.tsx     # Create new user
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx # Edit user
│   │   │
│   │   ├── conferences/         # Conference management
│   │   │   ├── page.tsx         # Conferences list
│   │   │   ├── new/
│   │   │   │   └── page.tsx     # Create conference
│   │   │   └── [id]/
│   │   │       └── settings/
│   │   │           └── page.tsx # Conference settings
│   │   │
│   │   ├── registrations/        # Registration management
│   │   │   └── page.tsx
│   │   │
│   │   ├── payments/             # Payment management
│   │   │   └── page.tsx
│   │   │
│   │   ├── abstracts/           # Abstract management
│   │   │   └── page.tsx
│   │   │
│   │   ├── checkin/             # Check-in system
│   │   │   └── page.tsx
│   │   │
│   │   ├── certificates/        # Certificate generation
│   │   │   └── page.tsx
│   │   │
│   │   └── inquiries/           # Lead management
│   │       └── page.tsx
│   │
│   ├── api/                      # API Routes (Backend)
│   │   ├── auth/                  # Authentication API endpoints
│   │   │   ├── login/
│   │   │   │   └── route.ts     # Admin login endpoint
│   │   │   └── callback/
│   │   │       └── route.ts     # Auth callback (disabled - redirects to homepage)
│   │   │
│   │   ├── admin/                # Admin API endpoints
│   │   │   ├── logout/
│   │   │   │   └── route.ts     # Admin logout
│   │   │   ├── users/
│   │   │   │   ├── route.ts     # Users CRUD
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts # User by ID
│   │   │   ├── conferences/
│   │   │   │   ├── route.ts     # Conferences CRUD
│   │   │   │   ├── [id]/
│   │   │   │   │   └── route.ts # Conference by ID
│   │   │   │   └── upload-logo/
│   │   │   │       └── route.ts # Logo upload
│   │   │   ├── payment-history/
│   │   │   │   └── route.ts     # Payment history
│   │   │   ├── payment-reminders/
│   │   │   │   └── route.ts     # Payment reminders
│   │   │   ├── refunds/
│   │   │   │   └── route.ts     # Refund processing
│   │   │   ├── checkin/
│   │   │   │   └── route.ts     # Check-in system
│   │   │   ├── certificates/
│   │   │   │   ├── generate/
│   │   │   │   │   └── route.ts # Generate certificate
│   │   │   │   ├── bulk/
│   │   │   │   │   └── route.ts # Bulk certificate generation
│   │   │   │   └── send-email/
│   │   │   │       └── route.ts # Send certificate email
│   │   │   ├── bulk/
│   │   │   │   └── route.ts     # Bulk operations
│   │   │   ├── backup/
│   │   │   │   └── route.ts     # Data backup
│   │   │   └── invoice-pdf/
│   │   │       └── route.ts     # PDF generation
│   │   │
│   │   ├── conferences/         # Public conference API
│   │   │   └── [slug]/
│   │   │       └── route.ts     # Get conference by slug
│   │   │
│   │   ├── user/                # User API endpoints
│   │   │   └── registrations/
│   │   │       └── route.ts     # User's registrations
│   │   │
│   │   ├── register/             # Registration endpoint
│   │   │   └── route.ts
│   │   │
│   │   ├── abstracts/
│   │   │   └── upload/
│   │   │       └── route.ts     # Abstract file upload
│   │   │
│   │   ├── create-payment-intent/ # Stripe payment intent
│   │   │   └── route.ts
│   │   │
│   │   ├── confirm-payment/      # Payment confirmation
│   │   │   └── route.ts
│   │   │
│   │   ├── stripe-webhook/       # Stripe webhook handler
│   │   │   └── route.ts
│   │   │
│   │   └── contact/              # Contact form endpoint
│   │       └── route.ts
│   │
│   ├── auth/                      # Authentication pages
│   │   ├── admin-login/
│   │   │   └── page.tsx          # Admin login page
│   │   ├── login/
│   │   │   └── page.tsx          # User login page (magic link)
│   │   └── callback/
│   │       └── route.ts          # Auth callback handler
│   │
│   ├── conferences/               # Public conference pages
│   │   └── [slug]/                # Dynamic conference route
│   │       ├── layout.tsx         # Conference layout
│   │       ├── page.tsx           # Conference home page
│   │       ├── register/
│   │       │   └── page.tsx       # Registration page
│   │       └── submit-abstract/
│   │           └── page.tsx       # Abstract submission
│   │
│   ├── register/                  # General registration
│   │   └── page.tsx
│   │
│   ├── submit-abstract/           # General abstract submission
│   │   └── page.tsx
│   │
│   ├── abstracts/                 # Abstracts page
│   │   └── page.tsx
│   │
│   ├── contact/                   # Contact page
│   │   └── page.tsx
│   │
│   ├── success/                   # Success page (after payment)
│   │   └── page.tsx
│   │
│   └── user/                      # User dashboard section
│       └── dashboard/
│           └── page.tsx          # User dashboard
│
├── components/                     # React Components
│   ├── admin/                     # Admin-specific components
│   │   ├── Header.tsx            # Admin header
│   │   ├── Sidebar.tsx           # Admin sidebar navigation
│   │   ├── StatsCard.tsx         # Statistics card component
│   │   ├── Charts.tsx            # Chart components
│   │   └── PermissionGuard.tsx   # RBAC permission guard
│   │
│   ├── conference/                # Conference-specific components
│   │   ├── ConferenceNavigation.tsx
│   │   └── ConferenceFooter.tsx
│   │
│   ├── Navigation.tsx             # Main navigation
│   ├── Footer.tsx                 # Site footer
│   ├── LoadingSpinner.tsx        # Loading spinner
│   ├── RegistrationForm.tsx      # Registration form
│   ├── PaymentForm.tsx           # Payment form
│   ├── PaymentSection.tsx        # Payment section
│   ├── AbstractUploadForm.tsx    # Abstract upload form
│   ├── SuccessMessage.tsx        # Success message component
│   ├── SupportedCards.tsx        # Payment cards display
│   └── ConditionalNavigation.tsx # Conditional nav logic
│
├── contexts/                      # React Contexts
│   ├── AuthContext.tsx           # Authentication context
│   └── ConferenceContext.tsx     # Conference selection context
│
├── hooks/                         # Custom React Hooks
│   ├── useAuth.ts                # Auth hook
│   ├── useConference.ts          # Conference hook
│   ├── usePermissions.ts         # Permissions hook
│   └── useToast.ts               # Toast notifications hook
│
├── lib/                           # Utility Libraries
│   ├── supabase.ts               # Supabase client setup
│   ├── auth.ts                   # Authentication helpers
│   ├── auth-utils.ts             # Authentication utilities
│   ├── stripe.ts                 # Stripe integration
│   ├── email.ts                  # Email service
│   ├── logger.ts                 # Logging utility (Winston)
│   ├── storage.ts                # Storage utilities
│   └── user-activity.ts          # User activity logging
│
├── utils/                         # General Utilities
│   ├── formatters.ts             # Data formatting utilities
│   ├── validators.ts             # Validation utilities
│   ├── constants.ts              # Utility constants
│   └── helpers.ts                # Helper functions
│
├── types/                         # TypeScript Type Definitions
│   ├── abstract.ts               # Abstract types
│   ├── conference.ts             # Conference types
│   └── registration.ts           # Registration types
│
├── constants/                     # Application Constants
│   ├── permissions.ts            # Permission constants
│   ├── roles.ts                  # Role constants
│   └── config.ts                 # App configuration
│
├── supabase/                      # Supabase Configuration
│   ├── config.toml               # Supabase config
│   │
│   ├── migrations/               # Database Migrations
│   │   ├── 000_complete_setup.sql
│   │   ├── 001_create_registrations_table.sql
│   │   ├── 002_create_abstracts_table.sql
│   │   ├── 003_create_storage_bucket.sql
│   │   ├── 004_add_registration_fields.sql
│   │   ├── 005_add_payment_fields.sql
│   │   ├── 006_organize_storage_structure.sql
│   │   ├── 007_add_checkin_fields.sql
│   │   ├── 008_add_payment_fields.sql
│   │   ├── 009_add_certificates.sql
│   │   ├── 010_add_conferences_multi_tenant.sql
│   │   ├── 011_create_conference_logos_bucket.sql
│   │   ├── 012_create_contact_inquiries.sql
│   │   ├── 013_create_user_profiles_and_permissions.sql
│   │   └── 014_create_user_activity_log.sql
│   │
│   └── functions/                 # Supabase Edge Functions
│       └── send-confirmation-email/
│           └── index.ts
│
├── public/                        # Static Assets
│   ├── images/                   # Images
│   ├── icons/                    # Icons
│   └── fonts/                    # Custom fonts
│
├── docs/                          # Documentation
│   ├── QUICK_START.md            # Quick start guide
│   ├── SETUP_INSTRUCTIONS.md     # Detailed setup
│   ├── GDE_NACI_SUPABASE_KLJUCEVE.md
│   ├── USER_MANAGEMENT_GUIDE.md  # RBAC guide
│   ├── VERCEL_DEPLOY.md          # Deployment guide
│   └── LOGGING.md                # Logging guide
│
├── logs/                          # Application logs (gitignored)
│
├── CODE_REVIEW.md                # Code review document
├── PROJECT_STRUCTURE.md          # This file
└── README.md                      # Main README
```

## 📂 Directory Descriptions

### `/app` - Next.js App Router
Next.js 14 App Router struktura. Svaki folder predstavlja route segment.

**Key Files:**
- `layout.tsx` - Root layout sa globalnim providers
- `page.tsx` - Home page
- `globals.css` - Globalni Tailwind CSS stilovi

**Subdirectories:**
- `admin/` - Admin dashboard sa RBAC zaštitom
- `api/` - API routes (backend endpoints)
- `auth/` - Authentication pages
- `conferences/` - Public conference pages

### `/components` - React Components
Reusable React komponente organizovane po domenima.

**Structure:**
- `admin/` - Admin-specific komponente
- `conference/` - Conference-specific komponente
- Root level - Shared komponente

### `/contexts` - React Contexts
Globalni state management za:
- Authentication (`AuthContext`)
- Conference selection (`ConferenceContext`)

### `/hooks` - Custom React Hooks
Custom hooks za:
- `useAuth` - Authentication logic
- `useConference` - Conference data fetching
- `usePermissions` - Permission checking
- `useToast` - Toast notifications

### `/lib` - Utility Libraries
Core utility funkcije i integracije:
- `supabase.ts` - Supabase client setup (createServerClient, createAdminClient)
- `auth.ts` - Authentication helpers:
  - `isAuthenticated()` - Check if user is authenticated and active
  - `getCurrentUser()` - Get current authenticated user
- `auth-utils.ts` - Auth utility functions (password hashing, token generation, etc.)
- `stripe.ts` - Stripe integration (createCheckoutSession, etc.)
- `email.ts` - Email service (sendEmail with various email types)
- `logger.ts` - Winston logging utility
- `storage.ts` - Storage utilities (file uploads, Supabase Storage)
- `user-activity.ts` - User activity logging:
  - `logUserActivity()` - Log user actions to database
  - `getIpAddress()` - Extract IP address from request
  - `getUserAgent()` - Extract user agent from request

### `/utils` - General Utilities
General-purpose utility funkcije:
- `formatters.ts` - Data formatting
- `validators.ts` - Validation logic
- `constants.ts` - Utility constants (file limits, pagination, etc.)
- `helpers.ts` - Helper functions

**Napomena:** Za app-wide constants (roles, permissions, config) koristite `/constants` direktorij.

### `/types` - TypeScript Types
Type definitions za:
- Abstracts
- Conferences
- Registrations

### `/constants` - Application Constants
App-wide constants:
- `permissions.ts` - Permission types
- `roles.ts` - User roles
- `config.ts` - Configuration constants

**Napomena:** Ovo su app-wide constants. Za utility constants (file limits, pagination) koristite `/utils/constants.ts`.

### `/supabase` - Supabase Configuration
- `migrations/` - Database migrations (versioned)
- `functions/` - Edge Functions
- `config.toml` - Supabase config

### `/public` - Static Assets
Static files served by Next.js:
- Images
- Icons
- Fonts

### `/docs` - Documentation
Project documentation:
- Setup guides
- Deployment guides
- User management guides


## 🔧 Configuration Files

### Root Level Config Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and npm scripts |
| `tsconfig.json` | TypeScript configuration |
| `next.config.mjs` | Next.js configuration |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `postcss.config.mjs` | PostCSS configuration |
| `vercel.json` | Vercel deployment config |
| `.env.local` | Environment variables (gitignored) |
| `.env.example` | Environment variables template |

## 📝 Naming Conventions

### Files
- **Components**: PascalCase (`RegistrationForm.tsx`)
- **Utilities**: camelCase (`auth-utils.ts`)
- **Types**: camelCase (`registration.ts`)
- **Pages**: `page.tsx` (Next.js convention)
- **API Routes**: `route.ts` (Next.js convention)
- **Layouts**: `layout.tsx` (Next.js convention)

### Directories
- **Routes**: kebab-case (`admin-login/`)
- **Components**: PascalCase (`admin/`, `conference/`)
- **Utils/Lib**: camelCase (`lib/`, `utils/`)

## 🚀 Best Practices

### 1. Component Organization
- Group related components in subdirectories
- Keep components small and focused
- Extract reusable logic to hooks

### 2. API Routes
- One route handler per file (`route.ts`)
- Use proper HTTP methods (GET, POST, PATCH, DELETE)
- Always include authentication/authorization
- Return consistent error responses

### 3. Type Safety
- Define types in `/types` directory
- Avoid `any` types
- Use TypeScript strict mode

### 4. Code Organization
- Keep related code together
- Separate concerns (UI, logic, data)
- Use contexts for global state
- Extract utilities to `/lib` or `/utils`

### 5. Security
- Never expose secrets in code
- Use environment variables
- Validate all inputs
- Implement proper RBAC

## 📦 Dependencies Overview

### Core
- `next` - React framework
- `react` / `react-dom` - UI library
- `typescript` - Type safety

### Backend
- `@supabase/supabase-js` - Database & Auth
- `@supabase/ssr` - Server-side Supabase
- `stripe` - Payment processing

### Frontend
- `@stripe/react-stripe-js` - Stripe React components
- `react-hook-form` - Form handling
- `zod` - Schema validation
- `lucide-react` - Icons

### Utilities
- `winston` - Logging
- `recharts` - Charts
- `jspdf` - PDF generation
- `xlsx` - Excel export

## 🔄 Migration Path

### Phase 1: Current Structure ✅
- Basic structure in place
- Components organized
- API routes functional

### Phase 2: Enhancements ✅
- [x] Create `/hooks` directory
- [x] Create `/utils` directory
- [x] Create `/constants` directory
- [x] Add `.env.example` file

### Phase 3: Testing (Future)
- [ ] Add Jest configuration
- [ ] Add React Testing Library
- [ ] Add E2E testing setup
- [ ] Write initial tests

## 📚 Related Documentation

- [README.md](README.md) - Main project documentation
- [CODE_REVIEW.md](CODE_REVIEW.md) - Code review and improvements
- [docs/QUICK_START.md](docs/QUICK_START.md) - Quick start guide
- [docs/SETUP_INSTRUCTIONS.md](docs/SETUP_INSTRUCTIONS.md) - Setup instructions

---

**Last Updated:** December 2024  
**Maintained by:** Development Team

