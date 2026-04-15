# ⚡ Quick Setup Guide - Rate Limiting & Caching

**Vrijeme:** ~10 minuta  
**Težina:** Lako

---

## 🎯 Što Trebate

1. ✅ Upstash Redis account (besplatno)
2. ✅ 5 minuta vremena
3. ✅ Access do Supabase Dashboard

---

## 📋 Korak po Korak

### Korak 1: Kreirati Upstash Account (3 minute)

1. **Idite na:** https://upstash.com/
2. **Kliknite "Sign Up"** (možete koristiti GitHub)
3. **Potvrdite email**

### Korak 2: Kreirati Redis Database (2 minute)

1. U Upstash dashboard-u, kliknite **"Create Database"**
2. Unesite:
   - **Name:** `conference-platform` (ili bilo koji naziv)
   - **Type:** Regional (besplatno)
   - **Region:** `eu-west-1` (ili najbliža vama)
3. **Kliknite "Create"**

### Korak 3: Kopirati Credentials (1 minuta)

Nakon kreiranja, vidite:

```
UPSTASH_REDIS_REST_URL=https://your-db-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxx...
```

**Kopirajte obje vrijednosti!**

### Korak 4: Dodati u .env.local (1 minuta)

```bash
# Otvorite .env.local u editoru
# Dodajte na kraj fajla:

# Upstash Redis (Rate Limiting & Caching)
UPSTASH_REDIS_REST_URL=https://your-db-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxx...
```

**Ili koristite setup helper:**

```bash
npm run setup:upstash
```

### Korak 5: Pokrenuti Database Migration (2 minute)

1. **Idite na:** Supabase Dashboard → SQL Editor
2. **Kopirajte sadržaj:** `supabase/migrations/015_add_performance_indexes.sql`
3. **Paste u SQL Editor**
4. **Kliknite "Run"**

### Korak 6: Testirati (1 minuta)

```bash
# Pokrenuti dev server
npm run dev

# U drugom terminalu, testirati rate limiting:
npm run test:rate-limit
```

**Očekivani rezultat:**
- Prvih 5 zahtjeva: ✅ Success
- 6. zahtjev: ❌ Rate Limited (429)

---

## ✅ Verifikacija

### Provjeriti da je sve konfigurisano:

```bash
npm run setup:upstash
```

**Očekivani output:**
```
✅ UPSTASH_REDIS_REST_URL is configured
✅ UPSTASH_REDIS_REST_TOKEN is configured
✅ Upstash Redis is configured!
```

### Testirati Rate Limiting:

```bash
npm run test:rate-limit
```

**Očekivani output:**
```
✅ Request 1-5: Success
❌ Request 6: Rate Limited (429)
✅ Rate limiting is WORKING!
```

### Testirati Caching:

```bash
# Prvi request
curl http://localhost:3000/api/conferences/your-slug
# Response: X-Cache: MISS

# Drugi request (unutar 1 sata)
curl http://localhost:3000/api/conferences/your-slug
# Response: X-Cache: HIT
```

---

## 🚨 Troubleshooting

### Problem: "Rate limiting may not be configured"

**Rješenje:**
1. Provjerite da su varijable u `.env.local`
2. Provjerite da nema razmaka oko `=`
3. Restart dev server: `npm run dev`

### Problem: "Cache not working"

**Rješenje:**
1. Provjerite Upstash credentials
2. Provjerite da je database aktivan u Upstash dashboard-u
3. Provjerite network connectivity

### Problem: "Database migration failed"

**Rješenje:**
1. Provjerite da ste u pravom Supabase projektu
2. Provjerite da imate admin pristup
3. Provjerite SQL sintaksu

---

## 📚 Dodatna Dokumentacija

- **Detaljno objašnjenje:** `RATE_LIMITING_AND_PERFORMANCE_EXPLAINED.md`
- **Upstash setup:** `docs/UPSTASH_SETUP.md`
- **Implementation summary:** `IMPLEMENTATION_SUMMARY.md`

---

## 🎉 Gotovo!

Nakon setup-a, vaša aplikacija ima:

- ✅ **Rate Limiting** - zaštita od abuse
- ✅ **Caching** - brže učitavanje
- ✅ **Database Optimization** - optimizirani queries

**Status:** ✅ **PRODUCTION READY**

---

**Pitanja?** Slobodno pitajte! 🚀

