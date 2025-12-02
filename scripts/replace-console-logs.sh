#!/bin/bash

# Script to add winston logger import to API routes that need it
# This is a helper script for the logging cleanup

echo "🔍 Finding API routes with console.log..."

# Find all API route files with console.log
files=$(grep -rl "console\.\(log\|error\|warn\|info\|debug\)" app/api --include="*.ts" 2>/dev/null)

if [ -z "$files" ]; then
  echo "✅ No console.log found in API routes"
  exit 0
fi

echo "📝 Found files with console.log:"
echo "$files"
echo ""
echo "Run manual replacements with:"
echo "1. Add: import { log } from '@/lib/logger'"
echo "2. Replace: console.error(...) with log.error(...)"
echo "3. Replace: console.log(...) with log.info(...) or log.debug(...)"
echo "4. Replace: console.warn(...) with log.warn(...)"

