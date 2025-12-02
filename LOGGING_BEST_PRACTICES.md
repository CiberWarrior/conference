# 🪵 Logging Best Practices - MeetFlow

**Last Updated:** December 2, 2025

---

## 📊 Current Status

### ✅ Completed
- Winston logger configured in `lib/logger.ts`
- Email and sensitive data masking implemented
- Development vs Production mode configured
- Critical API routes migrated to winston logger

### 🔄 In Progress (10/22 API routes migrated)

**Migrated to winston logger:**
- ✅ `/api/create-payment-intent/route.ts`
- ✅ `/api/confirm-payment/route.ts`
- ✅ `/api/admin/conferences/route.ts`
- ✅ `/api/admin/conferences/upload-logo/route.ts`
- ✅ `/api/auth/login/route.ts`
- ✅ `/api/admin/users/route.ts`
- ✅ `/api/admin/users/[id]/route.ts`
- ✅ `/api/stripe-webhook/route.ts`
- ✅ `/api/register/route.ts`
- ✅ `/api/admin/conferences/[id]/route.ts`

**Remaining (use console.log for now - LOW PRIORITY):**
- `/api/auth/magic-link/route.ts` (19 poziva)
- `/api/abstracts/upload/route.ts` (5 poziva)
- `/api/contact/route.ts` (4 poziva)
- ... + 15 drugih

---

## 🎯 Logging Strategy

### When to use which log level

#### `log.error()` - Error level
**Use for:** Errors that require attention

```typescript
try {
  const result = await dangerousOperation()
} catch (error) {
  log.error('Failed to perform operation', error, {
    userId: user.id,
    action: 'operation_name',
  })
  return NextResponse.json({ error: 'Failed' }, { status: 500 })
}
```

#### `log.warn()` - Warning level
**Use for:** Potentially harmful situations

```typescript
if (!user) {
  log.warn('Unauthorized access attempt', {
    path: request.nextUrl.pathname,
    action: 'unauthorized_access',
  })
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

#### `log.info()` - Info level
**Use for:** General information about successful operations

```typescript
log.info('User created successfully', {
  userId: newUser.id,
  email: newUser.email, // Will be automatically masked
  action: 'create_user',
})
```

#### `log.debug()` - Debug level
**Use for:** Detailed debugging information (only in development)

```typescript
log.debug('Processing request', {
  body: requestBody,
  headers: request.headers,
  action: 'process_request',
})
```

---

## 🔒 Security Features

### Automatic Data Masking

Winston logger automatically masks:
- ✅ Email addresses (`user@example.com` → `u***@example.com`)
- ✅ Passwords (any `password` field → `***`)
- ✅ Tokens (`token`, `access_token`, `refresh_token` → `***`)
- ✅ API keys (`apiKey`, `secret` → `***`)
- ✅ Credit card info (`cardNumber`, `cvv` → `***`)

**Example:**

```typescript
log.info('User registered', {
  email: 'john@example.com',      // Logged as: j***@example.com
  password: 'secretpass123',       // Logged as: ***
  token: 'abc123xyz',              // Logged as: ***
})
```

### Stack Traces

- **Development:** Full stack traces included
- **Production:** Stack traces excluded (only error message)

---

## 📂 Log Files (Production Only)

### File Locations

```
logs/
├── error.log      # Only errors (level: error)
└── combined.log   # All logs (level: info+)
```

### File Rotation

- **Max file size:** 5MB
- **Max files:** 5 (oldest deleted automatically)
- **Total storage:** ~25MB per log type

---

## 🎨 Development vs Production

### Development Mode

```typescript
// Output: Colorized console
// Level: debug (all logs)
// Format: Human-readable with colors
// Files: No file logging

[2025-12-02 10:30:15] DEBUG: Fetching conferences {
  "userId": "123",
  "action": "get_conferences"
}
```

### Production Mode

```typescript
// Output: File logging (logs/error.log, logs/combined.log)
// Level: info (no debug logs)
// Format: JSON for log aggregators
// Console: Disabled

{
  "level": "info",
  "message": "Conferences fetched successfully",
  "timestamp": "2025-12-02 10:30:15",
  "userId": "123",
  "count": 5,
  "action": "get_conferences",
  "service": "conference-platform",
  "environment": "production"
}
```

---

## 🚀 Migration Guide

### Before (console.log)

```typescript
export async function POST(request: NextRequest) {
  try {
    console.log('Creating payment intent...')
    // ... code ...
    console.log('Payment intent created:', paymentIntent.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

### After (winston logger)

```typescript
import { log } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    log.debug('Creating payment intent', {
      action: 'create_payment_intent',
    })
    // ... code ...
    log.info('Payment intent created', {
      paymentIntentId: paymentIntent.id,
      action: 'create_payment_intent',
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    log.error('Error creating payment intent', error, {
      action: 'create_payment_intent',
    })
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
```

---

## 📝 Best Practices

### 1. Always include `action` field

```typescript
log.info('Operation completed', {
  action: 'operation_name',  // ✅ Always include this
  userId: user.id,
  // ... other context
})
```

### 2. Include relevant context

```typescript
// ❌ BAD: No context
log.error('Failed to update')

// ✅ GOOD: Full context
log.error('Failed to update conference', error, {
  conferenceId: params.id,
  userId: user.id,
  action: 'update_conference',
})
```

### 3. Use appropriate log levels

```typescript
// ❌ BAD: Everything is error
log.error('User logged in')

// ✅ GOOD: Appropriate levels
log.info('User logged in', { userId: user.id })
log.warn('Invalid login attempt', { email: maskedEmail })
log.error('Database connection failed', error)
```

### 4. Don't log in loops (performance)

```typescript
// ❌ BAD: Logs 1000 times
users.forEach(user => {
  log.info('Processing user', { userId: user.id })
  processUser(user)
})

// ✅ GOOD: Log once
log.info('Processing users batch', { count: users.length })
users.forEach(user => processUser(user))
log.info('Users batch processed', { count: users.length })
```

### 5. Client-side components

```typescript
// For 'use client' components, console.log is OK
// Winston doesn't work in browser

'use client'

export default function MyComponent() {
  const handleClick = () => {
    console.log('Button clicked') // ✅ OK in client components
  }
  // ...
}
```

---

## 🔍 Monitoring & Debugging

### View Logs in Development

```bash
# Start dev server with logs
npm run dev

# You'll see colorized output in terminal
```

### View Logs in Production

```bash
# SSH into server
cd /path/to/app

# View error logs
tail -f logs/error.log

# View all logs
tail -f logs/combined.log

# Search for specific action
grep "create_payment_intent" logs/combined.log
```

### Log Aggregation (Optional)

For production, consider integrating with:
- **Logtail** (https://logtail.com) - Simple, affordable
- **Papertrail** (https://papertrailapp.com) - Popular choice
- **Datadog** (https://datadoghq.com) - Enterprise-grade

**Setup example (Logtail):**

```typescript
// lib/logger.ts
import { Logtail } from '@logtail/node'

const logtail = new Logtail(process.env.LOGTAIL_TOKEN!)

// Add to winston transports
new winston.transports.Stream({
  stream: logtail,
})
```

---

## ⚡ Performance Considerations

### Log Level Impact

| Level | Production | Development | Performance Impact |
|-------|------------|-------------|-------------------|
| `error` | ✅ Always logged | ✅ Always logged | Minimal |
| `warn` | ✅ Always logged | ✅ Always logged | Minimal |
| `info` | ✅ Always logged | ✅ Always logged | Low |
| `debug` | ❌ Not logged | ✅ Always logged | Medium |

### File I/O

- Winston uses async file writes (non-blocking)
- File rotation is automatic (no manual cleanup needed)
- Max 25MB total storage (negligible)

---

## 🧪 Testing Logs

### Test in Development

```bash
# Start dev server
npm run dev

# Trigger actions in browser
# Check terminal for colorized logs
```

### Test in Production (Staging)

```bash
# Build for production
npm run build

# Start production server
NODE_ENV=production npm start

# Check log files
ls -lh logs/
cat logs/combined.log
```

---

## 📚 Additional Resources

- **Winston Docs:** https://github.com/winstonjs/winston
- **Log Levels:** https://github.com/winstonjs/winston#logging-levels
- **Transports:** https://github.com/winstonjs/winston/blob/master/docs/transports.md

---

## 🎯 Action Items

### Priority 1 - Critical (Before Production Launch)

- [x] Winston logger configured
- [x] Critical API routes migrated (payment, auth, conferences)
- [x] Email masking implemented
- [ ] Test logs in staging environment

### Priority 2 - Important (Within 1 month)

- [ ] Migrate remaining API routes to winston
- [ ] Setup log aggregation service (Logtail or Papertrail)
- [ ] Add monitoring alerts for errors
- [ ] Document logging strategy in team wiki

### Priority 3 - Nice to Have

- [ ] Add request ID tracking (correlation ID)
- [ ] Add performance logging (execution time)
- [ ] Add audit trail for sensitive operations
- [ ] Integrate with error tracking (Sentry)

---

**Maintained by:** Development Team  
**Last Review:** December 2, 2025  
**Next Review:** March 2025

