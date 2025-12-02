# Constants

This directory contains **application-wide constants** organized by domain.

**Note:** For utility-related constants (file limits, pagination, status values), see `/utils/constants.ts`.

## Modules

### `permissions.ts`
Permission-related constants:
- `PERMISSION_TYPES` - All permission type constants
- `PERMISSION_LABELS` - Human-readable permission labels
- `PermissionType` - TypeScript type for permissions

### `roles.ts`
User role constants:
- `USER_ROLES` - All role constants
- `ROLE_LABELS` - Human-readable role labels
- `ROLE_DESCRIPTIONS` - Role descriptions
- `UserRole` - TypeScript type for roles

### `config.ts`
Application configuration:
- `APP_CONFIG` - App name, description, version
- `API_CONFIG` - API timeout, retry settings
- `UI_CONFIG` - UI-related constants
- `STORAGE_CONFIG` - Storage prefixes

## Usage

```typescript
import { PERMISSION_TYPES, PERMISSION_LABELS } from '@/constants/permissions'
import { USER_ROLES, ROLE_LABELS } from '@/constants/roles'
import { APP_CONFIG } from '@/constants/config'
```

## Adding New Constants

When adding new constants:
1. Create a new file or add to existing appropriate file
2. Use `as const` for type safety
3. Export types if needed
4. Update this README

