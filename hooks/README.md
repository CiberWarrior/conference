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

### `useConference`
Provides access to conference selection context.

```typescript
import { useConference } from '@/hooks/useConference'

function MyComponent() {
  const { selectedConferenceId, setSelectedConferenceId } = useConference()
  // ...
}
```

### `usePermissions`
Provides easy access to user permissions based on current context.

```typescript
import { usePermissions } from '@/hooks/usePermissions'

function MyComponent() {
  const {
    isSuperAdmin,
    canViewRegistrations,
    canManagePayments,
    // ... other permissions
  } = usePermissions()
  // ...
}
```

### `useToast`
Provides toast notification functionality.

```typescript
import { useToast } from '@/hooks/useToast'

function MyComponent() {
  const toast = useToast()
  
  const handleSuccess = () => {
    toast.success('Operation completed!')
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

