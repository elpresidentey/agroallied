# Email Verification Setup Guide

## The Issue
Email verification is not working because it's not enabled in your Supabase project settings.

## Step-by-Step Setup

### 1. Enable Email Verification in Supabase

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project: **aymzjaeuhjglokqakwmw**
3. Go to **Authentication** → **Providers** (in the left sidebar)
4. Click on **Email** to expand the email provider settings
5. Look for **Email Confirmation** section
6. Set:
   - **Enable email confirmations**: Toggle ON ✓
   - **Require email for signup**: Toggle ON ✓
   - **Double confirm changes**: Toggle ON ✓

### 2. Configure Email Templates

1. Go to **Authentication** → **Email Templates** (in the left sidebar)
2. Click on **Confirm signup** template
3. Make sure the confirmation link uses your callback URL
4. The template should contain a link like:
   ```
   {{ .ConfirmationURL }}
   ```
   This URL should redirect to: `http://localhost:3000/auth/callback`

### 3. Verify SMTP Configuration

1. Go to **Authentication** → **SMTP Settings** (optional, but recommended)
2. Either use:
   - **Supabase's default email service** (easiest for testing)
   - **Custom SMTP** (for production - requires Gmail/SendGrid/etc.)

For testing, Supabase's default service is fine.

### 4. Test Email Delivery

1. Go to **Authentication** → **Users**
2. Create a test user manually by clicking "Create new user"
3. Set email and password, make sure "Auto confirm user" is UNCHECKED
4. Check if you receive a confirmation email

### 5. Key Environment Variables

Your `.env.local` already has:
```
NEXT_PUBLIC_SUPABASE_REDIRECT_URL=http://localhost:3000/auth/callback
```

This is correct! When users click the email link, they'll be redirected here.

## What Happens When User Signs Up

1. **User fills signup form** → Name, Email, Password, Role
2. **System creates auth account** without session (email unconfirmed)
3. **Supabase sends verification email** to the user
4. **Email contains link** to: `http://localhost:3000/auth/callback?code=xxx`
5. **User clicks link** → App exchanges code for session
6. **User logged in** → Redirected to profile page

## Testing the Flow

1. Go to http://localhost:3000/signup
2. Fill in:
   - Name: Test User
   - Email: **your.email@gmail.com**
   - Password: TestPass123
   - Role: Buyer
3. Click "Sign Up"
4. You should see: "Check your email to confirm your signup"
5. **Check your email** (sometimes goes to spam!)
6. **Click the confirmation link**
7. Should be redirected to profile page and logged in

## Troubleshooting

### "Check your email to confirm" message but no email received
- Check spam/junk folder
- Check if SMTP is enabled in Supabase
- Verify email address is correct
- Wait 30 seconds for email delivery

### Link expired error
- Email confirmation links expire after 24 hours
- User needs to sign up again if link expired

### "No session found" error at callback page
- Make sure `NEXT_PUBLIC_SUPABASE_REDIRECT_URL` is set correctly
- Verify the confirmation link contains the `code` parameter
- Check browser console for actual error

### Verification seems to work but user can't login
- Confirm email is actually verified in Supabase Users list
- Check if user has verified_at timestamp set
- Clear browser cache/cookies and try again

## For Production

When deploying to production, update:
```
NEXT_PUBLIC_SUPABASE_REDIRECT_URL=https://yourdomain.com/auth/callback
```

And set up professional email delivery (Gmail, SendGrid, etc.) in SMTP Settings.
