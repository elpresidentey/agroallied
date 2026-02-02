-- AgroLink Farms - Simple Database Setup (Supabase Compatible)
-- Run this in your Supabase SQL Editor

-- Create profiles table (instead of modifying auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create farms table
CREATE TABLE IF NOT EXISTS public.farms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create animals table
CREATE TABLE IF NOT EXISTS public.animals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  breed TEXT NOT NULL,
  age INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  farm_id UUID REFERENCES public.farms(id) NOT NULL,
  seller_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  buyer_id UUID REFERENCES auth.users(id) NOT NULL,
  seller_id UUID REFERENCES auth.users(id) NOT NULL,
  animal_id UUID REFERENCES public.animals(id) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can read farms" ON public.farms;
DROP POLICY IF EXISTS "Owners can manage farms" ON public.farms;
DROP POLICY IF EXISTS "Anyone can read animals" ON public.animals;
DROP POLICY IF EXISTS "Sellers can manage animals" ON public.animals;
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
DROP POLICY IF EXISTS "Buyers can create orders" ON public.orders;

-- Create RLS policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for farms
CREATE POLICY "Anyone can read farms" ON public.farms
  FOR SELECT USING (true);

CREATE POLICY "Owners can manage farms" ON public.farms
  FOR ALL USING (auth.uid() = owner_id);

-- Create RLS policies for animals
CREATE POLICY "Anyone can read animals" ON public.animals
  FOR SELECT USING (true);

CREATE POLICY "Sellers can manage animals" ON public.animals
  FOR ALL USING (auth.uid() = seller_id);

-- Create RLS policies for orders
CREATE POLICY "Users can read own orders" ON public.orders
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Success message
SELECT 'Database setup completed successfully!' as message;