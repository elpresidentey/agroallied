-- AgroLink Farms - Test Data Seed Script
-- Run this in Supabase SQL Editor to populate the database

-- Note: Auth users should be created first via Supabase Auth UI
-- Then get their UUIDs and replace the IDs below

-- 1. Create test farms
INSERT INTO farms (id, user_id, name, location, description, verified, image_url, created_at)
VALUES
  ('farm-001', 'user-buyer-001', 'Meadow Ridge Farm', 'Punjab, India', 'Premium dairy farm specializing in Holstein cattle', true, 'https://images.unsplash.com/photo-1500595046891-ff8c2da6a0b8?w=500&h=300&fit=crop', NOW()),
  ('farm-002', 'user-seller-001', 'Green Valley Livestock', 'Haryana, India', 'Multi-species farm with goats, sheep, and cattle', true, 'https://images.unsplash.com/photo-1551958219-acbc608c6be4?w=500&h=300&fit=crop', NOW()),
  ('farm-003', 'user-seller-002', 'Golden Harvest Ranch', 'Uttar Pradesh, India', 'Specialized poultry and meat production', true, 'https://images.unsplash.com/photo-1554224311-beee415c15c9?w=500&h=300&fit=crop', NOW()),
  ('farm-004', 'user-seller-003', 'Sunrise Dairy Cooperative', 'Rajasthan, India', 'Community-run dairy with 50+ animals', true, 'https://images.unsplash.com/photo-1500328299655-4ca4c3c89235?w=500&h=300&fit=crop', NOW());

-- 2. Create test animals (Cattle)
INSERT INTO animals (id, farm_id, type, breed, age_months, weight_kg, gender, price, available_count, description, status, image_url, created_at)
VALUES
  ('animal-001', 'farm-001', 'cattle', 'Holstein Friesian', 36, 550, 'female', 85000, 5, 'High-yield dairy cow, excellent milk production', 'active', 'https://images.unsplash.com/photo-1565040666747-69f6646db940?w=500&h=300&fit=crop', NOW()),
  ('animal-002', 'farm-001', 'cattle', 'Jersey', 24, 400, 'female', 65000, 3, 'Premium quality Jersey cow, rich milk', 'active', 'https://images.unsplash.com/photo-1516229755625-4589d5b2d6d2?w=500&h=300&fit=crop', NOW()),
  ('animal-003', 'farm-001', 'cattle', 'Sahiwal', 30, 500, 'female', 55000, 4, 'Desi breed, heat resistant, 12-14L/day', 'active', 'https://images.unsplash.com/photo-1500328299655-4ca4c3c89235?w=500&h=300&fit=crop', NOW()),
  ('animal-004', 'farm-001', 'cattle', 'Gir', 28, 480, 'female', 60000, 2, 'Indigenous breed, A2 milk, disease resistant', 'active', 'https://images.unsplash.com/photo-1500328299655-4ca4c3c89235?w=500&h&fit=crop', NOW()),
  
  -- From Green Valley Livestock
  ('animal-005', 'farm-002', 'goat', 'Boer', 18, 75, 'male', 8000, 12, 'Premium meat breed, fast growth', 'active', 'https://images.unsplash.com/photo-1523046d9e0b0db3814c4f4970f21faa6e7de371?w=500&h=300&fit=crop', NOW()),
  ('animal-006', 'farm-002', 'goat', 'Alpine', 20, 70, 'female', 7500, 8, 'High milk production, 3-4L/day', 'active', 'https://images.unsplash.com/photo-1535241749838-299bda266b9e?w=500&h=300&fit=crop', NOW()),
  ('animal-007', 'farm-002', 'sheep', 'Merino', 24, 65, 'male', 5500, 15, 'Premium wool quality, meat breed', 'active', 'https://images.unsplash.com/photo-1571994471540-87f0c92cf3fe?w=500&h=300&fit=crop', NOW()),
  ('animal-008', 'farm-002', 'sheep', 'Suffolk', 22, 75, 'female', 6000, 10, 'Meat sheep, fast growth rate', 'active', 'https://images.unsplash.com/photo-1568038879355-84f8ac9c3cc6?w=500&h=300&fit=crop', NOW()),
  ('animal-009', 'farm-002', 'cattle', 'Buffalo', 36, 650, 'female', 95000, 2, 'Water buffalo, high-fat milk for paneer', 'active', 'https://images.unsplash.com/photo-1500595046891-ff8c2da6a0b8?w=500&h=300&fit=crop', NOW()),

  -- From Golden Harvest Ranch
  ('animal-010', 'farm-003', 'poultry', 'Broiler Chicken', 8, 2.5, 'mixed', 250, 500, 'Fast-growing meat birds, ready in 6-8 weeks', 'active', 'https://images.unsplash.com/photo-1554224311-beee415c15c9?w=500&h=300&fit=crop', NOW()),
  ('animal-011', 'farm-003', 'poultry', 'Leghorn', 12, 2, 'female', 300, 300, 'High egg production, 300+ eggs/year', 'active', 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=500&h=300&fit=crop', NOW()),
  ('animal-012', 'farm-003', 'poultry', 'Aseel', 16, 2.8, 'male', 400, 50, 'Fighting breed, premium meat quality', 'active', 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500&h=300&fit=crop', NOW()),
  ('animal-013', 'farm-003', 'pig', 'Yorkshire', 18, 120, 'female', 12000, 6, 'Premium pork production, 250kg at maturity', 'active', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500&h=300&fit=crop', NOW()),
  ('animal-014', 'farm-003', 'pig', 'Berkshire', 20, 130, 'male', 14000, 4, 'Heritage breed, superior meat quality', 'active', 'https://images.unsplash.com/photo-1535241749838-299bda266b9e?w=500&h=300&fit=crop', NOW()),

  -- From Sunrise Dairy Cooperative
  ('animal-015', 'farm-004', 'cattle', 'Murrah Buffalo', 32, 700, 'female', 110000, 3, 'Excellent dairy buffalo, 20L/day potential', 'active', 'https://images.unsplash.com/photo-1500595046891-ff8c2da6a0b8?w=500&h=300&fit=crop', NOW()),
  ('animal-016', 'farm-004', 'cattle', 'Kankrej', 28, 520, 'female', 58000, 4, 'Desi cattle, adapted to arid climate', 'active', 'https://images.unsplash.com/photo-1500328299655-4ca4c3c89235?w=500&h=300&fit=crop', NOW()),
  ('animal-017', 'farm-004', 'goat', 'Sirohi', 16, 65, 'male', 7000, 20, 'Meat goat, fast growth in arid regions', 'active', 'https://images.unsplash.com/photo-1523046d9e0b0db3814c4f4970f21faa6e7de371?w=500&h=300&fit=crop', NOW());

-- 3. Create test users (these should exist in Supabase Auth first)
-- UPDATE: Replace UUIDs below with actual Supabase Auth user IDs
INSERT INTO users (id, email, name, role, verified_email, phone, location, created_at, updated_at)
VALUES
  ('user-buyer-001', 'admin@agrolink.com', 'Admin User', 'admin', true, '9876543210', 'Delhi, India', NOW(), NOW()),
  ('user-seller-001', 'seller1@farm.com', 'Rajesh Kumar', 'seller', true, '9876543211', 'Punjab, India', NOW(), NOW()),
  ('user-seller-002', 'seller2@farm.com', 'Priya Singh', 'seller', true, '9876543212', 'Haryana, India', NOW(), NOW()),
  ('user-seller-003', 'seller3@farm.com', 'Vikram Patel', 'seller', true, '9876543213', 'Rajasthan, India', NOW(), NOW()),
  ('user-buyer-002', 'buyer1@mail.com', 'Amit Kumar', 'buyer', true, '9876543214', 'Bangalore, India', NOW(), NOW()),
  ('user-buyer-003', 'buyer2@mail.com', 'Neha Sharma', 'buyer', false, '9876543215', 'Mumbai, India', NOW(), NOW());

-- 4. Create sample orders
INSERT INTO orders (id, buyer_id, animal_id, quantity, total_price, status, notes, created_at, updated_at)
VALUES
  ('order-001', 'user-buyer-002', 'animal-001', 2, 170000, 'confirmed', 'Need high-yield cows for dairy business', NOW(), NOW()),
  ('order-002', 'user-buyer-003', 'animal-005', 10, 80000, 'pending', 'For meat production', NOW(), NOW()),
  ('order-003', 'user-buyer-002', 'animal-010', 100, 25000, 'confirmed', 'Broiler chickens for processing', NOW(), NOW());

-- 5. Create sample reviews
INSERT INTO reviews (id, order_id, reviewer_id, rating, comment, created_at)
VALUES
  ('review-001', 'order-001', 'user-buyer-002', 5, 'Excellent quality cattle, very healthy. Highly recommend Meadow Ridge Farm!', NOW()),
  ('review-002', 'order-003', 'user-buyer-002', 4, 'Good quality birds, timely delivery. Minor issue with 2 birds but overall satisfied.', NOW());

-- Optional: Create additional animals for better variety
-- Uncomment below to add more test data

/*
INSERT INTO animals (id, farm_id, type, breed, age_months, weight_kg, gender, price, available_count, description, status, image_url, created_at)
VALUES
  ('animal-018', 'farm-001', 'cattle', 'HF Cross', 24, 480, 'female', 50000, 6, 'High-yield hybrid cattle', 'active', 'https://images.unsplash.com/photo-1500328299655-4ca4c3c89235?w=500&h=300&fit=crop', NOW()),
  ('animal-019', 'farm-002', 'goat', 'Jamnapari', 22, 72, 'male', 8500, 7, 'Dairy and meat dual purpose', 'active', 'https://images.unsplash.com/photo-1523046d9e0b0db3814c4f4970f21faa6e7de371?w=500&h=300&fit=crop', NOW()),
  ('animal-020', 'farm-003', 'poultry', 'Desi Chicken', 10, 1.8, 'female', 200, 200, 'Traditional backyard breed', 'active', 'https://images.unsplash.com/photo-1554224311-beee415c15c9?w=500&h=300&fit=crop', NOW());
*/

-- Show created data counts
SELECT 
  (SELECT COUNT(*) FROM farms) as total_farms,
  (SELECT COUNT(*) FROM animals) as total_animals,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM orders) as total_orders;
