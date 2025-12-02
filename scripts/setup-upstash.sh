#!/bin/bash

# Setup script for Upstash Redis configuration
# This script helps verify and setup Upstash Redis for Rate Limiting & Caching

echo "🚀 Upstash Redis Setup Helper"
echo "=============================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local file..."
  cp .env.example .env.local 2>/dev/null || touch .env.local
  echo "✅ .env.local created"
  echo ""
fi

# Check current configuration
echo "🔍 Checking current configuration..."
echo ""

if grep -q "UPSTASH_REDIS_REST_URL" .env.local; then
  CURRENT_URL=$(grep "UPSTASH_REDIS_REST_URL" .env.local | cut -d '=' -f2)
  if [ -z "$CURRENT_URL" ] || [ "$CURRENT_URL" = "your-upstash-redis-url" ] || [ "$CURRENT_URL" = "" ]; then
    echo "⚠️  UPSTASH_REDIS_REST_URL is not configured"
    CONFIGURED=false
  else
    echo "✅ UPSTASH_REDIS_REST_URL is configured"
    CONFIGURED=true
  fi
else
  echo "⚠️  UPSTASH_REDIS_REST_URL not found in .env.local"
  CONFIGURED=false
fi

if grep -q "UPSTASH_REDIS_REST_TOKEN" .env.local; then
  CURRENT_TOKEN=$(grep "UPSTASH_REDIS_REST_TOKEN" .env.local | cut -d '=' -f2)
  if [ -z "$CURRENT_TOKEN" ] || [ "$CURRENT_TOKEN" = "your-upstash-redis-token" ] || [ "$CURRENT_TOKEN" = "" ]; then
    echo "⚠️  UPSTASH_REDIS_REST_TOKEN is not configured"
    CONFIGURED=false
  else
    echo "✅ UPSTASH_REDIS_REST_TOKEN is configured"
    CONFIGURED=true
  fi
else
  echo "⚠️  UPSTASH_REDIS_REST_TOKEN not found in .env.local"
  CONFIGURED=false
fi

echo ""

if [ "$CONFIGURED" = true ]; then
  echo "✅ Upstash Redis is configured!"
  echo ""
  echo "🧪 To test the configuration, run:"
  echo "   npm run dev"
  echo ""
  echo "   Then try to login 6 times in 15 minutes."
  echo "   The 6th attempt should return a 429 error."
else
  echo "❌ Upstash Redis is NOT configured"
  echo ""
  echo "📋 Setup Instructions:"
  echo ""
  echo "1. Go to https://upstash.com/ and create an account"
  echo "2. Create a new Redis database"
  echo "3. Copy the REST URL and Token"
  echo "4. Add them to .env.local:"
  echo ""
  echo "   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io"
  echo "   UPSTASH_REDIS_REST_TOKEN=your-token-here"
  echo ""
  echo "📚 For detailed instructions, see: docs/UPSTASH_SETUP.md"
  echo ""
  echo "💡 Note: The app will work without Upstash, but rate limiting"
  echo "   and caching will be disabled (fail-open strategy)."
fi

echo ""
echo "=============================="

