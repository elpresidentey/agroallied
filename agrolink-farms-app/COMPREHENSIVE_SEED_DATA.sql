-- AgroLink Farms - Comprehensive Seed Data
-- Run this in Supabase SQL Editor after setting up the database schema

-- First, let's create some test users (these should match actual Supabase Auth users)
-- Note: Replace these UUIDs with actual Supabase Auth user IDs when available

-- Insert test users
INSERT INTO public.users (id, email, name, role, verification_status) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'seller1@agrolink.com', 'Rajesh Kumar', 'seller', 'approved'),
  ('550e8400-e29b-41d4-a716-446655440002', 'seller2@agrolink.com', 'Priya Singh', 'seller', 'approved'),
  ('550e8400-e29b-41d4-a716-446655440003', 'seller3@agrolink.com', 'Vikram Patel', 'seller', 'approved'),
  ('550e8400-e29b-41d4-a716-446655440004', 'buyer1@agrolink.com', 'Amit Sharma', 'buyer', 'approved'),
  ('550e8400-e29b-41d4-a716-446655440005', 'admin@agrolink.com', 'Admin User', 'admin', 'approved')
ON CONFLICT (id) DO NOTHING;

-- Insert test farms
INSERT INTO public.farms (id, name, description, location, owner_id) VALUES
  ('farm-001', 'Kano Livestock Farm', 'Premium cattle and goat farm in Northern Nigeria', 'Kano State, Nigeria', '550e8400-e29b-41d4-a716-446655440001'),
  ('farm-002', 'Ogun Agro Ranch', 'Multi-species farm specializing in poultry and fish', 'Ogun State, Nigeria', '550e8400-e29b-41d4-a716-446655440002'),
  ('farm-003', 'Kaduna Heritage Farm', 'Traditional livestock farm with modern practices', 'Kaduna State, Nigeria', '550e8400-e29b-41d4-a716-446655440003'),
  ('farm-004', 'Lagos Aquaculture Center', 'Modern fish farming facility', 'Lagos State, Nigeria', '550e8400-e29b-41d4-a716-446655440001'),
  ('farm-005', 'Plateau Poultry Farm', 'Large-scale poultry production', 'Plateau State, Nigeria', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;

-- Insert animals matching the Categories component (cows, goats, poultry, fish, dogs, others)

-- COWS (cattle)
INSERT INTO public.animals (id, name, type, breed, age, price, description, farm_id, seller_id, status) VALUES
  ('animal-001', 'Premium Holstein Cow', 'cows', 'Holstein Friesian', 36, 850000.00, 'High-yield dairy cow, produces 25-30 liters per day. Excellent health record and vaccination up to date.', 'farm-001', '550e8400-e29b-41d4-a716-446655440001', 'available'),
  ('animal-002', 'Jersey Dairy Cow', 'cows', 'Jersey', 28, 650000.00, 'Premium Jersey cow with rich milk quality. Perfect for small to medium dairy operations.', 'farm-001', '550e8400-e29b-41d4-a716-446655440001', 'available'),
  ('animal-003', 'Sahiwal Cow', 'cows', 'Sahiwal', 32, 550000.00, 'Indigenous breed, heat resistant, produces 12-15 liters per day. Ideal for Nigerian climate.', 'farm-003', '550e8400-e29b-41d4-a716-446655440003', 'available'),
  ('animal-004', 'Red Sindhi Cow', 'cows', 'Red Sindhi', 30, 480000.00, 'Hardy indigenous breed, excellent for both milk and meat. Disease resistant.', 'farm-003', '550e8400-e29b-41d4-a716-446655440003', 'available'),
  ('animal-005', 'Angus Bull', 'cows', 'Angus', 24, 750000.00, 'Premium breeding bull, excellent genetics for meat production. Proven lineage.', 'farm-001', '550e8400-e29b-41d4-a716-446655440001', 'available'),

-- GOATS
  ('animal-006', 'Boer Goat Buck', 'goats', 'Boer', 18, 85000.00, 'Premium meat goat, fast growth rate. Excellent for commercial meat production.', 'farm-001', '550e8400-e29b-41d4-a716-446655440001', 'available'),
  ('animal-007', 'Nubian Dairy Goat', 'goats', 'Nubian', 20, 75000.00, 'High milk production goat, 3-4 liters per day. Great for cheese making.', 'farm-003', '550e8400-e29b-41d4-a716-446655440003', 'available'),
  ('animal-008', 'Kiko Goat', 'goats', 'Kiko', 16, 65000.00, 'Hardy meat goat breed, excellent foraging ability. Low maintenance.', 'farm-001', '550e8400-e29b-41d4-a716-446655440001', 'available'),
  ('animal-009', 'Saanen Dairy Goat', 'goats', 'Saanen', 22, 80000.00, 'Top milk producer, 4-5 liters per day. Calm temperament, easy to handle.', 'farm-003', '550e8400-e29b-41d4-a716-446655440003', 'available'),
  ('animal-010', 'West African Dwarf Goat', 'goats', 'WAD Goat', 14, 35000.00, 'Local breed, disease resistant, good for small-scale farming.', 'farm-001', '550e8400-e29b-41d4-a716-446655440001', 'available'),

-- POULTRY
  ('animal-011', 'Broiler Chickens (Batch)', 'poultry', 'Ross 308', 6, 2500.00, 'Fast-growing broiler chickens, ready for market in 6-8 weeks. Sold per bird.', 'farm-002', '550e8400-e29b-41d4-a716-446655440002', 'available'),
  ('animal-012', 'Layer Hens', 'poultry', 'Isa Brown', 18, 3500.00, 'High egg production hens, 300+ eggs per year. Currently laying.', 'farm-002', '550e8400-e29b-41d4-a716-446655440002', 'available'),
  ('animal-013', 'Turkey Poults', 'poultry', 'Broad Breasted White', 12, 8500.00, 'Premium turkey for meat production. Fast growing, excellent feed conversion.', 'farm-005', '550e8400-e29b-41d4-a716-446655440002', 'available'),
  ('animal-014', 'Guinea Fowl', 'poultry', 'Pearl Guinea', 16, 4500.00, 'Excellent for pest control and meat. Hardy birds, good for free-range.', 'farm-002', '550e8400-e29b-41d4-a716-446655440002', 'available'),
  ('animal-015', 'Ducks', 'poultry', 'Pekin Duck', 14, 5500.00, 'Dual-purpose ducks for meat and eggs. Good foragers, easy to raise.', 'farm-005', '550e8400-e29b-41d4-a716-446655440002', 'available'),

-- FISH
  ('animal-016', 'Catfish Fingerlings (1000 pcs)', 'fish', 'African Catfish', 2, 150000.00, 'Healthy catfish fingerlings, 4-6 inches. Ready for grow-out ponds.', 'farm-004', '550e8400-e29b-41d4-a716-446655440001', 'available'),
  ('animal-017', 'Tilapia Fingerlings (1000 pcs)', 'fish', 'Nile Tilapia', 2, 120000.00, 'Fast-growing tilapia fingerlings. Excellent for commercial aquaculture.', 'farm-004', '550e8400-e29b-41d4-a716-446655440001', 'available'),
  ('animal-018', 'Mature Catfish (50kg)', 'fish', 'African Catfish', 8, 45000.00, 'Table-size catfish, 1-2kg each. Ready for market or processing.', 'farm-004', '550e8400-e29b-41d4-a716-446655440001', 'available'),
  ('animal-019', 'Carp Fingerlings (500 pcs)', 'fish', 'Common Carp', 3, 75000.00, 'Hardy carp fingerlings for pond stocking. Good for polyculture systems.', 'farm-004', '550e8400-e29b-41d4-a716-446655440001', 'available'),

-- DOGS
  ('animal-020', 'German Shepherd Puppy', 'dogs', 'German Shepherd', 3, 180000.00, 'Purebred German Shepherd puppy, excellent for security and companionship. Vaccinated.', 'farm-003', '550e8400-e29b-41d4-a716-446655440003', 'available'),
  ('animal-021', 'Rottweiler Puppy', 'dogs', 'Rottweiler', 4, 200000.00, 'Strong and loyal Rottweiler puppy. Great guard dog with proper training.', 'farm-003', '550e8400-e29b-41d4-a716-446655440003', 'available'),
  ('animal-022', 'Local Guard Dog', 'dogs', 'Nigerian Local', 12, 45000.00, 'Well-trained local breed guard dog. Excellent for farm security.', 'farm-001', '550e8400-e29b-41d4-a716-446655440001', 'available'),
  ('animal-023', 'Boerboel Puppy', 'dogs', 'Boerboel', 5, 250000.00, 'Premium South African mastiff breed. Excellent family guardian.', 'farm-003', '550e8400-e29b-41d4-a716-446655440003', 'available'),

-- OTHERS (sheep, pigs, rabbits, etc.)
  ('animal-024', 'Dorper Sheep', 'others', 'Dorper', 18, 120000.00, 'Premium meat sheep, excellent feed conversion. Hardy and fast-growing.', 'farm-003', '550e8400-e29b-41d4-a716-446655440003', 'available'),
  ('animal-025', 'Yorkshire Pig', 'others', 'Yorkshire', 16, 180000.00, 'High-quality breeding pig, excellent for commercial pork production.', 'farm-001', '550e8400-e29b-41d4-a716-446655440001', 'available'),
  ('animal-026', 'New Zealand White Rabbits', 'others', 'New Zealand White', 6, 15000.00, 'Breeding pair of rabbits. Excellent for meat production and fur.', 'farm-002', '550e8400-e29b-41d4-a716-446655440002', 'available'),
  ('animal-027', 'Ostrich Chicks', 'others', 'African Black', 8, 350000.00, 'Rare ostrich chicks for exotic farming. High-value meat and leather.', 'farm-005', '550e8400-e29b-41d4-a716-446655440002', 'available'),
  ('animal-028', 'Grasscutter (Cane Rat)', 'others', 'Greater Cane Rat', 10, 25000.00, 'Popular bush meat, high protein content. Easy to raise in captivity.', 'farm-002', '550e8400-e29b-41d4-a716-446655440002', 'available')
ON CONFLICT (id) DO NOTHING;

-- Insert some sample orders
INSERT INTO public.orders (id, buyer_id, seller_id, animal_id, quantity, total_price, status) VALUES
  ('order-001', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'animal-001', 2, 1700000.00, 'confirmed'),
  ('order-002', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', 'animal-011', 50, 125000.00, 'pending'),
  ('order-003', '550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'animal-016', 1, 150000.00, 'confirmed')
ON CONFLICT (id) DO NOTHING;

-- Show summary of created data
SELECT 
  'Data Summary' as info,
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM public.farms) as total_farms,
  (SELECT COUNT(*) FROM public.animals) as total_animals,
  (SELECT COUNT(*) FROM public.orders) as total_orders;

-- Show animals by category
SELECT 
  type as category,
  COUNT(*) as animal_count,
  AVG(price) as avg_price
FROM public.animals 
GROUP BY type 
ORDER BY type;