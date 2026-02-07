# 🔐 Admin Access Guide

## How to Access Admin Panel

The admin panel is **not visible** in the public navigation for security reasons. Only authorized administrators can access it using direct URLs.

---

## 🎯 Access Methods

### Method 1: Direct Admin URL (Recommended)
```
https://yourdomain.com/admin
```

- If not logged in, you'll be redirected to the admin login page
- Enter your admin credentials
- Access the full admin dashboard

### Method 2: Admin Login Page
```
https://yourdomain.com/auth/admin-login
```

- Direct access to the admin login form
- Enter your credentials
- Redirected to admin dashboard after successful login

---

## 📖 For Super Admins

### First Time Setup

1. **Bookmark the admin URL** in your browser:
   - Production: `https://yourdomain.com/admin`
   - Development: `http://localhost:3000/admin`

2. **Your credentials:**
   - Email: (provided by system administrator)
   - Password: (set during account creation)

3. **Login process:**
   - Navigate to `/admin`
   - Enter email and password
   - Click "Sign In"
   - You're in! 🎉

---

## 👥 For Conference Organizers (Regular Admins)

If you've been given admin access:

1. You'll receive an **invitation email** with:
   - Admin panel URL
   - Your login credentials
   - Role permissions

2. **Access the admin panel:**
   - Click the link in your email, or
   - Navigate to `https://yourdomain.com/admin`

3. **Login:**
   - Use the email and password provided
   - Change your password after first login (recommended)

---

## 🔒 Security Notes

- **Never share your admin credentials**
- **Use strong passwords** (minimum 8 characters, mix of letters, numbers, symbols)
- **Bookmark the admin URL** - don't rely on public links
- **Log out** when finished, especially on shared computers

---

## 🆘 Troubleshooting

### "Page not found" when accessing /admin
- **Solution:** Make sure you're using the correct domain
- Development: `http://localhost:3000/admin`
- Production: `https://yourdomain.com/admin`

### "Access denied" or "Insufficient permissions"
- **Solution:** Contact the super administrator to verify your role and permissions

### Forgot password?
- Currently: Contact super administrator for password reset
- (Password reset feature coming soon)

---

## 📱 Quick Reference

| URL | Purpose |
|-----|---------|
| `/admin` | Main admin dashboard |
| `/auth/admin-login` | Admin login page |
| `/admin/dashboard` | Dashboard overview |
| `/admin/conferences` | Manage conferences |
| `/admin/participants` | Manage participants |
| `/admin/registrations` | Manage registrations |
| `/admin/users` | Manage admin users |

---

## 🚀 Development vs Production

### Local Development
```
http://localhost:3000/admin
```

### Production (Vercel)
```
https://your-domain.vercel.app/admin
```

Or your custom domain:
```
https://meetflow.com/admin
```

---

## 👨‍💻 For Developers

The admin panel is protected by:

1. **Middleware** (`middleware.ts`):
   - Checks authentication
   - Verifies admin role
   - Redirects unauthorized users

2. **Row Level Security (RLS)**:
   - Database-level permissions
   - Role-based access control

3. **API Route Protection**:
   - All admin API routes verify permissions
   - Admin-only endpoints under `/api/admin/*`

---

## 📞 Support

For admin access issues, contact:
- **Super Administrator**: [your-email@domain.com]
- **Technical Support**: [support@domain.com]

---

*Last updated: January 2026*
