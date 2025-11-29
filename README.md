# 🎪 MeetFlow - Conference Management Platform

A comprehensive multi-tenant conference management system built with Next.js, Supabase, and TypeScript.

## ✨ Features

### 🔐 Multi-Level Admin System (RBAC)
- **Super Admin** - Full platform access, user management, all conferences
- **Conference Admin** - Limited access to assigned conferences only
- Granular permissions system (8 different permission types)
- Secure authentication with Supabase Auth
- Row Level Security (RLS) for data isolation

### 🎯 Conference Management
- Create and manage multiple conferences
- Conference-specific registration forms
- Abstract submission system
- Payment processing (Stripe integration)
- Check-in system
- Certificate generation

### 👥 User Management
- Create/Edit/Delete conference admin users
- Assign conferences to users
- Set granular permissions per user
- User activity tracking
- Status management (Active/Inactive)

### 📊 Admin Dashboard
- Real-time analytics
- Registration statistics
- Payment tracking
- Abstract management
- Check-in monitoring

### 📧 Lead Generation
- Professional contact form
- Lead tracking and management
- Status workflow (New → Contacted → Qualified → Converted)
- Multi-format export (Excel, CSV, JSON)

### 💳 Payment System
- Stripe payment integration
- Invoice generation (PDF)
- Payment reminders
- Refund processing
- Payment history tracking

## 🚀 Quick Start

See [docs/QUICK_START.md](docs/QUICK_START.md) for setup instructions.

## 📚 Documentation

All documentation is located in the `docs/` folder:

- **[QUICK_START.md](docs/QUICK_START.md)** - Get started quickly
- **[SETUP_INSTRUCTIONS.md](docs/SETUP_INSTRUCTIONS.md)** - Detailed setup guide
- **[GDE_NACI_SUPABASE_KLJUCEVE.md](docs/GDE_NACI_SUPABASE_KLJUCEVE.md)** - Find Supabase keys
- **[USER_MANAGEMENT_GUIDE.md](docs/USER_MANAGEMENT_GUIDE.md)** - RBAC & user management
- **[VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md)** - Deploy to Vercel

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Deployment**: Vercel

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   │   ├── users/         # User management (RBAC)
│   │   ├── conferences/   # Conference management
│   │   ├── registrations/ # Registration management
│   │   ├── payments/      # Payment management
│   │   ├── abstracts/     # Abstract management
│   │   ├── checkin/       # Check-in system
│   │   ├── certificates/  # Certificate generation
│   │   ├── inquiries/     # Lead management
│   │   └── dashboard/     # Admin dashboard
│   ├── auth/              # Authentication pages
│   ├── api/               # API routes
│   ├── conferences/       # Public conference pages
│   └── contact/           # Contact form
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   └── conference/       # Conference-specific components
├── contexts/             # React contexts
│   ├── AuthContext.tsx   # Authentication state
│   └── ConferenceContext.tsx # Conference selection
├── lib/                  # Utility libraries
│   ├── supabase.ts      # Supabase client
│   ├── auth-utils.ts    # Auth helper functions
│   ├── stripe.ts        # Stripe integration
│   └── email.ts         # Email service
├── supabase/            # Supabase configuration
│   └── migrations/      # Database migrations
├── types/               # TypeScript type definitions
└── docs/                # Documentation
```

## 🔐 Security Features

- ✅ Supabase Authentication
- ✅ Row Level Security (RLS) policies
- ✅ Server-side authorization
- ✅ httpOnly cookies for sessions
- ✅ Password hashing
- ✅ Admin Client (SERVICE_ROLE_KEY) isolation
- ✅ CSRF protection
- ✅ Input validation

## 🎨 Key Features Implementation

### Multi-Tenant Architecture
- Each conference is isolated
- Conference Admins see only their assigned conferences
- Super Admins have global access
- RLS policies enforce data isolation

### RBAC System
- **Super Admin**: Full access to everything
- **Conference Admin**: Limited to assigned conferences
- **Permissions**:
  - View Registrations
  - Export Data
  - Manage Payments
  - Manage Abstracts
  - Check-In Participants
  - Generate Certificates
  - Edit Conference Settings
  - Delete Data

### Payment Processing
- Stripe integration
- Secure payment intent creation
- Webhook handling for payment confirmation
- Invoice generation (PDF)
- Payment tracking and history

### Data Export
- Multiple formats (Excel, CSV, JSON, Clipboard)
- Filtered exports
- Backup functionality
- Scheduled exports

## 📊 Database Schema

See `supabase/migrations/` for complete database schema including:
- `conferences` - Conference data
- `registrations` - Participant registrations
- `abstracts` - Abstract submissions
- `user_profiles` - Admin user profiles
- `conference_permissions` - User permissions per conference
- `contact_inquiries` - Lead generation data
- And more...

## 🚀 Deployment

The platform is ready for production deployment on Vercel. See [docs/VERCEL_DEPLOY.md](docs/VERCEL_DEPLOY.md) for instructions.

## 📝 License

Private project - All rights reserved

## 👨‍💻 Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🎉 What's New

**Latest Updates:**
- ✅ Complete RBAC implementation with Super Admin & Conference Admin roles
- ✅ Users Management UI (Create, Edit, Delete users)
- ✅ Granular permission system (8 permission types)
- ✅ Contact form & lead management
- ✅ Dashboard analytics
- ✅ Multi-format data export
- ✅ Session management improvements
- ✅ Major code cleanup and documentation organization

---

**Built with ❤️ using Next.js and Supabase**
