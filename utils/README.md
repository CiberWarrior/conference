# Utility Functions

This directory contains general-purpose utility functions used throughout the application.

## Modules

### `formatters.ts`
Data formatting utilities:
- `formatDate()` - Format dates
- `formatDateTime()` - Format date and time
- `formatCurrency()` - Format currency amounts
- `formatFullName()` - Format full name from parts
- `maskEmail()` - Mask email for privacy
- `formatFileSize()` - Format file sizes
- `truncateText()` - Truncate text with ellipsis

### `validators.ts`
Validation utilities:
- `isValidEmail()` - Validate email format
- `isValidPhone()` - Validate phone number
- `isValidUrl()` - Validate URL format
- `isRequired()` - Check required fields
- `minLength()` / `maxLength()` - Length validation
- `isValidFileType()` - Validate file types
- `isValidFileSize()` - Validate file sizes

### `helpers.ts`
General helper functions:
- `sleep()` - Delay execution
- `debounce()` - Debounce function calls
- `generateId()` - Generate random IDs
- `isEmpty()` - Check if value is empty
- `deepClone()` - Deep clone objects
- `getNestedProperty()` - Safely get nested properties
- `capitalize()` - Capitalize strings
- `objectToQueryString()` - Convert object to query string

### `constants.ts`
Utility-related constants (NOT app-wide constants):
- File upload limits
- Pagination defaults
- Date formats
- Status values (registration, payment, inquiry)
- Export formats

**Note:** For app-wide constants (roles, permissions, app config), see `/constants` directory.

## Usage

```typescript
import { formatDate, formatCurrency } from '@/utils/formatters'
import { isValidEmail } from '@/utils/validators'
import { debounce } from '@/utils/helpers'
```

## Adding New Utilities

When adding new utilities:
1. Place them in the appropriate module or create a new one
2. Add JSDoc comments
3. Export as named exports
4. Update this README

