# 🧪 Testing Guide - Local Server

**Datum:** December 2, 2025

---

## 🚀 Quick Start

### 1. Pokrenuti Dev Server

```bash
npm run dev
```

Server će se pokrenuti na: `http://localhost:3000`

---

## ✅ Test Checklist

### 1. Basic Functionality

#### A. Provjeriti da server radi

```bash
# Otvoriti u browseru:
http://localhost:3000

# Ili u terminalu:
curl http://localhost:3000
```

**Očekivano:** Stranica se učitava bez grešaka

#### B. Provjeriti toast notifikacije

1. Otvoriti bilo koju admin stranicu
2. Izvršiti akciju (npr. save, delete)
3. Provjeriti da se pojavljuju toast notifikacije (ne alert dijalog)

**Očekivano:** Lijepe toast notifikacije umjesto alert() dijaloga

---

### 2. Rate Limiting Tests

#### A. Provjeriti konfiguraciju

```bash
npm run setup:upstash
```

**Očekivano:**
- Ako Upstash nije konfigurisan: ⚠️ Warning (OK - aplikacija radi bez rate limitinga)
- Ako je konfigurisan: ✅ Success

#### B. Testirati login rate limiting

**Bez Upstash (fail-open):**
```bash
# Test script
npm run test:rate-limit

# Ili ručno:
# Pokušati login 6 puta u 15 minuta
# Očekivano: Svi zahtjevi prolaze (rate limiting disabled)
```

**Sa Upstash:**
```bash
# Test script
npm run test:rate-limit

# Očekivano:
# ✅ Request 1-5: Success
# ❌ Request 6: Rate Limited (429)
```

#### C. Testirati registration rate limiting

1. Otvoriti: `http://localhost:3000/conferences/[slug]/register`
2. Ispuniti formu i poslati 4 puta u 1 sat
3. Provjeriti da 4. zahtjev vraća error

**Očekivano (sa Upstash):**
- Prva 3 zahtjeva: ✅ Success
- 4. zahtjev: ❌ Rate Limited

**Napomena:** Magic link login je uklonjen. Korisnici konferencija ne trebaju dashboard pristup - sve informacije se šalju na email.

---

### 3. Caching Tests

#### A. Testirati conference caching

```bash
# Prvi request (cache miss)
curl -I http://localhost:3000/api/conferences/your-slug
# Provjeriti header: X-Cache: MISS

# Drugi request (unutar 1 sata - cache hit)
curl -I http://localhost:3000/api/conferences/your-slug
# Provjeriti header: X-Cache: HIT
```

**Očekivano (sa Upstash):**
- Prvi: `X-Cache: MISS`
- Drugi: `X-Cache: HIT`

**Bez Upstash:**
- Oba: `X-Cache: MISS` (caching disabled)

---

### 4. Database Performance Tests

#### A. Provjeriti da su indexi kreirani

1. Supabase Dashboard → SQL Editor
2. Pokrenuti:
```sql
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('registrations', 'abstracts', 'conferences', 'user_profiles')
ORDER BY tablename, indexname;
```

**Očekivano:** Vidite nove indexe (npr. `idx_registrations_conference_created`)

#### B. Testirati dashboard performance

1. Otvoriti: `http://localhost:3000/admin/dashboard`
2. Provjeriti vrijeme učitavanja

**Očekivano:**
- Sa indexima: < 1 sekunda
- Bez indexa: 3-5 sekundi

---

## 🐛 Troubleshooting

### Problem: Server se ne pokreće

**Rješenje:**
```bash
# Provjeriti da li port 3000 je zauzet
lsof -ti:3000 | xargs kill -9

# Pokrenuti ponovo
npm run dev
```

### Problem: "Module not found" greške

**Rješenje:**
```bash
# Reinstalirati dependencies
rm -rf node_modules package-lock.json
npm install
```

### Problem: Rate limiting ne radi

**Rješenje:**
1. Provjeriti `.env.local` za Upstash credentials
2. Ako nema, to je OK - aplikacija radi bez rate limitinga
3. Ako želite testirati, setup Upstash (vidi `QUICK_SETUP_GUIDE.md`)

### Problem: Caching ne radi

**Rješenje:**
1. Provjeriti `.env.local` za Upstash credentials
2. Ako nema, caching je disabled (to je OK)
3. Ako želite testirati, setup Upstash

### Problem: Database migration ne radi

**Rješenje:**
1. Provjeriti da ste u pravom Supabase projektu
2. Provjeriti SQL sintaksu
3. Pokrenuti migraciju ručno u Supabase Dashboard

---

## 📊 Expected Results

### Sa Upstash Konfigurisanim

| Test | Očekivano |
|------|-----------|
| Rate Limiting | ✅ Radi (6. login pokušaj = 429) |
| Caching | ✅ Radi (X-Cache: HIT na 2. request) |
| Performance | ✅ Brže (cache hit) |

### Bez Upstash (Fail-Open)

| Test | Očekivano |
|------|-----------|
| Rate Limiting | ⚠️ Disabled (svi zahtjevi prolaze) |
| Caching | ⚠️ Disabled (uvijek cache miss) |
| Performance | ✅ Normalno (kao prije) |

**Oba scenarija su OK!** Aplikacija radi u oba slučaja.

---

## 🎯 Quick Test Commands

```bash
# 1. Provjeriti server status
curl http://localhost:3000

# 2. Provjeriti rate limiting config
npm run setup:upstash

# 3. Testirati rate limiting
npm run test:rate-limit

# 4. Testirati caching
curl -I http://localhost:3000/api/conferences/your-slug | grep X-Cache

# 5. Provjeriti toast notifikacije
# Otvoriti browser i testirati admin akcije
```

---

## ✅ Success Criteria

Aplikacija je uspješno testirana ako:

- ✅ Server se pokreće bez grešaka
- ✅ Toast notifikacije rade (nema alert() dijaloga)
- ✅ Rate limiting radi (ako je Upstash konfigurisan)
- ✅ Caching radi (ako je Upstash konfigurisan)
- ✅ Dashboard se učitava brzo (< 2 sekunde)
- ✅ Nema console errors u browseru

---

**Sretno testiranje!** 🚀




