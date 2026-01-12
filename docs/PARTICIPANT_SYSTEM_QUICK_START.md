# 🚀 Participant System - Quick Start Guide

## ⚡ Setup u 5 minuta

### KORAK 1: Pokrenite Database Migration

```bash
# Navigate to project root
cd /Users/renchi/Desktop/conference\ platform

# Otvori Supabase Dashboard
# https://supabase.com/dashboard → Your Project → SQL Editor

# Kopiraj i pokrenite cijeli sadržaj iz:
# supabase/migrations/035_create_participant_system.sql
```

**Ili direktno iz terminala:**

```bash
psql -h YOUR_SUPABASE_HOST \
     -U postgres \
     -d postgres \
     -f supabase/migrations/035_create_participant_system.sql
```

### KORAK 2: Update Admin Sidebar (Already Done ✓)

Admin sidebar već ima Participants link u System sekciji.

### KORAK 3: Deploy to Production

```bash
# Build application
npm run build

# Deploy to Vercel (or your hosting)
vercel --prod
```

---

## 🧪 Testing

### Test 1: Participant Signup

1. Go to: `http://localhost:3000/participant/auth/signup`
2. Fill form:
   - Email: `test@participant.com`
   - Password: `testpass123`
   - First Name: `Test`
   - Last Name: `Participant`
3. Click "Create Account"
4. Check email for confirmation link
5. Confirm email
6. Login at: `http://localhost:3000/participant/auth/login`

### Test 2: Registration Flow

1. Go to any conference registration page
2. Fill registration form with email: `test@participant.com`
3. Submit registration
4. Check:
   - ✓ Registration created in `registrations` table
   - ✓ Participant profile created/linked in `participant_profiles`
   - ✓ Link created in `participant_registrations`

### Test 3: Participant Dashboard

1. Login as participant
2. Go to: `http://localhost:3000/participant/dashboard`
3. Should see:
   - ✓ Welcome message
   - ✓ Stats (events, certificates, loyalty)
   - ✓ Upcoming events (if any)
   - ✓ Loyalty status card

### Test 4: Loyalty System

1. Register same participant for multiple events
2. Check loyalty tier updates:
   - 0-2 events = Bronze (0% discount)
   - 3-5 events = Silver (5% discount)
   - 6-10 events = Gold (10% discount)
   - 11+ events = Platinum (15% discount)

### Test 5: Admin Management

1. Login as Super Admin
2. Go to: `http://localhost:3000/admin/participants`
3. Should see:
   - ✓ List of all participants
   - ✓ Stats cards
   - ✓ Search and filter options
4. Click on a participant
5. Should see full details and registration history

---

## 📋 Quick Reference

### Participant URLs

```
Auth:
/participant/auth/login       - Login page
/participant/auth/signup      - Signup page

Dashboard:
/participant/dashboard              - Home
/participant/dashboard/events       - All registrations
/participant/dashboard/events/[id]  - Single registration details
/participant/dashboard/profile      - Edit profile
/participant/dashboard/certificates - Download certificates
```

### Admin URLs

```
/admin/participants       - All participants list
/admin/participants/[id]  - Participant details
```

### API Endpoints

```typescript
// Auth
POST /api/participant/auth/signup
POST /api/participant/auth/login
POST /api/participant/auth/magic-link
POST /api/participant/auth/logout

// Profile
GET  /api/participant/profile
PATCH /api/participant/profile

// Registrations
GET /api/participant/registrations
GET /api/participant/registrations/[id]
POST /api/participant/registrations/[id]/cancel

// Dashboard
GET /api/participant/dashboard

// Loyalty
POST /api/participant/loyalty-check

// Admin
GET /api/admin/participants
GET /api/admin/participants/[id]
```

---

## 🎯 Key Features Summary

### ✅ Participant Features
- Create account (signup or auto-create on registration)
- Login (password or magic link)
- Dashboard with event history
- View upcoming & past events
- Edit profile
- Download certificates
- Cancel registrations
- View loyalty status & benefits

### ✅ Loyalty System
- 4 tiers: Bronze, Silver, Gold, Platinum
- Automatic tier progression
- Discounts: 0%, 5%, 10%, 15%
- Auto-applied on registration
- Points tracking

### ✅ Admin Features
- View all participants
- Search & filter
- Loyalty tier overview
- Registration history per participant
- Stats & analytics

### ✅ Integration
- Auto-create profiles on registration
- Link existing participants by email
- Loyalty discount auto-applied
- Email notifications (TODO)

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Can create participant account
- [ ] Can login (password & magic link)
- [ ] Dashboard loads correctly
- [ ] Registration creates participant profile
- [ ] Participant can view their registrations
- [ ] Loyalty tier updates after registration
- [ ] Admin can view participants list
- [ ] Admin can view participant details
- [ ] Profile editing works
- [ ] Certificate download works (if issued)
- [ ] Registration cancellation works

---

## 🆘 Common Issues

### Issue: Participant can't see their registrations
**Solution:** Check if `participant_registrations` linking record exists. Run:
```sql
SELECT * FROM participant_registrations 
WHERE participant_id = 'PARTICIPANT_ID';
```

### Issue: Loyalty discount not applied
**Solution:** Check participant's `total_events_attended`:
```sql
SELECT email, total_events_attended, loyalty_tier 
FROM participant_profiles 
WHERE email = 'EMAIL';
```

### Issue: Admin can't access participant page
**Solution:** Verify admin has `super_admin` role:
```sql
SELECT role FROM user_profiles WHERE id = 'ADMIN_ID';
```

---

## 📞 Need Help?

1. Check full documentation: `PARTICIPANT_ACCOUNT_SYSTEM.md`
2. Review database migration: `035_create_participant_system.sql`
3. Check logs in `/logs` directory
4. Contact development team

---

**Ready to go! 🎉**
