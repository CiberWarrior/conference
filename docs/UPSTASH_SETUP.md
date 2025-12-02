# 🚀 Upstash Redis Setup Guide

**Za:** Rate Limiting & Caching  
**Datum:** December 2, 2025

---

## 📋 Što je Upstash?

**Upstash** je serverless Redis baza podataka koja se koristi za:
- ✅ **Rate Limiting** - ograničavanje broja zahtjeva
- ✅ **Caching** - brže učitavanje podataka
- ✅ **Distributed locking** - koordinacija između servera

**Zašto Upstash?**
- ✅ Besplatno do 10,000 zahtjeva/dan
- ✅ Serverless (bez servera za održavanje)
- ✅ Automatsko skaliranje
- ✅ Globalna distribucija (brzo svugdje)

---

## 🎯 Setup Koraci

### 1. Kreirati Upstash Account

1. Idite na: https://upstash.com/
2. Kliknite **"Sign Up"** (možete koristiti GitHub account)
3. Potvrdite email

### 2. Kreirati Redis Database

1. U Upstash dashboard-u, kliknite **"Create Database"**
2. Odaberite:
   - **Name:** `conference-platform` (ili bilo koji naziv)
   - **Type:** Regional (ili Global - brže ali skuplje)
   - **Region:** Najbliža vašoj lokaciji (npr. `eu-west-1` za EU)
3. Kliknite **"Create"**

### 3. Dobiti Credentials

Nakon kreiranja database-a, vidite:

```
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

**VAŽNO:** Kopirajte ove vrijednosti - trebat će vam!

### 4. Dodati u Environment Variables

#### Development (.env.local)

```bash
# Upstash Redis (Rate Limiting & Caching)
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here
```

#### Production (Vercel)

1. Idite na Vercel Dashboard → Vaš projekat
2. Settings → Environment Variables
3. Dodajte:
   - `UPSTASH_REDIS_REST_URL` = `https://your-db.upstash.io`
   - `UPSTASH_REDIS_REST_TOKEN` = `your-token-here`
4. Kliknite **"Save"**
5. Redeploy aplikaciju

---

## ✅ Verifikacija

### Test Rate Limiting

```bash
# Pokrenite dev server
npm run dev

# Pokušajte login 6 puta u 15 minuta
# 6. pokušaj bi trebao vratiti 429 error
```

### Test Caching

```bash
# Prvi request - cache miss
curl http://localhost:3000/api/conferences/your-slug
# Response: X-Cache: MISS

# Drugi request (unutar 1 sata) - cache hit
curl http://localhost:3000/api/conferences/your-slug
# Response: X-Cache: HIT
```

---

## 💰 Troškovi

### Free Tier

- ✅ **10,000 zahtjeva/dan** - besplatno
- ✅ Dovoljno za development i mali production
- ✅ Nema credit card potrebno

### Paid Tier

- **$0.20 po 100K zahtjeva**
- Za veće projekte
- Automatsko skaliranje

**Primjer:**
- 1,000,000 zahtjeva/mjesec = $2/mjesec
- Vrlo pristupačno!

---

## 🔧 Troubleshooting

### Problem: Rate limiting ne radi

**Rješenje:**
1. Provjerite da su environment variables postavljene
2. Provjerite da su credentials ispravni
3. Provjerite da je Upstash database aktivan

### Problem: Caching ne radi

**Rješenje:**
1. Provjerite da je Redis database kreiran
2. Provjerite credentials
3. Provjerite network connectivity

### Problem: "Rate limit check failed"

**Rješenje:**
- Ako Upstash nije konfigurisan, rate limiting je automatski disabled
- Aplikacija će raditi normalno (fail-open strategy)
- Dodajte Upstash credentials za production

---

## 📚 Dodatni Resursi

- **Upstash Docs:** https://docs.upstash.com/
- **Redis Commands:** https://docs.upstash.com/redis/commands
- **Rate Limiting Guide:** https://docs.upstash.com/redis/ratelimit

---

## 🎯 Next Steps

Nakon setup-a:

1. ✅ Testirati rate limiting (pokušati prekoračiti limit)
2. ✅ Testirati caching (provjeriti X-Cache header)
3. ✅ Monitorirati Upstash dashboard za usage
4. ✅ Setup alerts za prekoračenje free tier-a (opciono)

---

**Pitanja?** Slobodno pitajte! 🚀

