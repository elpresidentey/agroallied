# 🚀 Quick Supabase Setup

## Step 1: Create Supabase Project
1. Visit: https://supabase.com/dashboard
2. Click "New Project"
3. Fill in:
   - **Name**: `agrolink-farms`
   - **Database Password**: (choose a strong password)
   - **Region**: (select closest to you)
4. Wait 2-3 minutes for setup

## Step 2: Get Your Credentials
After your project is created:

1. Go to **Settings** → **API** in your Supabase dashboard
2. You'll see something like this:

```
Project URL: https://abcdefghijklmnop.supabase.co
API Keys:
  anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  service_role secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Update Your .env.local
Copy your actual values and paste them here:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## What Supabase Credentials Look Like:
- **URL**: Always starts with `https://` and ends with `.supabase.co`
- **Keys**: Always start with `eyJ` (they're JWT tokens)
- **NOT**: The keys you provided (`sb_publishable_` and `sb_secret_`) are from a different service

## Need Help?
If you need help creating a Supabase project or finding your credentials, let me know!