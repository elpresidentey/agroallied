# 🚀 Supabase Setup Guide for AgroLink Farms

## Current Status
✅ Development server is running at http://localhost:3000  
⚠️ Supabase configuration needed for full functionality

## Quick Setup Steps

### 1. Create Supabase Account & Project
1. Go to [supabase.com](https://supabase.com)
2. Sign up with email or GitHub
3. Click "New Project"
4. Enter project details:
   - **Name**: `agrolink-farms`
   - **Database Password**: Choose a strong password
   - **Region**: Select closest to your location
5. Wait 2-3 minutes for project creation

### 2. Get Your Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these two values:
   - **Project URL** (starts with `https://`)
   - **anon public** key (long string starting with `eyJ`)

### 3. Update Environment Variables
Open the file `agrolink-farms-app/.env.local` and replace the placeholder values:

```env
# Replace these with your actual Supabase values
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

### 4. Setup Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste this SQL:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create users table
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller', 'admin')),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create farms table
CREATE TABLE public.farms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  owner_id UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create animals table
CREATE TABLE public.animals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  breed TEXT,
  age INTEGER,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  farm_id UUID REFERENCES public.farms(id) NOT NULL,
  seller_id UUID REFERENCES public.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES public.users(id) NOT NULL,
  seller_id UUID REFERENCES public.users(id) NOT NULL,
  animal_id UUID REFERENCES public.animals(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Anyone can read farms (public listings)
CREATE POLICY "Anyone can read farms" ON public.farms
  FOR SELECT USING (true);

-- Farm owners can manage their farms
CREATE POLICY "Owners can manage farms" ON public.farms
  FOR ALL USING (auth.uid() = owner_id);

-- Anyone can read available animals
CREATE POLICY "Anyone can read animals" ON public.animals
  FOR SELECT USING (true);

-- Sellers can manage their animals
CREATE POLICY "Sellers can manage animals" ON public.animals
  FOR ALL USING (auth.uid() = seller_id);

-- Users can read their own orders
CREATE POLICY "Users can read own orders" ON public.orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Buyers can create orders
CREATE POLICY "Buyers can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Create function to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

4. Click **Run** to execute the SQL
5. Verify tables are created in **Database** → **Tables**

### 5. Test the Setup
1. Save your `.env.local` file
2. The development server should automatically reload
3. Visit http://localhost:3000
4. Try signing up for a new account
5. Check your Supabase dashboard to see the new user

## 🎉 You're All Set!

Once you've completed these steps, your AgroLink Farms application will have:
- ✅ User authentication (signup, login, logout)
- ✅ Role-based access control (buyer, seller, admin)
- ✅ Email verification
- ✅ Password reset functionality
- ✅ Protected routes
- ✅ Session management
- ✅ Database integration

## Need Help?

If you encounter any issues:
1. Check the browser console for error messages
2. Check the terminal where `npm run dev` is running
3. Verify your Supabase credentials are correct
4. Make sure your Supabase project is active and not paused

## Optional: Email Configuration

For production email sending, you can configure custom SMTP in Supabase:
1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure your email provider (Gmail, SendGrid, etc.)
3. Test email delivery with the verification emails