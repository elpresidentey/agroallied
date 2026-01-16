# Email Verification Troubleshooting & Diagnostics

## Quick Diagnostics

### 1. Check if Supabase is Actually Sending Emails

**In Supabase Dashboard:**
1. Go to **Authentication** → **Users**
2. Look for the test user you created during signup
3. Check their **Email Confirmed** status
   - ✅ If it says "Confirmed" → Email was confirmed
   - ❌ If it says "Not confirmed" → Email not confirmed yet

### 2. Check Email Provider Settings

**In Supabase Dashboard:**
1. Go to **Authentication** → **SMTP Settings**
2. Verify you see the default email provider configured
3. If nothing is configured, that's the problem!

**Fix:**
- If using Supabase default: Leave as-is
- If custom SMTP: Configure with Gmail/SendGrid/Resend

### 3. Verify the Email Confirmation is Actually Enabled

1. Go to **Authentication** → **Providers** → **Email**
2. Scroll down to "Email confirmations" section
3. Confirm:
   - ✅ "Enable email confirmations" is **ON**
   - ✅ "Require email for signup" is **ON**
   - ✅ "Auto confirm user" is **OFF**

### 4. Manual User Creation Test

To verify email sending works:
1. Go to **Authentication** → **Users**
2. Click **Create new user** button
3. Enter an email and temporary password
4. **Important:** Leave "Auto confirm user" UNCHECKED
5. Click **Create**
6. Check if you receive a confirmation email to that address

If you don't get an email:
- Check spam folder
- Check if SMTP is properly configured
- Try a different email address (sometimes Outlook/corporate emails have issues)

### 5. Check the Callback URL Configuration

1. Go to **Authentication** → **URL Configuration**
2. Check "Redirect URLs" section
3. Add: `http://localhost:3000/auth/callback`
4. Save

This tells Supabase where to send users after they click the confirmation link.

## Advanced Debugging

### Check Browser Console
1. Open signup page: http://localhost:3000/signup
2. Open DevTools (F12)
3. Go to **Console** tab
4. Sign up again
5. Look for any error messages (red text)
6. Share those errors with me

### Check Network Requests
1. Open DevTools (F12)
2. Go to **Network** tab
3. Sign up again
4. Look for requests to `supabase.co`
5. Click on the signup request
6. Check the response for any errors

### Check Server Logs
1. Terminal should show the Next.js dev server
2. After you sign up, watch for any errors logged
3. Share any red/error messages

## If Still Not Working

**Option 1: Use Supabase Email Service (Recommended for Testing)**
1. Go to SMTP Settings
2. Leave it as default (Supabase manages it)
3. Don't add any custom SMTP

**Option 2: Use a Temporary Email Service for Testing**
- Use: https://mailtrap.io or https://ethereal.email
- Sign up for free
- Get SMTP credentials
- Add to Supabase SMTP Settings
- Emails will be captured in a test inbox

**Option 3: Disable Email Confirmation (Development Only)**
⚠️ **Not recommended for production, but okay for local testing**
1. Go to **Authentication** → **Providers** → **Email**
2. Toggle "Auto confirm user" to **ON**
3. This will auto-confirm users on signup (no email needed)
4. Users can still receive emails for password resets later

## Expected Flow (With Email Confirmation Enabled)

```
1. User signs up
2. Auth account created but NOT confirmed
3. Signup response: { success: true, needsVerification: true }
4. Frontend shows: "Check your email to confirm signup"
5. Supabase sends confirmation email
6. User clicks link
7. Browser redirected to: /auth/callback?code=xxx
8. Page exchanges code for session
9. User logged in
10. Redirected to /profile
```

## What Should Happen at Each Step

- ✅ "Check your email" message appears → signup working
- ✅ Email received within 30 seconds → SMTP working
- ✅ Link in email works → callback page working
- ✅ Logged in after clicking link → session exchange working

**If you're stuck at step 2 (email not received), the problem is SMTP configuration.**
