# Admin API Auth Refactor Summary

## ✅ Što je napravljeno

Refaktorirano **9 ključnih admin API ruta** da koriste centralizirane auth helpere iz `lib/api-auth.ts` i konzistentan error handling s `handleApiError`.

### Refaktorirane rute:

1. ✅ `/api/admin/users` (GET, POST) - Super Admin only
2. ✅ `/api/admin/users/[id]` (GET, PATCH, DELETE) - Super Admin only
3. ✅ `/api/admin/conferences` (GET, POST) - Authenticated users
4. ✅ `/api/admin/conferences/[id]` (GET, PATCH, DELETE) - Conference permissions
5. ✅ `/api/admin/impersonate` (POST, DELETE) - Super Admin impersonation
6. ✅ `/api/admin/account` (GET, PATCH) - Own profile only
7. ✅ `/api/admin/backup` (GET) - Super Admin only
8. ✅ `/api/admin/checkin` (POST, GET) - Conference check-in permission
9. ✅ `/api/admin/participants` (GET) - Super Admin only

## 📋 Preostale rute za refaktor

### High priority (admin operations):
- `/api/admin/participants/[id]` (GET, PATCH) - Super Admin
- `/api/admin/certificates/*` (3 rute) - Certificate generation permission
- `/api/admin/conferences/[id]/pages/*` (3 rute) - Conference edit permission
- `/api/admin/payment-*` (3 rute) - Payment management permission
- `/api/admin/refunds` - Payment management permission
- `/api/admin/tickets/*` (2 rute) - Support ticket management

### Medium priority:
- `/api/admin/bulk` - Bulk operations permission
- `/api/admin/subscription-plans` - Super Admin only
- `/api/admin/conferences/upload-logo` - Conference edit permission
- `/api/admin/conferences/demo` - Super Admin only
- `/api/admin/conferences/[id]/registration-form` - Conference edit permission
- `/api/admin/conferences/[id]/fee-type-usage` - View registrations permission
- `/api/admin/conferences/[id]/hotel-usage` - View registrations permission

## 🎯 Refaktor pattern

### PRIJE (ručna auth provjera):

```typescript
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile || profile.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // ... actual logic ...

  } catch (error) {
    log.error('Error', error, { action: 'some_action' })
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

### NAKON (centralizirani auth):

```typescript
import { requireSuperAdmin } from '@/lib/api-auth'
import { handleApiError } from '@/lib/api-error'

export async function GET(request: NextRequest) {
  try {
    // ✅ Use centralized auth helper
    const { user, profile, supabase } = await requireSuperAdmin()

    // ... actual logic ...

  } catch (error) {
    return handleApiError(error, { action: 'some_action' })
  }
}
```

## 🔑 Auth helperi po use case-u

### 1. **Super Admin only** (user management, backup, etc.)
```typescript
const { user, profile, supabase } = await requireSuperAdmin()
```

### 2. **Any authenticated admin** (view own conferences)
```typescript
const { user, profile, supabase } = await requireAuth()
```

### 3. **Conference-specific permission** (edit, delete, manage)
```typescript
// Check generic conference access
const { user, profile, supabase } = await requireConferencePermission(conferenceId)

// Check specific permission
const { user, profile, supabase } = await requireConferencePermission(
  conferenceId, 
  'can_manage_payments'
)

// Shorthand for edit permission
const { user, profile, supabase } = await requireCanEditConference(conferenceId)
```

### 4. **Impersonation check**
```typescript
const { user, profile, supabase } = await requireCanImpersonate(targetUserId)
```

### 5. **Optional auth** (public endpoints with optional features)
```typescript
const auth = await getOptionalAuth()
if (auth) {
  // User is authenticated, show more data
}
```

## 🎨 Error handling patterns

### PRIJE:
```typescript
if (error) {
  log.error('Database error', error, { action: 'fetch' })
  return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
}

if (!data) {
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}
```

### NAKON:
```typescript
import { ApiError } from '@/lib/api-error'

if (error || !data) {
  throw ApiError.notFound('Resource')
}

// Or for validation
if (!body.email) {
  throw ApiError.validationError('Email is required')
}

// Catch block handles all errors consistently
catch (error) {
  return handleApiError(error, { action: 'fetch', resourceId })
}
```

## 📊 Benefiti refaktora

1. **Konzistentnost** - Ista auth logika u svim rutama
2. **Sigurnost** - Manja šansa za grešku u provjerama
3. **Manje koda** - ~30-40 linija manje po ruti
4. **Lakše održavanje** - Izmjena auth logike na jednom mjestu
5. **Bolji error handling** - Standardizirani error responses
6. **Tipovi** - TypeScript automatski inferira tipove iz auth contexta

## 🚀 Sljedeći koraci

1. Refaktorirati preostale admin API rute prema pattern-u
2. Dodati unit testove za auth helpere
3. Dokumentirati sve dostupne permisije
4. Kreirati middleware za automatsku auth provjeru (opciono)

## 📝 Napomene

- Logout route NE treba posebnu auth provjeru (može biti public)
- Public API routes (npr. `/api/conferences/[slug]`) ne koriste admin auth
- Webhook routes (npr. Stripe) koriste webhook signature authentication, ne session auth
