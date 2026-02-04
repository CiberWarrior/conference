# Error Boundaries Documentation

## Overview

Error Boundaries su React komponente koje hvataju JavaScript greške bilo gdje u child komponentama i prikazuju fallback UI umjesto da padne cijela aplikacija.

## Implementirane Error Boundary komponente

### 1. **ErrorBoundary** (Base Component)
📁 `components/ErrorBoundary.tsx`

**Glavna Error Boundary komponenta** koja služi kao osnova za sve druge.

#### Features:
- ✅ Hvata sve JavaScript greške u child komponentama
- ✅ Prikazuje user-friendly error screen
- ✅ **Development mode**: Prikazuje detaljne error informacije (stack trace, component stack)
- ✅ **Production mode**: Prikazuje jednostavan error screen
- ✅ "Try Again" i "Go to Homepage" akcije
- ✅ Collapsible error details (show/hide)

#### Korištenje:
```tsx
import ErrorBoundary from '@/components/ErrorBoundary'

<ErrorBoundary
  fallback={<CustomErrorUI />}  // Optional custom fallback
  onError={(error, errorInfo) => {
    // Custom error handler (e.g., log to Sentry)
    logErrorToService(error, errorInfo)
  }}
  showDetails={false}  // Show error details in production
>
  <YourComponent />
</ErrorBoundary>
```

---

### 2. **AdminErrorBoundary**
📁 `components/admin/AdminErrorBoundary.tsx`

**Admin-specifična Error Boundary** optimizovana za admin panel.

#### Features:
- ✅ Compact error UI koja ne prekida cijeli layout
- ✅ "Back to Dashboard" akcija
- ✅ Section-aware error messages (npr. "Error in Settings")
- ✅ Automatsko logovanje grešaka (TODO: Sentry integracija)

#### Korištenje:
```tsx
import AdminErrorBoundary from '@/components/admin/AdminErrorBoundary'

<AdminErrorBoundary section="Settings">
  <SettingsPage />
</AdminErrorBoundary>
```

#### **Već integrisano u:**
- ✅ **Admin Layout** (`app/admin/layout.tsx`)
  - Hvata sve greške u admin panelu
  - Omogućava da ostatak aplikacije funkcioniše

---

### 3. **ChartErrorBoundary**
📁 `components/ChartErrorBoundary.tsx`

**Chart-specifična Error Boundary** za grafikone i vizualizacije.

#### Features:
- ✅ Compact fallback UI koji se uklapa u dashboard layout
- ✅ Prikazuje chart name (ako je proslijeđen)
- ✅ "Retry" akcija koja refreshuje stranicu
- ✅ Ne prekida prikazivanje drugih chartova

#### Korištenje:
```tsx
import ChartErrorBoundary from '@/components/ChartErrorBoundary'

<ChartErrorBoundary chartName="Registrations by Day">
  <RegistrationsByDayChart data={chartData} />
</ChartErrorBoundary>
```

#### **Već integrisano u:**
- ✅ **Dashboard Charts** (`app/admin/dashboard/page.tsx`)
  - Registrations by Day Chart
  - Payment Status Chart
  - Revenue by Period Chart
  - Registrations by Type Chart
  - Check-in Analytics Chart

---

## Integracija u Aplikaciju

### ✅ **Admin Panel** (Integrirano)
```tsx
// app/admin/layout.tsx
<AdminErrorBoundary section="Admin Panel">
  <div className="min-h-screen bg-gray-50">
    {/* Admin layout content */}
  </div>
</AdminErrorBoundary>
```

### ✅ **Dashboard Charts** (Integrirano)
```tsx
// app/admin/dashboard/page.tsx
{chartData.registrationsByDay.length > 0 && (
  <ChartErrorBoundary chartName="Registrations by Day">
    <RegistrationsByDayChart data={chartData.registrationsByDay} />
  </ChartErrorBoundary>
)}
```

---

## Best Practices

### 1. **Granularnost**
- ❌ **Izbjegavaj**: Wrapping cijele aplikacije u jedan Error Boundary
- ✅ **Preporučeno**: Wrapping specifičnih sekcija (charts, forms, modals)

**Zašto?** Ako jedna sekcija padne, ostatak aplikacije i dalje radi.

### 2. **Gdje dodati Error Boundaries?**
- ✅ **Layouts** - Hvata greške na nivou cijelog layout-a
- ✅ **Individual Charts** - Omogućava drugim chartovima da rade
- ✅ **Complex Forms** - Sprečava pad cijele forme ako jedan input faila
- ✅ **Third-party Components** - Zaštita od grešaka u eksternim bibliotekama
- ✅ **Lazy-loaded Components** - Hvata greške pri dinamičkom učitavanju

### 3. **Error Logging**
```tsx
const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]:', error, errorInfo)
  }

  // TODO: Send to error tracking service
  // Sentry.captureException(error, {
  //   contexts: { react: { componentStack: errorInfo.componentStack } }
  // })
}

<ErrorBoundary onError={handleError}>
  <YourComponent />
</ErrorBoundary>
```

---

## Sljedeći koraci (TODO)

### 🔄 **Integracija sa Sentry**
```bash
npm install @sentry/nextjs
```

```tsx
import * as Sentry from '@sentry/nextjs'

const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
  })
}
```

### 📊 **Dodatne Error Boundaries**
- [ ] **FormErrorBoundary** - Za forme
- [ ] **ModalErrorBoundary** - Za modale
- [ ] **TableErrorBoundary** - Za velike tabele
- [ ] **ParticipantErrorBoundary** - Za participant portal

### 🧪 **Testiranje**
Dodati unit testove za Error Boundaries:
```tsx
// __tests__/components/ErrorBoundary.test.tsx
describe('ErrorBoundary', () => {
  it('should catch errors and display fallback UI', () => {
    // Test implementation
  })
})
```

---

## Primjer: Dodavanje Error Boundary u novu komponentu

```tsx
// pages/your-page.tsx
import AdminErrorBoundary from '@/components/admin/AdminErrorBoundary'

export default function YourPage() {
  return (
    <AdminErrorBoundary section="Your Page">
      <div>
        {/* Your component that might throw errors */}
        <ComplexComponent />
      </div>
    </AdminErrorBoundary>
  )
}
```

---

## Debugging

### Kako testirati Error Boundary?

1. **Kreirati Test Error Component**:
```tsx
const ErrorComponent = () => {
  throw new Error('Test error!')
  return <div>This won't render</div>
}
```

2. **Wrap u Error Boundary**:
```tsx
<ErrorBoundary>
  <ErrorComponent />
</ErrorBoundary>
```

3. **Provjeriti da se prikazuje fallback UI**

---

## Zaključak

✅ **Error Boundaries su implementirani** i štite aplikaciju od pada
✅ **Admin panel je zaštićen** na layout nivou
✅ **Charts su zaštićeni** pojedinačno

**Rezultat:**
- Bolja stabilnost aplikacije
- Bolji user experience (ne vide white screen)
- Lakši debugging (detaljne informacije u dev mode)

---

## Kontakt

Za pitanja ili probleme vezane za Error Boundaries, provjerite:
- React dokumentaciju: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
- Sentry dokumentaciju: https://docs.sentry.io/platforms/javascript/guides/react/
