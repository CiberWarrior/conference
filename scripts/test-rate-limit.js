/**
 * Test script for Rate Limiting
 * Run: node scripts/test-rate-limit.js
 */

const https = require('https')
const http = require('http')

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000'
const ENDPOINT = process.env.TEST_ENDPOINT || '/api/auth/login'

console.log('🧪 Testing Rate Limiting')
console.log('========================')
console.log(`URL: ${BASE_URL}${ENDPOINT}`)
console.log('')

// Test data
const testData = {
  email: 'test@example.com',
  password: 'testpassword123',
}

let requestCount = 0
let successCount = 0
let rateLimitedCount = 0
let errorCount = 0

function makeRequest() {
  return new Promise((resolve, reject) => {
    requestCount++

    const url = new URL(BASE_URL + ENDPOINT)
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const client = url.protocol === 'https:' ? https : http

    const req = client.request(url, options, (res) => {
      let data = ''

      res.on('data', (chunk) => {
        data += chunk
      })

      res.on('end', () => {
        const status = res.statusCode
        const headers = res.headers

        if (status === 429) {
          rateLimitedCount++
          console.log(`❌ Request ${requestCount}: Rate Limited (429)`)
          console.log(`   Retry-After: ${headers['retry-after'] || 'N/A'}`)
          console.log(`   X-RateLimit-Remaining: ${headers['x-ratelimit-remaining'] || 'N/A'}`)
          resolve({ status, rateLimited: true })
        } else if (status >= 200 && status < 300) {
          successCount++
          console.log(`✅ Request ${requestCount}: Success (${status})`)
          console.log(`   X-RateLimit-Remaining: ${headers['x-ratelimit-remaining'] || 'N/A'}`)
          resolve({ status, success: true })
        } else {
          errorCount++
          console.log(`⚠️  Request ${requestCount}: Error (${status})`)
          resolve({ status, error: true })
        }
      })
    })

    req.on('error', (error) => {
      errorCount++
      console.error(`❌ Request ${requestCount}: Network Error`, error.message)
      reject(error)
    })

    req.write(JSON.stringify(testData))
    req.end()
  })
}

async function runTests() {
  console.log('Sending 6 requests in quick succession...')
  console.log('(Expected: First 5 succeed, 6th should be rate limited)')
  console.log('')

  const requests = []
  for (let i = 0; i < 6; i++) {
    requests.push(makeRequest())
    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  try {
    await Promise.all(requests)
  } catch (error) {
    console.error('Test error:', error)
  }

  console.log('')
  console.log('📊 Test Results:')
  console.log('========================')
  console.log(`Total Requests: ${requestCount}`)
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Rate Limited: ${rateLimitedCount}`)
  console.log(`⚠️  Errors: ${errorCount}`)
  console.log('')

  if (rateLimitedCount > 0) {
    console.log('✅ Rate limiting is WORKING!')
    console.log('   The 6th request was correctly rate limited.')
  } else {
    console.log('⚠️  Rate limiting may not be configured')
    console.log('   Check:')
    console.log('   1. Is Upstash Redis configured? (run: npm run setup:upstash)')
    console.log('   2. Is the dev server running? (npm run dev)')
    console.log('   3. Check .env.local for UPSTASH_REDIS_REST_URL and TOKEN')
  }

  console.log('')
}

// Run tests
runTests().catch(console.error)

