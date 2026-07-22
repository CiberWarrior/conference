# Utility Functions

This directory contains general-purpose utility functions used throughout the application.

## Modules

### `toast.ts`
Toast notifications:
- `showSuccess()` / `showError()` / `showInfo()` - User feedback messages

### `pricing.ts`
Pricing and VAT helpers:
- `getEffectiveVAT()` - Resolve VAT percentage (conference override or organizer default)

### `sanitize-html.ts`
HTML sanitization for CMS/rich-text content before rendering.

**Note:** For app-wide constants (roles, permissions, app config), see `/constants` directory.

## Usage

```typescript
import { showSuccess, showError } from '@/utils/toast'
import { getEffectiveVAT } from '@/utils/pricing'
```

## Adding New Utilities

When adding new utilities:
1. Place them in the appropriate module or create a new one
2. Add JSDoc comments
3. Export as named exports
4. Update this README
