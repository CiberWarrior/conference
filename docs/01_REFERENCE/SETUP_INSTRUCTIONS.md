# 🚀 Setup Instructions - Contact Inquiry System

## Quick Start Guide

Follow these steps to get the contact inquiry tracking system up and running.

---

## 📋 Prerequisites

- ✅ Next.js project running
- ✅ Supabase account and project
- ✅ Email service configured (`/lib/email.ts`)
- ✅ Admin authentication working

---

## 🔧 Step-by-Step Setup

### **Step 1: Run Database Migration**

Apply the new migration to create the `contact_inquiries` table and views:

#### **Option A: Using Supabase CLI (Recommended)**

```bash
# Navigate to project root
cd /Users/renata/Desktop/Conference\ Platform

# Apply migration
supabase db push
```

#### **Option B: Using SQL Editor in Supabase Dashboard**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase/migrations/012_create_contact_inquiries.sql`
4. Copy the entire contents
5. Paste into SQL Editor
6. Click **Run**

#### **Option C: Using psql Command**

```bash
psql "postgresql://[YOUR_CONNECTION_STRING]" -f supabase/migrations/012_create_contact_inquiries.sql
```

---

### **Step 2: Configure Environment Variables**

Add these to your `.env.local` file:

```bash
# Email Configuration
ADMIN_EMAIL=your-email@domain.com

# App URL (for email links)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# In production: NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Supabase (should already be configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:** Replace `your-email@domain.com` with the actual admin email where you want to receive inquiry notifications.

---

### **Step 3: Verify Email Service**

Check that your email service is configured in `/lib/email.ts`:

```typescript
// Example with SendGrid (adjust based on your setup)
export async function sendEmail({ to, subject, html, text }) {
  // Your email sending logic here
  // Make sure it's properly configured
}
```

**Test it:**

```bash
# Run a simple test (create a test file)
npm run test-email  # or manually test from Node.js
```

---

### **Step 4: Restart Development Server**

```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

---

### **Step 5: Test the System**

#### **1. Test Contact Form Submission:**

1. Open browser: `http://localhost:3000/contact`
2. Fill out the form with test data:
   - Name: Test User
   - Email: test@example.com
   - Organization: Test Company
   - Conference Type: Hybrid
   - Expected Attendees: 101-250
   - Message: This is a test inquiry
3. Click **Send Inquiry**
4. You should see a success message

#### **2. Verify Database Entry:**

Go to Supabase Dashboard → **Table Editor** → `contact_inquiries`

You should see your test entry.

#### **3. Check Email Notifications:**

- **Admin email**: Check `ADMIN_EMAIL` inbox for notification
- **Customer email**: Check `test@example.com` for confirmation

**Note:** Check spam folders if emails don't appear.

#### **4. Test Admin Panel:**

1. Login to admin panel: `http://localhost:3000/auth/admin-login`
2. Navigate to: **Inquiries** (in sidebar under "Sales & Leads")
3. You should see your test inquiry
4. Test actions:
   - Click **View** → See details modal
   - Click **Update** → Change status/priority
   - Test **Export** → Download Excel file

#### **5. Check Dashboard:**

1. Go to: `http://localhost:3000/admin/dashboard`
2. Scroll down to **Sales & Leads** section
3. Verify stats are showing:
   - New Inquiries: 1
   - Total Inquiries: 1
   - Last 7 Days: 1

---

## 🔍 Verification Checklist

Use this checklist to ensure everything is working:

- [ ] Database table `contact_inquiries` created
- [ ] View `contact_inquiry_stats` created
- [ ] Contact form loads at `/contact`
- [ ] Form submission works (no errors)
- [ ] Data saved to database
- [ ] Admin notification email received
- [ ] Customer confirmation email received
- [ ] Inquiry appears in `/admin/inquiries`
- [ ] Can view inquiry details
- [ ] Can update inquiry status
- [ ] Export to Excel works
- [ ] Dashboard shows inquiry stats
- [ ] Sidebar shows "Inquiries" link

---

## 🐛 Common Issues & Solutions

### **Issue 1: Migration Fails**

**Error:** `relation "conferences" does not exist`

**Solution:** Make sure previous migrations ran successfully, especially `010_add_conferences_multi_tenant.sql`.

```bash
# Check existing tables
supabase db list

# If conferences table missing, run migration 010 first
```

---

### **Issue 2: Emails Not Sending**

**Symptoms:** Form submits but no emails received

**Solutions:**

1. **Check email service configuration:**
   ```bash
   # Review /lib/email.ts
   # Verify API keys/credentials
   ```

2. **Check environment variables:**
   ```bash
   # Verify .env.local has correct values
   echo $ADMIN_EMAIL
   ```

3. **Check server logs:**
   ```bash
   # Look for email errors in terminal
   # Check for "Failed to send notification email"
   ```

4. **Test email service separately:**
   ```typescript
   // Create test file: test-email.js
   const { sendEmail } = require('./lib/email')
   
   sendEmail({
     to: 'test@example.com',
     subject: 'Test',
     html: '<p>Test</p>',
     text: 'Test'
   })
   ```

---

### **Issue 3: API Returns 500 Error**

**Error in console:** `POST /api/contact 500 Internal Server Error`

**Solutions:**

1. **Check database connection:**
   ```bash
   # Verify Supabase credentials in .env.local
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

2. **Check RLS policies:**
   - Go to Supabase Dashboard
   - Navigate to **Authentication** → **Policies**
   - Verify `contact_inquiries` has INSERT policy for public

3. **Review server logs:**
   ```bash
   # Terminal should show detailed error
   # Look for database errors or validation failures
   ```

---

### **Issue 4: Inquiries Page Empty**

**Symptoms:** Page loads but shows "No inquiries found"

**Solutions:**

1. **Check if data exists:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT COUNT(*) FROM contact_inquiries;
   ```

2. **Check RLS policies:**
   - Verify SELECT policy exists
   - Verify admin authentication is working

3. **Check browser console:**
   ```javascript
   // Look for API errors
   // Check Network tab for failed requests
   ```

---

### **Issue 5: Stats Not Showing on Dashboard**

**Symptoms:** Dashboard loads but inquiry stats section missing

**Solutions:**

1. **Submit at least one inquiry** - Stats only show when `totalInquiries > 0`

2. **Refresh the stats view:**
   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM contact_inquiry_stats;
   ```

3. **Check view definition:**
   ```sql
   -- Verify view exists
   \dv contact_inquiry_stats
   ```

---

## 🔐 Security Configuration

### **Production Setup:**

Before deploying to production, update these:

1. **Update RLS Policies:**

```sql
-- Replace the admin policies with proper authentication checks
DROP POLICY IF EXISTS "Admin can view all contact inquiries" ON contact_inquiries;

CREATE POLICY "Authenticated admin can view inquiries"
  ON contact_inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.id = auth.uid()
    )
  );

-- Repeat for UPDATE and DELETE policies
```

2. **Add Rate Limiting:**

Consider adding rate limiting to `/api/contact` to prevent spam:

```typescript
// Use a rate limiting library like 'limiter' or 'express-rate-limit'
```

3. **Add CAPTCHA:**

Integrate Google reCAPTCHA or hCaptcha to contact form:

```typescript
// Add CAPTCHA verification before API call
```

4. **Update Email Settings:**

```bash
# Production environment variables
ADMIN_EMAIL=sales@yourdomain.com
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 📊 Monitoring Setup

### **Track Key Metrics:**

1. **Response Time:**
   - Goal: < 24 hours
   - Monitor: `avg_response_time_hours` from stats view

2. **Conversion Rate:**
   - Goal: 15-25% (adjust based on industry)
   - Monitor: `conversion_rate_percent` from stats view

3. **Email Delivery:**
   - Monitor email service dashboard
   - Check bounce rates and spam reports

### **Set Up Alerts:**

Consider setting up alerts for:
- New inquiry received (already done via email)
- Inquiry older than 24h without response
- High-priority inquiry received
- Weekly summary report

---

## 🎉 You're All Set!

If you've completed all steps and verified the checklist, your contact inquiry tracking system is ready to use!

### **Next Steps:**

1. **Customize Email Templates:**
   - Edit email templates in `/app/api/contact/route.ts`
   - Match your brand colors and style

2. **Adjust Priority Rules:**
   - Modify `determinePriority()` function
   - Align with your business priorities

3. **Train Your Team:**
   - Share admin panel URL
   - Demonstrate inquiry management workflow
   - Set response time expectations

4. **Monitor & Optimize:**
   - Review stats weekly
   - Optimize conversion funnel
   - Improve response times

---

## 📞 Need Help?

If you encounter issues not covered here:

1. Check browser console for errors
2. Review server logs in terminal
3. Check Supabase logs in dashboard
4. Review the detailed documentation in `CONTACT_INQUIRY_SYSTEM.md`

---

**Happy tracking! 📈**


