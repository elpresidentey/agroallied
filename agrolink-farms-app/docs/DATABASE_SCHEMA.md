# Supabase Database Schema

## Overview

AgroLink Farms database schema with Row Level Security (RLS) for multi-user access control.

## Tables

### 1. users
Stores user account information and roles.

```sql
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL CHECK (role IN ('buyer', 'seller', 'admin')),
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'unverified')),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Admins can read all users
CREATE POLICY "Admins can read all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 2. farms
Stores farm/seller profile information.

```sql
CREATE TABLE IF NOT EXISTS public.farms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  location text NOT NULL,
  verified boolean DEFAULT false,
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('pending', 'approved', 'rejected', 'unverified')),
  certification text,
  rating numeric(3, 2),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read verified farms
CREATE POLICY "Anyone can read verified farms"
  ON public.farms FOR SELECT
  USING (verified = true);

-- Policy: Owners can read and update their own farm
CREATE POLICY "Owners can manage their farm"
  ON public.farms
  USING (owner_id = auth.uid());

-- Policy: Admins can read all farms
CREATE POLICY "Admins can read all farms"
  ON public.farms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 3. animals
Stores animal listings.

```sql
CREATE TABLE IF NOT EXISTS public.animals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id uuid NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('cows', 'fish', 'poultry', 'goats', 'dogs', 'others')),
  breed text NOT NULL,
  age text NOT NULL,
  weight text,
  price numeric(12, 2) NOT NULL,
  currency text DEFAULT 'NGN',
  health_status text NOT NULL DEFAULT 'unknown' CHECK (health_status IN ('healthy', 'vaccinated', 'under_treatment', 'unknown')),
  vaccination_details text,
  images text[] DEFAULT '{}',
  description text,
  available_count integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read animals from verified farms
CREATE POLICY "Anyone can read animals from verified farms"
  ON public.animals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.farms WHERE farms.id = animals.farm_id AND farms.verified = true
    )
  );

-- Policy: Farm owners can manage their animals
CREATE POLICY "Farm owners can manage their animals"
  ON public.animals
  USING (
    EXISTS (
      SELECT 1 FROM public.farms WHERE farms.id = animals.farm_id AND farms.owner_id = auth.uid()
    )
  );

-- Policy: Admins can read all animals
CREATE POLICY "Admins can read all animals"
  ON public.animals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 4. orders
Stores purchase inquiries and orders.

```sql
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  animal_id uuid NOT NULL REFERENCES public.animals(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  total_price numeric(12, 2) NOT NULL,
  status text NOT NULL DEFAULT 'inquiry' CHECK (status IN ('inquiry', 'pending', 'confirmed', 'cancelled', 'completed')),
  notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Policy: Buyers can read their own orders
CREATE POLICY "Buyers can read own orders"
  ON public.orders FOR SELECT
  USING (buyer_id = auth.uid());

-- Policy: Sellers can read orders for their animals
CREATE POLICY "Sellers can read orders for their animals"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.animals a
      JOIN public.farms f ON a.farm_id = f.id
      WHERE a.id = animals.animal_id AND f.owner_id = auth.uid()
    )
  );

-- Policy: Buyers can create orders
CREATE POLICY "Buyers can create orders"
  ON public.orders FOR INSERT
  WITH CHECK (buyer_id = auth.uid());

-- Policy: Buyers can update their orders
CREATE POLICY "Buyers can update own orders"
  ON public.orders FOR UPDATE
  USING (buyer_id = auth.uid());

-- Policy: Admins can read all orders
CREATE POLICY "Admins can read all orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### 5. reviews
Stores farm and transaction reviews.

```sql
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  farm_id uuid REFERENCES public.farms(id) ON DELETE CASCADE,
  animal_id uuid REFERENCES public.animals(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT either_farm_or_animal CHECK (
    (farm_id IS NOT NULL AND animal_id IS NULL) OR
    (farm_id IS NULL AND animal_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read reviews
CREATE POLICY "Anyone can read reviews"
  ON public.reviews FOR SELECT
  USING (true);

-- Policy: Users can create reviews
CREATE POLICY "Users can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid());

-- Policy: Users can update own reviews
CREATE POLICY "Users can update own reviews"
  ON public.reviews FOR UPDATE
  USING (reviewer_id = auth.uid());

-- Policy: Users can delete own reviews
CREATE POLICY "Users can delete own reviews"
  ON public.reviews FOR DELETE
  USING (reviewer_id = auth.uid());
```

## Setup Instructions

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for project initialization

2. **Run SQL Schemas**
   - Go to SQL Editor in Supabase Dashboard
   - Copy and run each table creation script above
   - Verify tables are created

3. **Enable Realtime (Optional)**
   - Navigate to Database > Replication
   - Enable for tables you want real-time updates

4. **Set up Storage (for images)**
   ```sql
   -- Create storage buckets via Supabase Dashboard
   -- Storage > Buckets
   -- Create: animal-images, farm-images
   ```

5. **Get Credentials**
   - Settings > API
   - Copy Project URL and anon key
   - Add to `.env.local`

## Row Level Security (RLS) Overview

- **Public Read**: Verified farms and animals visible to all
- **User Isolation**: Each user can only access their own data
- **Admin Access**: Admins can view all data
- **Seller Protection**: Sellers only see orders for their animals
- **Buyer Protection**: Buyers only see their own orders

## Testing

```typescript
import { supabase } from '@/lib/supabase';

// Get animals from verified farms
const { data, error } = await supabase
  .from('animals')
  .select('*')
  .limit(10);

// Get user's orders
const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .eq('buyer_id', userId);
```
