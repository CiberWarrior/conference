# 🔧 Rešavanje Problema sa Dashboard-om na Vercel-u

## 🔍 Problemi koje treba proveriti

### 1. Environment Variables na Vercel-u

**Proveri da li su sve environment variables postavljene:**

Idi u Vercel Dashboard → Tvoj projekat → Settings → Environment Variables

**Obavezno postavi:**
```
NEXT_PUBLIC_SUPABASE_URL=https://tvoj-projekat.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tvoj-anon-key
SUPABASE_SERVICE_ROLE_KEY=tvoj-service-role-key
```

**⚠️ VAŽNO:**
- `NEXT_PUBLIC_*` varijable su **public** i vide se u browseru
- `SUPABASE_SERVICE_ROLE_KEY` je **private** i ne sme biti izložen
- Nakon dodavanja varijabli, **redeploy projekat**

### 2. Provera Environment Variables

Dodaj ovo u `app/admin/dashboard/page.tsx` na početak komponente za debug:

```tsx
useEffect(() => {
  console.log('🔍 Environment Check:', {
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 20) + '...',
  })
}, [])
```

### 3. Provera Supabase Konekcije

Dashboard koristi direktne Supabase pozive. Proveri:

1. **Da li Supabase projekat radi?**
   - Idi na Supabase Dashboard
   - Proveri da li je projekat aktivan

2. **Da li su RLS policies ispravne?**
   - Proveri da li `user_profiles` tabela ima pravilne RLS policies
   - Proveri da li `conferences` tabela ima pravilne RLS policies
   - Proveri da li `registrations` tabela ima pravilne RLS policies

### 4. Provera Browser Console

Otvori browser Developer Tools (F12) i proveri:

1. **Console tab** - da li ima error poruka?
2. **Network tab** - da li se API pozivi izvršavaju?
3. **Application tab** - da li su cookies postavljeni?

### 5. Provera Middleware

Middleware proverava autentifikaciju. Proveri:

1. Da li si ulogovan kao admin?
2. Da li tvoj user ima `user_profile` sa `role = 'super_admin'` ili `'conference_admin'`?
3. Da li je tvoj user `active = true`?

---

## 🛠️ Rešenja

### Rešenje 1: Dodaj API Route za Dashboard Stats

Umesto direktnih Supabase poziva, kreiraj API route:

**Kreiraj `app/api/admin/dashboard/stats/route.ts`:**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const profile = await getCurrentUserProfile(supabase)

    if (!profile || (profile.role !== 'super_admin' && profile.role !== 'conference_admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get conference_id from query params
    const { searchParams } = new URL(request.url)
    const conferenceId = searchParams.get('conference_id')

    if (!conferenceId) {
      return NextResponse.json({ error: 'Conference ID required' }, { status: 400 })
    }

    // Check permissions
    if (profile.role === 'conference_admin') {
      // Check if user has access to this conference
      const { data: permission } = await supabase
        .from('conference_permissions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('conference_id', conferenceId)
        .single()

      if (!permission) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Load registrations
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('conference_id', conferenceId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Calculate stats
    const stats = {
      totalRegistrations: registrations?.length || 0,
      paidRegistrations: registrations?.filter(r => r.payment_status === 'paid').length || 0,
      pendingPayments: registrations?.filter(r => r.payment_status === 'pending').length || 0,
      checkedIn: registrations?.filter(r => r.checked_in === true).length || 0,
    }

    return NextResponse.json({ stats, registrations })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard stats' },
      { status: 500 }
    )
  }
}
```

**Zatim u `app/admin/dashboard/page.tsx`, zameni `loadStats` funkciju:**

```typescript
const loadStats = async () => {
  if (!currentConference) {
    setError('No conference selected')
    setLoading(false)
    return
  }

  try {
    setLoading(true)
    setError(null)

    const response = await fetch(
      `/api/admin/dashboard/stats?conference_id=${currentConference.id}`
    )

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to load statistics')
    }

    const data = await response.json()
    
    // Process data...
    setStats({
      totalRegistrations: data.stats.totalRegistrations,
      paidRegistrations: data.stats.paidRegistrations,
      pendingPayments: data.stats.pendingPayments,
      checkedIn: data.stats.checkedIn,
      recentRegistrations: data.registrations?.slice(0, 5) || [],
    })

    // Process chart data...
    // ... (ostali kod za chart data)
  } catch (error) {
    console.error('Error loading stats:', error)
    setError(error instanceof Error ? error.message : 'Failed to load statistics')
  } finally {
    setLoading(false)
  }
}
```

### Rešenje 2: Poboljšaj Error Handling

Dodaj bolji error handling u dashboard:

```typescript
const loadStats = async () => {
  if (!currentConference) {
    setError('No conference selected')
    setLoading(false)
    return
  }

  try {
    setLoading(true)
    setError(null)

    // Check Supabase configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
      throw new Error('Supabase is not configured. Please check environment variables.')
    }

    // Try to get session first
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      throw new Error('Not authenticated. Please log in again.')
    }

    // Rest of the code...
  } catch (error) {
    console.error('Error loading stats:', error)
    setError(error instanceof Error ? error.message : 'Failed to load statistics')
    
    // Log to error tracking service if available
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      // Send to error tracking (Sentry, etc.)
    }
  } finally {
    setLoading(false)
  }
}
```

### Rešenje 3: Dodaj Loading State UI

Poboljšaj loading state da korisnik vidi šta se dešava:

```typescript
if (loading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading dashboard...</p>
        {conferenceLoading && (
          <p className="text-sm text-gray-500 mt-2">Loading conferences...</p>
        )}
      </div>
    </div>
  )
}
```

---

## 📋 Checklist za Debug

- [ ] Environment variables su postavljene na Vercel-u
- [ ] Projekat je redeploy-ovan nakon dodavanja env vars
- [ ] Supabase projekat je aktivan
- [ ] User je ulogovan kao admin
- [ ] User ima `user_profile` sa ispravnom `role`
- [ ] User je `active = true`
- [ ] RLS policies su ispravne
- [ ] Browser console nema error poruke
- [ ] Network tab pokazuje da se pozivi izvršavaju
- [ ] Cookies su postavljeni

---

## 🚨 Najčešći Problemi

### Problem 1: Environment Variables nisu postavljene
**Simptom:** Dashboard se ne učitava, error u konzoli
**Rešenje:** Postavi env vars na Vercel-u i redeploy

### Problem 2: Supabase RLS blokira pristup
**Simptom:** Dashboard se učitava ali nema podataka
**Rešenje:** Proveri RLS policies u Supabase

### Problem 3: User nema admin role
**Simptom:** Redirect na login stranicu
**Rešenje:** Proveri `user_profiles` tabelu, postavi `role` i `active`

### Problem 4: Session expired
**Simptom:** Dashboard se ne učitava, redirect na login
**Rešenje:** Logout i login ponovo

---

## 🔗 Korisni Linkovi

- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase RLS Policies](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

## 💡 Preporuke

1. **Koristi API routes umesto direktnih Supabase poziva** - bolja kontrola i error handling
2. **Dodaj error tracking** (Sentry, LogRocket, itd.)
3. **Dodaj loading states** - korisnik treba da vidi šta se dešava
4. **Loguj sve greške** - lakše debug-ovanje
5. **Testiraj lokalno prvo** - proveri da li radi pre deploy-a

---

**Ako problem i dalje postoji, proveri Vercel logs:**
- Vercel Dashboard → Tvoj projekat → Logs
- Traži error poruke u build ili runtime logovima
