# 📝 Logging System Documentation

Dokumentacija za Winston logging sistem implementiran u projektu.

---

## 🎯 Pregled

Projekat koristi **Winston** logging sistem koji:
- ✅ Maskira osjetljive podatke (email, password, tokens)
- ✅ Različito ponašanje u development vs production
- ✅ Strukturirani JSON logovi za production
- ✅ Colorized console output za development
- ✅ Automatsko rotiranje log fajlova

---

## 📦 Instalacija

Logging sistem je već instaliran:

```bash
npm install winston
```

---

## 🚀 Korištenje

### Import

```typescript
import { log } from '@/lib/logger'
```

### Log Nivoi

#### 1. `log.debug()` - Debug informacije
**Samo u development modu**

```typescript
log.debug('Detailed debug info', {
  userId: user.id,
  action: 'update',
  data: requestBody
})
```

#### 2. `log.info()` - Generalne informacije
**Development i production**

```typescript
log.info('User logged in', {
  userId: user.id,
  email: user.email, // Automatski maskiran!
  role: profile.role
})
```

#### 3. `log.warn()` - Upozorenja
**Development i production**

```typescript
log.warn('Rate limit approaching', {
  userId: user.id,
  requests: 95,
  limit: 100
})
```

#### 4. `log.error()` - Greške
**Development i production**

```typescript
log.error('Database query failed', error, {
  userId: user.id,
  query: 'SELECT * FROM users',
  action: 'fetch_users'
})
```

---

## 🔒 Sigurnost - Maskiranje Osjetljivih Podataka

Logger automatski maskira osjetljive podatke:

### Email Maskiranje

```typescript
// Input:
log.info('User login', { email: 'john.doe@example.com' })

// Output (production):
// "User login" { "email": "j***@example.com" }
```

### Password Maskiranje

```typescript
// Input:
log.debug('Login attempt', { password: 'secret123' })

// Output:
// "Login attempt" { "password": "***" }
```

### Token Maskiranje

```typescript
// Input:
log.info('Session created', { 
  access_token: 'eyJhbGci...',
  refresh_token: 'dGhpc2lz...'
})

// Output:
// "Session created" { "access_token": "***", "refresh_token": "***" }
```

---

## 📁 Log Fajlovi

### Development
- Logovi se prikazuju u **console** sa bojama
- Nema fajlova

### Production
- `logs/error.log` - Samo error logovi
- `logs/combined.log` - Svi logovi (info, warn, error)

**Rotacija:**
- Max veličina: 5MB po fajlu
- Max fajlova: 5 (automatski rotira)

---

## 📊 Log Format

### Development Format

```
2024-12-15 14:30:45 info: User logged in {
  "userId": "abc123",
  "email": "j***@example.com",
  "role": "super_admin"
}
```

### Production Format (JSON)

```json
{
  "level": "info",
  "message": "User logged in",
  "timestamp": "2024-12-15T14:30:45.123Z",
  "service": "conference-platform",
  "environment": "production",
  "userId": "abc123",
  "email": "j***@example.com",
  "role": "super_admin"
}
```

---

## 🔄 Migracija sa console.log

### Prije (❌ Loše)

```typescript
console.log('📝 Updating conference:', conferenceId)
console.log('📝 Update data:', body)  // Može sadržavati osjetljive podatke!
console.error('❌ Error:', error)
```

### Poslije (✅ Dobro)

```typescript
log.info('Updating conference', {
  conferenceId: conferenceId,
  userId: user.id
})

log.debug('Update data', { data: body })  // Samo u development

log.error('Update failed', error, {
  conferenceId: conferenceId,
  action: 'update'
})
```

---

## 📋 Best Practices

### 1. Koristi pravi log nivo

```typescript
// ✅ DOBRO
log.debug('Detailed debug info')  // Samo za debugging
log.info('User action completed')  // Normalne operacije
log.warn('Potential issue')        // Upozorenja
log.error('Error occurred', error)  // Greške
```

### 2. Dodaj kontekst

```typescript
// ❌ LOŠE
log.error('Error occurred', error)

// ✅ DOBRO
log.error('Conference update failed', error, {
  conferenceId: params.id,
  userId: user.id,
  action: 'update',
  timestamp: new Date().toISOString()
})
```

### 3. Ne logiraj osjetljive podatke direktno

```typescript
// ❌ LOŠE - Logger će maskirati, ali bolje je eksplicitno
log.info('User data', { password: user.password })

// ✅ DOBRO - Logger automatski maskira
log.info('User data', { 
  userId: user.id,
  email: user.email,  // Automatski maskiran
  role: user.role
})
```

### 4. Koristi error objekat za greške

```typescript
// ✅ DOBRO
try {
  await updateConference()
} catch (error) {
  log.error('Update failed', error, {
    conferenceId: params.id
  })
}
```

---

## 🔍 Monitoring i Debugging

### Development

U development modu, svi logovi se prikazuju u terminalu sa bojama:

```bash
npm run dev
```

Vidjet ćeš:
- 🟢 **Green** - info logovi
- 🟡 **Yellow** - warn logovi
- 🔴 **Red** - error logovi

### Production

U production modu, logovi se spremaju u fajlove:

```bash
# Pregled error logova
tail -f logs/error.log

# Pregled svih logova
tail -f logs/combined.log

# Pretraga po ključnoj riječi
grep "User logged in" logs/combined.log
```

---

## 🚀 Integracija sa External Servisima

### Sentry Integration (Opcijsko - za buduću integraciju)

Ako želiš dodati Sentry za error tracking u production-u:

1. Instaliraj Sentry paket: `npm install @sentry/nextjs`
2. Postavi environment varijable u `.env.local`
3. Pokreni Sentry wizard: `npx @sentry/wizard@latest -i nextjs`

Za više informacija, vidi [Sentry Next.js dokumentaciju](https://docs.sentry.io/platforms/javascript/guides/nextjs/).

### LogRocket Integration (Opcijsko)

```typescript
// lib/logger.ts
import LogRocket from 'logrocket'

// U error handler-u:
log.error('Error occurred', error, meta)
LogRocket.captureException(error)
```

---

## 📊 Statistika

- **Total console.log poziva:** ~195 (zamijenjeno sa log.*)
- **Kritične rute:** ✅ Zamijenjeno
- **Middleware:** ✅ Zamijenjeno
- **Auth routes:** ✅ Zamijenjeno

---

## ✅ Checklist

- [x] Winston instaliran
- [x] Logger utility kreiran (`lib/logger.ts`)
- [x] Maskiranje osjetljivih podataka implementirano
- [x] Development/Production konfiguracija
- [x] Log fajlovi u .gitignore
- [x] Kritične API rute migrirane
- [x] Middleware migriran
- [x] Auth routes migrirane

---

## 🔗 Reference

- [Winston Documentation](https://github.com/winstonjs/winston)
- [Winston Transports](https://github.com/winstonjs/winston/blob/master/docs/transports.md)
- [Logging Best Practices](https://www.datadoghq.com/blog/node-logging-best-practices/)

---

**Napomena:** Logging sistem je spreman za production. Preporučujemo dodatnu integraciju sa monitoring servisima (Sentry, LogRocket) za production environment.

