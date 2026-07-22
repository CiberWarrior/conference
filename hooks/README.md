# Custom React Hooks

This directory contains custom React hooks used throughout the application.

## Available Hooks

### `useAuth`
Provides access to authentication state and methods.

```typescript
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, profile, loading, signOut } = useAuth()
  // ...
}
```

Note: most of the app uses the richer `useAuth` from `contexts/AuthContext`
and `useConference` from `contexts/ConferenceContext` directly.

### Toast Notifications
Toast notifications are provided via `utils/toast.ts` (not a hook).

```typescript
import { showSuccess, showError, showInfo } from '@/utils/toast'

function MyComponent() {
  const handleSuccess = () => {
    showSuccess('Operation completed!')
  }
  // ...
}
```

## Adding New Hooks

When adding a new hook:
1. Create a new file in this directory
2. Follow the naming convention: `use[Name].ts`
3. Export the hook as a named export
4. Add documentation comments
5. Update this README
