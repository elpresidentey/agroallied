-- AgroLink Farms Database Schema Setup
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('buyer', 'seller', 'admin')),
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
  owner_id UUID REFERENCES public.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create animals table
CREATE TABLE IF NOT EXISTS public.animals (
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
CREATE TABLE IF NOT EXISTS public.orders (
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Anyone can read farms" ON public.farms;
DROP POLICY IF EXISTS "Owners can manage farms" ON public.farms;
DROP POLICY IF EXISTS "Anyone can read animals" ON public.animals;
DROP POLICY IF EXISTS "Sellers can manage animals" ON public.animals;
DROP POLICY IF EXISTS "Users can read own orders" ON public.orders;
DROP POLICY IF EXISTS "Buyers can create orders" ON public.orders;

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

-- Drop existing function and trigger if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

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

-- Insert some sample data (optional)
-- Uncomment the lines below if you want sample data

-- INSERT INTO public.users (id, email, name, role, verification_status) VALUES
--   ('550e8400-e29b-41d4-a716-446655440000', 'admin@agrolink.com', 'Admin User', 'admin', 'approved'),
--   ('550e8400-e29b-41d4-a716-446655440001', 'seller@agrolink.com', 'John Farmer', 'seller', 'approved'),
--   ('550e8400-e29b-41d4-a716-446655440002', 'buyer@agrolink.com', 'Jane Buyer', 'buyer', 'approved')
-- ON CONFLICT (id) DO NOTHING;

-- INSERT INTO public.farms (id, name, description, location, owner_id) VALUES
--   ('550e8400-e29b-41d4-a716-446655440010', 'Green Valley Farm', 'Organic livestock farm', 'Texas, USA', '550e8400-e29b-41d4-a716-446655440001')
-- ON CONFLICT (id) DO NOTHING;

-- INSERT INTO public.animals (id, name, type, breed, age, price, description, farm_id, seller_id) VALUES
--   ('550e8400-e29b-41d4-a716-446655440020', 'Bessie', 'Cattle', 'Holstein', 3, 1500.00, 'Healthy dairy cow', '550e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440001')
-- ON CONFLICT (id) DO NOTHING;