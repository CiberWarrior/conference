// Quick script to check if email has registration
// Run with: node scripts/check-registration.js test.admin@example.com
// Make sure to set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local manually
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value
      }
    }
  })
}

const email = process.argv[2] || 'test.admin@example.com'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Supabase environment variables not set!')
  console.error('   Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are in .env.local')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkRegistration() {
  console.log(`\n🔍 Checking registration for: ${email}\n`)
  
  const { data: registration, error } = await supabase
    .from('registrations')
    .select('id, email, first_name, last_name, conference_id, created_at')
    .eq('email', email.toLowerCase().trim())
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!registration) {
    console.log('❌ No registration found for this email')
    console.log('\n📋 This email is likely an ADMIN email.')
    console.log('   Note: User login (magic link) has been removed. Users receive all information via email.')
    console.log('   Admin users should use /auth/admin-login instead.\n')
    return
  }

  console.log('✅ Registration found!')
  console.log('\n📋 Details:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`ID: ${registration.id}`)
  console.log(`Email: ${registration.email}`)
  console.log(`Name: ${registration.first_name} ${registration.last_name || ''}`)
  console.log(`Conference ID: ${registration.conference_id}`)
  console.log(`Created: ${new Date(registration.created_at).toLocaleString()}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
}

checkRegistration().catch(console.error)

