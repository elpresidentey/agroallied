# Quick Fix: Disable Email Confirmation Temporarily

## The Problem
Email service is not configured in your Supabase project, so verification emails aren't being sent.

## Quick Solution (Development Only)

### Step 1: Disable Email Confirmation in Supabase

1. Go to https://app.supabase.com → Your project
2. **Authentication** → **Providers** → **Email**
3. Find the section "Email Confirmations"
4. Toggle **"Auto confirm user"** to **ON** ✓
5. Toggle **"Enable email confirmations"** to **OFF** (optional)
6. Click **Save**

Now users will be automatically confirmed on signup without needing email verification.

### Step 2: Test the Full App Flow

1. Go to http://localhost:3000/signup
2. Sign up with:
   - Name: Test User
   - Email: test@example.com
   - Password: TestPass123
   - Role: Buyer
3. You should be **automatically logged in** ✓
4. Redirected to profile page ✓

### Step 3: Complete User Journey Testing

Now you can test the full app:
1. ✅ Sign up and login working
2. ✅ Browse animals at /animals
3. ✅ Test payment with Paystack
4. ✅ Create seller profiles (later)

## Configure Real Email Later

Once everything else is working, we can:

**Option 1: Enable Supabase Email Service (Recommended)**
- Supabase has a built-in email service
- Go to SMTP Settings and configure it
- No extra cost, automatic setup

**Option 2: Use SendGrid/Resend/Gmail**
- Sign up for free tier
- Get SMTP credentials
- Add to Supabase SMTP Settings
- More reliable for production

**Option 3: Use Mailtrap (Testing)**
- Free service for testing emails
- Capture emails in a test inbox
- Perfect for development

For now, let's disable email requirement so you can test everything else and verify the app works end-to-end.
