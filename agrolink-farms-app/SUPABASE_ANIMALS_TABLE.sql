-- Create animals table
CREATE TABLE public.animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('cattle', 'goat', 'sheep', 'poultry', 'pig')),
  breed TEXT NOT NULL,
  age_months INTEGER NOT NULL,
  weight_kg NUMERIC NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female', 'mixed')),
  price INTEGER NOT NULL,
  available_count INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_animals_type ON public.animals(type);
CREATE INDEX idx_animals_status ON public.animals(status);
CREATE INDEX idx_animals_farm_id ON public.animals(farm_id);

-- Enable RLS
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Animals are publicly readable" ON public.animals
  FOR SELECT USING (status = 'active');

CREATE POLICY "Farm owners can manage their animals" ON public.animals
  FOR ALL USING (
    auth.uid() = (SELECT user_id FROM public.farms WHERE id = animals.farm_id)
  );

-- Insert sample data with real images from Unsplash
INSERT INTO public.animals (type, breed, age_months, weight_kg, gender, price, available_count, description, image_url, status)
VALUES
  ('cattle', 'Jersey', 36, 400, 'female', 150000, 1, 'High-quality Jersey cow, excellent for dairy production. Healthy and productive.', 'https://images.unsplash.com/photo-1552225864-5b814b3f2e5f?w=500&h=500&fit=crop', 'active'),
  ('goat', 'Boer', 24, 85, 'male', 25000, 3, 'Premium Boer goat for meat production. Well-bred and healthy animals.', 'https://images.unsplash.com/photo-1567271894396-650b0b0c4da0?w=500&h=500&fit=crop', 'active'),
  ('sheep', 'Merino', 24, 60, 'female', 18000, 5, 'Wool-producing Merino sheep. Premium quality wool and meat production.', 'https://images.unsplash.com/photo-1545736066-51218883bef4?w=500&h=500&fit=crop', 'active'),
  ('poultry', 'Rhode Island Red', 12, 2.5, 'female', 500, 50, 'Excellent layer hens for egg production. High-quality breed.', 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=500&h=500&fit=crop', 'active'),
  ('pig', 'Duroc', 18, 150, 'male', 45000, 2, 'Premium Duroc pigs for meat. Fast-growing and healthy.', 'https://images.unsplash.com/photo-1575081813589-30c0e3e36e0e?w=500&h=500&fit=crop', 'active'),
  ('cattle', 'Holstein', 48, 650, 'female', 200000, 1, 'Premium Holstein dairy cow. Exceptional milk production.', 'https://images.unsplash.com/photo-1626839897961-83fd3e82fa5a?w=500&h=500&fit=crop', 'active');
