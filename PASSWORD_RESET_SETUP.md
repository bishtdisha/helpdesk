# 🔐 Password Reset Feature - Setup Guide

## ✅ Implementation Complete!

The password reset feature has been successfully implemented with:
- ✅ Email-based reset with 15-minute expiration
- ✅ Secure token generation
- ✅ Professional email templates
- ✅ Password strength indicator
- ✅ Complete user flow

---

## 📧 Email Configuration Required

### **Step 1: Update .env File**

Add these variables to your `.env` file:

```env
# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="cssupport@cimconautomation.com"
SMTP_PASSWORD="your-app-password-here"

# App URL (for reset links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### **Step 2: Gmail App Password Setup**

Since you're using `cssupport@cimconautomation.com`, you need to:

1. **Log in to Gmail** with cssupport@cimconautomation.com
2. **Go to Google Account Settings** → Security
3. **Enable 2-Step Verification** (if not already enabled)
4. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Click "Generate"
   - Copy the 16-character password
5. **Add to .env:**
   ```env
   SMTP_PASSWORD="xxxx xxxx xxxx xxxx"
   ```

### **Alternative: Use Custom SMTP Server**

If you have a custom SMTP server:

```env
SMTP_HOST="mail.cimconautomation.com"
SMTP_PORT="587"
SMTP_USER="cssupport@cimconautomation.com"
SMTP_PASSWORD="your-password"
```

---

## 🎯 How It Works

### **User Flow:**

```
1. User clicks "Forgot Password?" on login page
   ↓
2. User enters email address
   ↓
3. System generates secure token (valid for 15 minutes)
   ↓
4. Email sent from cssupport@cimconautomation.com
   ↓
5. User clicks link in email
   ↓
6. User sets new password
   ↓
7. Password updated, all sessions invalidated
   ↓
8. Confirmation email sent
   ↓
9. User redirected to login
```

---

## 📁 Files Created

### **Backend:**
1. `prisma/schema.prisma` - Added PasswordResetToken model
2. `lib/services/email-service.ts` - Email sending service
3. `lib/services/password-reset-service.ts` - Password reset logic
4. `app/api/auth/forgot-password/route.ts` - Request reset API
5. `app/api/auth/validate-reset-token/route.ts` - Validate token API
6. `app/api/auth/reset-password/route.ts` - Reset password API

### **Frontend:**
7. `app/forgot-password/page.tsx` - Forgot password page
8. `app/reset-password/page.tsx` - Reset password page
9. `app/login/page.tsx` - Updated with "Forgot Password?" link

---

## 🔒 Security Features

### **Token Security:**
- ✅ Cryptographically secure random tokens (64 characters)
- ✅ 15-minute expiration
- ✅ Single-use tokens
- ✅ Tokens deleted after use
- ✅ All user sessions invalidated after reset

### **Email Security:**
- ✅ Doesn't reveal if email exists
- ✅ HTTPS reset links
- ✅ Clear expiration warnings
- ✅ Phishing warnings included

### **Password Security:**
- ✅ Minimum 8 characters
- ✅ Password strength indicator
- ✅ Bcrypt hashing
- ✅ Confirmation required

---

## 🧪 Testing the Feature

### **Test Flow:**

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to login page:**
   ```
   http://localhost:3000/login
   ```

3. **Click "Forgot password?"**

4. **Enter a registered email:**
   - Example: `cssupport@cimconautomation.com`

5. **Check email inbox** for reset link

6. **Click the reset link** (valid for 15 minutes)

7. **Set new password** and confirm

8. **Log in with new password**

---

## 📧 Email Templates

### **Password Reset Email:**
- Professional design
- Clear call-to-action button
- Expiration warning (15 minutes)
- Security tips
- Sent from: CS Support - Cimcon Automation

### **Confirmation Email:**
- Success notification
- Security alert if not initiated by user
- Contact information

---

## 🎨 UI Features

### **Forgot Password Page:**
- Clean, professional design
- Email input with validation
- Loading states
- Success message
- Back to login link

### **Reset Password Page:**
- Token validation
- Password strength indicator
- Show/hide password toggle
- Password requirements
- Confirmation field
- Success redirect

### **Login Page:**
- "Forgot password?" link added
- Positioned above login button

---

## 🔧 Maintenance

### **Cleanup Expired Tokens:**

Run this periodically (e.g., daily cron job):

```typescript
import { PasswordResetService } from '@/lib/services/password-reset-service';

// Clean up expired tokens
const deleted = await PasswordResetService.cleanupExpiredTokens();
console.log(`Deleted ${deleted} expired tokens`);
```

---

## 📊 Database Schema

### **New Table: password_reset_tokens**

```sql
CREATE TABLE password_reset_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_token ON password_reset_tokens(token);
CREATE INDEX idx_user_id ON password_reset_tokens(user_id);
```

---

## 🚀 Production Deployment

### **Before Going Live:**

1. **Update .env with production values:**
   ```env
   NEXT_PUBLIC_APP_URL="https://helpdesk.cimconautomation.com"
   SMTP_HOST="your-production-smtp"
   SMTP_USER="cssupport@cimconautomation.com"
   SMTP_PASSWORD="production-password"
   ```

2. **Test email delivery** in production

3. **Set up monitoring** for failed emails

4. **Configure rate limiting** (optional)

5. **Set up cron job** for token cleanup

---

## 🎯 API Endpoints

### **1. Request Password Reset**
```
POST /api/auth/forgot-password
Body: { "email": "user@example.com" }
Response: { "message": "If an account exists..." }
```

### **2. Validate Reset Token**
```
POST /api/auth/validate-reset-token
Body: { "token": "abc123..." }
Response: { "valid": true, "userId": "..." }
```

### **3. Reset Password**
```
POST /api/auth/reset-password
Body: { "token": "abc123...", "password": "newpass" }
Response: { "message": "Password reset successful" }
```

---

## ⚠️ Troubleshooting

### **Emails Not Sending:**
1. Check SMTP credentials in .env
2. Verify Gmail App Password is correct
3. Check spam folder
4. Review server logs for errors

### **Token Expired:**
- Tokens expire after 15 minutes
- User must request a new reset link

### **Invalid Token:**
- Token may have been used already
- Token may have expired
- User should request a new link

---

## 📝 Next Steps (Optional Enhancements)

1. **Rate Limiting** - Limit reset requests per email
2. **CAPTCHA** - Add CAPTCHA to prevent abuse
3. **SMS Verification** - Add 2FA with SMS
4. **Audit Logging** - Log all password reset attempts
5. **Admin Notifications** - Alert admins of suspicious activity

---

## ✅ Feature Complete!

Your password reset system is now fully functional with:
- ✅ 15-minute token expiration
- ✅ Email from cssupport@cimconautomation.com
- ✅ Professional email templates
- ✅ Secure token generation
- ✅ Complete user flow
- ✅ Password strength validation
- ✅ Session invalidation
- ✅ Confirmation emails

**Just configure your SMTP settings in .env and you're ready to go!** 🚀
