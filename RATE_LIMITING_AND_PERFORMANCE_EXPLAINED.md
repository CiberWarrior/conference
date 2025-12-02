# 🚀 Rate Limiting & Performance - Objašnjenje

**Datum:** December 2, 2025  
**Za:** MeetFlow Conference Platform

---

## 🔒 Što je Rate Limiting?

### Jednostavno Objašnjenje

**Rate Limiting** = Ograničavanje broja zahtjeva koje korisnik može poslati u određenom vremenskom periodu.

**Primjer iz stvarnog života:**
- Kao što bankomat ima limit od 3 pokušaja za PIN kod
- Ili što ne možete poslati 100 emailova u minuti (Gmail limit)

### Zašto je Potrebno?

#### 1. **Zaštita od Abuse (Zlouporabe)**

**Problem bez Rate Limiting:**
```typescript
// Zlonamjerni korisnik može:
// - Poslati 10,000 zahtjeva u sekundi
// - Preopteretiti server
// - Učiniti aplikaciju nedostupnom za druge korisnike
```

**Rješenje sa Rate Limiting:**
```typescript
// Ograničimo na:
// - 10 zahtjeva po minuti za login
// - 100 zahtjeva po minuti za API
// - 1 zahtjev po sekundi za registraciju
```

#### 2. **Zaštita od DDoS Napada**

**DDoS (Distributed Denial of Service):**
- Napadač šalje ogroman broj zahtjeva
- Server se preopterećuje
- Legitimni korisnici ne mogu pristupiti

**Rate Limiting sprječava:**
- Automatski blokira previše zahtjeva
- Zaštiti server od preopterećenja
- Omogući legitimnim korisnicima pristup

#### 3. **Zaštita od Brute Force Napada**

**Brute Force napad:**
```typescript
// Napadač pokušava 1000 različitih lozinki u sekundi
// Rate limiting ograniči na 5 pokušaja po minuti
// Napad postaje neizvediv
```

#### 4. **Kontrola Troškova**

**Bez Rate Limiting:**
- Svaki API poziv košta (Supabase, Stripe, itd.)
- Zlonamjerni korisnik može generirati ogromne račune
- Vaš budžet može biti prekoračen

**Sa Rate Limiting:**
- Ograničite broj zahtjeva
- Kontrolirate troškove
- Zaštiti budžet

---

## 📊 Primjeri Rate Limiting u Vašem Projektu

### Trenutno Stanje (BEZ Rate Limiting)

```typescript
// app/api/auth/login/route.ts
export async function POST(request: NextRequest) {
  // ❌ Nema rate limiting!
  // Bilo ko može poslati 1000 zahtjeva u sekundi
  // Server može biti preopterećen
  // Troškovi mogu biti ogromni
}
```

**Problem:**
- Napadač može poslati 10,000 login zahtjeva
- Svaki zahtjev poziva Supabase (košta novac)
- Server se preopterećuje
- Legitimni korisnici ne mogu pristupiti

### Sa Rate Limiting (RIJEŠENO)

```typescript
// app/api/auth/login/route.ts
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // ✅ Rate limiting aktiviran
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  
  // Provjeri limit: 5 pokušaja po 15 minuta
  const { success, limit, remaining } = await rateLimit.check(ip, {
    limit: 5,
    window: '15m',
    key: 'login'
  })
  
  if (!success) {
    return NextResponse.json(
      { 
        error: 'Too many login attempts. Please try again in 15 minutes.',
        retryAfter: limit
      },
      { status: 429 } // 429 = Too Many Requests
    )
  }
  
  // Nastavi sa login logikom...
}
```

**Rezultat:**
- ✅ Maksimalno 5 pokušaja po 15 minuta
- ✅ Zaštita od brute force napada
- ✅ Kontrolirani troškovi
- ✅ Server zaštićen od preopterećenja

---

## 🎯 Rate Limiting Strategija za MeetFlow

### Preporučeni Limiti

| Endpoint | Limit | Window | Razlog |
|----------|-------|--------|--------|
| **Login** | 5 | 15 min | Zaštita od brute force |
| **Magic Link** | 3 | 1 sat | Spam prevention |
| **Registration** | 3 | 1 sat | Spam prevention |
| **Payment Intent** | 10 | 1 min | Fraud prevention |
| **API Routes (auth)** | 100 | 1 min | Normal usage |
| **API Routes (public)** | 50 | 1 min | Abuse prevention |
| **Abstract Upload** | 5 | 1 min | Storage abuse |

### Implementacija

**Korak 1: Instalirati paket**

```bash
npm install @upstash/ratelimit @upstash/redis
```

**Korak 2: Kreirati rate limiter**

```typescript
// lib/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Rate limiter za login
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 pokušaja u 15 minuta
  analytics: true,
})

// Rate limiter za API
export const apiRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 zahtjeva u minuti
  analytics: true,
})
```

**Korak 3: Koristiti u API routes**

```typescript
// app/api/auth/login/route.ts
import { loginRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Dobij IP adresu
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown'
  
  // Provjeri rate limit
  const { success, limit, remaining, reset } = await loginRateLimit.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { 
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.round((reset - Date.now()) / 1000) // sekunde
      },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.round((reset - Date.now()) / 1000).toString()
        }
      }
    )
  }
  
  // Nastavi sa login logikom...
  // ...
  
  // Vrati rate limit info u response
  return NextResponse.json(
    { success: true, user },
    {
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString()
      }
    }
  )
}
```

---

## ⚡ Što je Performance Optimization?

### Jednostavno Objašnjenje

**Performance Optimization** = Poboljšanje brzine i efikasnosti aplikacije.

**Cilj:**
- Brže učitavanje stranica
- Brži API odgovori
- Manje troškovi (manje server poziva)
- Bolje korisničko iskustvo

### Zašto je Važno?

#### 1. **Korisničko Iskustvo (UX)**

**Sporo učitavanje:**
- Korisnik čeka 5 sekundi za učitavanje
- Frustracija i napuštanje stranice
- Loša reputacija

**Brzo učitavanje:**
- Stranica se učita za < 1 sekundu
- Korisnik zadovoljan
- Više konverzija

#### 2. **SEO (Google Ranking)**

**Google preferira:**
- Brže stranice (bolji ranking)
- Bolje korisničko iskustvo
- Više posjeta

#### 3. **Troškovi**

**Bez optimizacije:**
- Svaki zahtjev poziva bazu podataka
- 1000 korisnika = 1000 database poziva
- Visoki troškovi

**Sa optimizacijom:**
- Cache rezultate
- 1000 korisnika = 1 database poziv (cache)
- Niži troškovi

---

## 🎯 Performance Problemi u Vašem Projektu

### 1. **Database Queries (N+1 Problem)**

**Problem:**

```typescript
// app/admin/registrations/page.tsx
const registrations = await fetchRegistrations()

// Za svaku registraciju, novi query za conference
registrations.forEach(reg => {
  const conference = await fetchConference(reg.conference_id) // ❌ N+1 problem!
  // 100 registracija = 101 queries (1 + 100)
})
```

**Rješenje:**

```typescript
// Jedan query sa JOIN
const { data } = await supabase
  .from('registrations')
  .select(`
    *,
    conferences (*)  // ✅ JOIN u jednom query-ju
  `)
// 100 registracija = 1 query
```

### 2. **Nedostaju Indexi**

**Problem:**

```sql
-- Pretraga po email-u bez indexa
SELECT * FROM registrations WHERE email = 'user@example.com'
-- ❌ Traži kroz sve redove (sporo za velike tablice)
```

**Rješenje:**

```sql
-- Dodaj index
CREATE INDEX idx_registrations_email ON registrations(email);
-- ✅ Brza pretraga (instant)
```

### 3. **Nema Caching-a**

**Problem:**

```typescript
// app/admin/dashboard/page.tsx
// Svaki put kada korisnik otvori dashboard:
const stats = await fetchStats() // ❌ Query baze svaki put
// 1000 korisnika = 1000 queries
```

**Rješenje:**

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

// Cache stats za 5 minuta
export async function getCachedStats() {
  const cached = await redis.get('dashboard:stats')
  
  if (cached) {
    return cached // ✅ Vrati iz cache-a (instant)
  }
  
  // Ako nema u cache-u, fetch iz baze
  const stats = await fetchStats()
  
  // Spremi u cache za 5 minuta
  await redis.setex('dashboard:stats', 300, stats) // 300 sekundi = 5 minuta
  
  return stats
}
```

---

## 📊 Performance Optimizacije za MeetFlow

### 1. **Database Optimization**

#### A. Dodati Missing Indexes

```sql
-- Trenutno imate neke indexe, ali možete dodati:

-- Za pretragu registracija po konferenciji
CREATE INDEX IF NOT EXISTS idx_registrations_conference_created 
ON registrations(conference_id, created_at DESC);

-- Za pretragu po payment statusu
CREATE INDEX IF NOT EXISTS idx_registrations_payment_status 
ON registrations(payment_status) WHERE payment_status = 'pending';

-- Za pretragu po check-in statusu
CREATE INDEX IF NOT EXISTS idx_registrations_checked_in 
ON registrations(checked_in) WHERE checked_in = false;
```

#### B. Optimizirati Queries

**Before:**
```typescript
// 3 odvojena query-ja
const conferences = await supabase.from('conferences').select('*')
const registrations = await supabase.from('registrations').select('*')
const abstracts = await supabase.from('abstracts').select('*')
```

**After:**
```typescript
// 1 query sa JOIN-ovima (ako je moguće)
const { data } = await supabase
  .from('conferences')
  .select(`
    *,
    registrations (*),
    abstracts (*)
  `)
```

### 2. **Caching Strategy**

#### A. Conference Data Caching

```typescript
// lib/cache.ts
export async function getConference(slug: string) {
  const cacheKey = `conference:${slug}`
  
  // Provjeri cache
  const cached = await redis.get(cacheKey)
  if (cached) return cached
  
  // Fetch iz baze
  const conference = await fetchConferenceFromDB(slug)
  
  // Cache za 1 sat (conference se rijetko mijenja)
  await redis.setex(cacheKey, 3600, conference)
  
  return conference
}

// Invalidate cache kada se conference update-uje
export async function invalidateConferenceCache(slug: string) {
  await redis.del(`conference:${slug}`)
}
```

#### B. Dashboard Stats Caching

```typescript
// Cache dashboard stats za 5 minuta
export async function getDashboardStats(conferenceId: string) {
  const cacheKey = `dashboard:stats:${conferenceId}`
  
  const cached = await redis.get(cacheKey)
  if (cached) return cached
  
  const stats = await calculateStats(conferenceId)
  await redis.setex(cacheKey, 300, stats) // 5 minuta
  
  return stats
}
```

### 3. **Connection Pooling**

**Problem:**
- Svaki API poziv kreira novu konekciju sa Supabase
- Sporo i neefikasno

**Rješenje:**
```typescript
// lib/supabase.ts
// Supabase automatski koristi connection pooling
// Ali možete optimizirati:

const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-connection-pool': 'true', // Enable pooling
    },
  },
})
```

### 4. **Image Optimization**

**Problem:**
- Velike slike (logo, itd.) se učitavaju u punoj rezoluciji
- Sporo učitavanje

**Rješenje:**
```typescript
// Koristiti Next.js Image komponentu
import Image from 'next/image'

// Automatski optimizira slike
<Image
  src={conference.logo_url}
  width={200}
  height={200}
  alt="Conference logo"
  loading="lazy" // Lazy loading
/>
```

---

## 📈 Očekivani Rezultati

### Before Optimization

| Metric | Value | Status |
|--------|-------|--------|
| Dashboard load time | 3-5 sekundi | ❌ Sporo |
| API response time | 500-1000ms | ⚠️ OK |
| Database queries | 50+ per page | ❌ Previše |
| Cache hit rate | 0% | ❌ Nema cache |

### After Optimization

| Metric | Value | Status |
|--------|-------|--------|
| Dashboard load time | **< 1 sekunda** | ✅ Brzo |
| API response time | **< 200ms** | ✅ Brzo |
| Database queries | **< 5 per page** | ✅ Optimizirano |
| Cache hit rate | **80%+** | ✅ Dobro |

### Impact

- 🚀 **3-5x brže učitavanje**
- 💰 **50-70% niži troškovi** (manje database poziva)
- 😊 **Bolje korisničko iskustvo**
- 📈 **Više konverzija**

---

## 🛠️ Implementacija Plan

### Week 1: Rate Limiting (3 dana)

**Dan 1: Setup**
- [ ] Instalirati `@upstash/ratelimit` i `@upstash/redis`
- [ ] Kreirati Upstash Redis account (besplatno do 10K zahtjeva/dan)
- [ ] Setup environment variables

**Dan 2: Implementacija**
- [ ] Kreirati `lib/rate-limit.ts`
- [ ] Dodati rate limiting na login endpoint
- [ ] Dodati rate limiting na magic-link endpoint
- [ ] Dodati rate limiting na registration endpoint

**Dan 3: Testiranje**
- [ ] Testirati rate limiting (pokušati prekoračiti limit)
- [ ] Provjeriti error poruke
- [ ] Dokumentirati

### Week 2: Performance (3 dana)

**Dan 1: Database Optimization**
- [ ] Analizirati slow queries
- [ ] Dodati missing indexes
- [ ] Optimizirati N+1 queries

**Dan 2: Caching**
- [ ] Setup Redis caching
- [ ] Cache conference data
- [ ] Cache dashboard stats

**Dan 3: Testing & Monitoring**
- [ ] Testirati performance improvements
- [ ] Setup monitoring (Vercel Analytics)
- [ ] Dokumentirati

---

## 💰 Troškovi

### Rate Limiting (Upstash Redis)

**Free Tier:**
- 10,000 zahtjeva/dan
- Dovoljno za development i mali production

**Paid Tier:**
- $0.20 po 100K zahtjeva
- Za veće projekte

### Performance (Caching)

**Troškovi:**
- Redis caching smanjuje database pozive
- **Ušteda:** 50-70% niži Supabase troškovi
- **ROI:** Caching se isplati već pri malom trafficu

---

## 🎯 Zaključak

### Rate Limiting
- ✅ **Zaštita od abuse i DDoS napada**
- ✅ **Kontrola troškova**
- ✅ **Bolja sigurnost**

### Performance Optimization
- ✅ **Brže učitavanje (3-5x)**
- ✅ **Niži troškovi (50-70%)**
- ✅ **Bolje korisničko iskustvo**

**Preporuka:** Implementirati oboje u Sprint 2 (2 sedmice)

---

**Pitanja?** Slobodno pitajte! 🚀

