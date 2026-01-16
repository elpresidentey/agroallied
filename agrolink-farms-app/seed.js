#!/usr/bin/env node

/**
 * AgroLink Farms - Database Seeding Script
 * 
 * This script seeds the Supabase database with test data.
 * 
 * Setup Instructions:
 * 1. Create auth users first in Supabase:
 *    - admin@agrolink.com / password123
 *    - seller1@farm.com / password123
 *    - seller2@farm.com / password123
 *    - seller3@farm.com / password123
 *    - buyer1@mail.com / password123
 *    - buyer2@mail.com / password123
 * 
 * 2. Copy their UUIDs from Supabase Auth dashboard
 * 3. Update the USER_MAP object below with the UUIDs
 * 4. Run: node seed.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Please add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

/**
 * MAP YOUR USER IDs HERE
 * 
 * Get UUIDs from: https://app.supabase.com/project/[YOUR_PROJECT]/auth/users
 * After creating auth users, replace these with actual UUIDs
 */
const USER_MAP = {
  'admin@agrolink.com': 'replace-with-admin-uuid',
  'seller1@farm.com': 'replace-with-seller1-uuid',
  'seller2@farm.com': 'replace-with-seller2-uuid',
  'seller3@farm.com': 'replace-with-seller3-uuid',
  'buyer1@mail.com': 'replace-with-buyer1-uuid',
  'buyer2@mail.com': 'replace-with-buyer2-uuid',
};

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...\n');

    // 1. Create farms
    console.log('📍 Creating farms...');
    const farmsData = [
      {
        id: 'farm-001',
        user_id: USER_MAP['admin@agrolink.com'],
        name: 'Meadow Ridge Farm',
        location: 'Punjab, India',
        description: 'Premium dairy farm specializing in Holstein cattle',
        verified: true,
        image_url: 'https://images.unsplash.com/photo-1500595046891-ff8c2da6a0b8?w=500&h=300&fit=crop',
      },
      {
        id: 'farm-002',
        user_id: USER_MAP['seller1@farm.com'],
        name: 'Green Valley Livestock',
        location: 'Haryana, India',
        description: 'Multi-species farm with goats, sheep, and cattle',
        verified: true,
        image_url: 'https://images.unsplash.com/photo-1551958219-acbc608c6be4?w=500&h=300&fit=crop',
      },
      {
        id: 'farm-003',
        user_id: USER_MAP['seller2@farm.com'],
        name: 'Golden Harvest Ranch',
        location: 'Uttar Pradesh, India',
        description: 'Specialized poultry and meat production',
        verified: true,
        image_url: 'https://images.unsplash.com/photo-1554224311-beee415c15c9?w=500&h=300&fit=crop',
      },
      {
        id: 'farm-004',
        user_id: USER_MAP['seller3@farm.com'],
        name: 'Sunrise Dairy Cooperative',
        location: 'Rajasthan, India',
        description: 'Community-run dairy with 50+ animals',
        verified: true,
        image_url: 'https://images.unsplash.com/photo-1500328299655-4ca4c3c89235?w=500&h=300&fit=crop',
      },
    ];

    const { error: farmsError } = await supabase.from('farms').insert(farmsData);
    if (farmsError) throw farmsError;
    console.log(`✅ Created ${farmsData.length} farms\n`);

    // 2. Create animals
    console.log('🐄 Creating animals...');
    const animalsData = [
      // Meadow Ridge Farm - Cattle
      {
        id: 'animal-001',
        farm_id: 'farm-001',
        type: 'cattle',
        breed: 'Holstein Friesian',
        age_months: 36,
        weight_kg: 550,
        gender: 'female',
        price: 85000,
        available_count: 5,
        description: 'High-yield dairy cow, excellent milk production',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1565040666747-69f6646db940?w=500&h=300&fit=crop',
      },
      {
        id: 'animal-002',
        farm_id: 'farm-001',
        type: 'cattle',
        breed: 'Jersey',
        age_months: 24,
        weight_kg: 400,
        gender: 'female',
        price: 65000,
        available_count: 3,
        description: 'Premium quality Jersey cow, rich milk',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1516229755625-4589d5b2d6d2?w=500&h=300&fit=crop',
      },
      {
        id: 'animal-003',
        farm_id: 'farm-001',
        type: 'cattle',
        breed: 'Sahiwal',
        age_months: 30,
        weight_kg: 500,
        gender: 'female',
        price: 55000,
        available_count: 4,
        description: 'Desi breed, heat resistant, 12-14L/day',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1500328299655-4ca4c3c89235?w=500&h=300&fit=crop',
      },
      {
        id: 'animal-004',
        farm_id: 'farm-001',
        type: 'cattle',
        breed: 'Gir',
        age_months: 28,
        weight_kg: 480,
        gender: 'female',
        price: 60000,
        available_count: 2,
        description: 'Indigenous breed, A2 milk, disease resistant',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1500328299655-4ca4c3c89235?w=500&h=300&fit=crop',
      },

      // Green Valley Livestock
      {
        id: 'animal-005',
        farm_id: 'farm-002',
        type: 'goat',
        breed: 'Boer',
        age_months: 18,
        weight_kg: 75,
        gender: 'male',
        price: 8000,
        available_count: 12,
        description: 'Premium meat breed, fast growth',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1523046d9e0b0db3814c4f4970f21faa6e7de371?w=500&h=300&fit=crop',
      },
      {
        id: 'animal-006',
        farm_id: 'farm-002',
        type: 'goat',
        breed: 'Alpine',
        age_months: 20,
        weight_kg: 70,
        gender: 'female',
        price: 7500,
        available_count: 8,
        description: 'High milk production, 3-4L/day',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1535241749838-299bda266b9e?w=500&h=300&fit=crop',
      },
      {
        id: 'animal-007',
        farm_id: 'farm-002',
        type: 'sheep',
        breed: 'Merino',
        age_months: 24,
        weight_kg: 65,
        gender: 'male',
        price: 5500,
        available_count: 15,
        description: 'Premium wool quality, meat breed',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1571994471540-87f0c92cf3fe?w=500&h=300&fit=crop',
      },
      {
        id: 'animal-008',
        farm_id: 'farm-002',
        type: 'sheep',
        breed: 'Suffolk',
        age_months: 22,
        weight_kg: 75,
        gender: 'female',
        price: 6000,
        available_count: 10,
        description: 'Meat sheep, fast growth rate',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1568038879355-84f8ac9c3cc6?w=500&h=300&fit=crop',
      },
      {
        id: 'animal-009',
        farm_id: 'farm-002',
        type: 'cattle',
        breed: 'Buffalo',
        age_months: 36,
        weight_kg: 650,
        gender: 'female',
        price: 95000,
        available_count: 2,
        description: 'Water buffalo, high-fat milk for paneer',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1500595046891-ff8c2da6a0b8?w=500&h=300&fit=crop',
      },

      // Golden Harvest Ranch
      {
        id: 'animal-010',
        farm_id: 'farm-003',
        type: 'poultry',
        breed: 'Broiler Chicken',
        age_months: 8,
        weight_kg: 2.5,
        gender: 'mixed',
        price: 250,
        available_count: 500,
        description: 'Fast-growing meat birds, ready in 6-8 weeks',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1554224311-beee415c15c9?w=500&h=300&fit=crop',
      },
      {
        id: 'animal-011',
        farm_id: 'farm-003',
        type: 'poultry',
        breed: 'Leghorn',
        age_months: 12,
        weight_kg: 2,
        gender: 'female',
        price: 300,
        available_count: 300,
        description: 'High egg production, 300+ eggs/year',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1553284965-83fd3e82fa5a?w=500&h=300&fit=crop',
      },
      {
        id: 'animal-012',
        farm_id: 'farm-003',
        type: 'poultry',
        breed: 'Aseel',
        age_months: 16,
        weight_kg: 2.8,
        gender: 'male',
        price: 400,
        available_count: 50,
        description: 'Fighting breed, premium meat quality',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=500&h=300&fit=crop',
      },
      {
        id: 'animal-013',
        farm_id: 'farm-003',
        type: 'pig',
        breed: 'Yorkshire',
        age_months: 18,
        weight_kg: 120,
        gender: 'female',
        price: 12000,
        available_count: 6,
        description: 'Premium pork production, 250kg at maturity',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=500&h=300&fit=crop',
      },
      {
        id: 'animal-014',
        farm_id: 'farm-003',
        type: 'pig',
        breed: 'Berkshire',
        age_months: 20,
        weight_kg: 130,
        gender: 'male',
        price: 14000,
        available_count: 4,
        description: 'Heritage breed, superior meat quality',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1535241749838-299bda266b9e?w=500&h=300&fit=crop',
      },

      // Sunrise Dairy Cooperative
      {
        id: 'animal-015',
        farm_id: 'farm-004',
        type: 'cattle',
        breed: 'Murrah Buffalo',
        age_months: 32,
        weight_kg: 700,
        gender: 'female',
        price: 110000,
        available_count: 3,
        description: 'Excellent dairy buffalo, 20L/day potential',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1500595046891-ff8c2da6a0b8?w=500&h=300&fit=crop',
      },
      {
        id: 'animal-016',
        farm_id: 'farm-004',
        type: 'cattle',
        breed: 'Kankrej',
        age_months: 28,
        weight_kg: 520,
        gender: 'female',
        price: 58000,
        available_count: 4,
        description: 'Desi cattle, adapted to arid climate',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1500328299655-4ca4c3c89235?w=500&h=300&fit=crop',
      },
      {
        id: 'animal-017',
        farm_id: 'farm-004',
        type: 'goat',
        breed: 'Sirohi',
        age_months: 16,
        weight_kg: 65,
        gender: 'male',
        price: 7000,
        available_count: 20,
        description: 'Meat goat, fast growth in arid regions',
        status: 'active',
        image_url: 'https://images.unsplash.com/photo-1523046d9e0b0db3814c4f4970f21faa6e7de371?w=500&h=300&fit=crop',
      },
    ];

    const { error: animalsError } = await supabase.from('animals').insert(animalsData);
    if (animalsError) throw animalsError;
    console.log(`✅ Created ${animalsData.length} animals\n`);

    // 3. Create users
    console.log('👥 Creating users...');
    const usersData = [
      {
        id: USER_MAP['admin@agrolink.com'],
        email: 'admin@agrolink.com',
        name: 'Admin User',
        role: 'admin',
        verified_email: true,
        phone: '9876543210',
        location: 'Delhi, India',
      },
      {
        id: USER_MAP['seller1@farm.com'],
        email: 'seller1@farm.com',
        name: 'Rajesh Kumar',
        role: 'seller',
        verified_email: true,
        phone: '9876543211',
        location: 'Punjab, India',
      },
      {
        id: USER_MAP['seller2@farm.com'],
        email: 'seller2@farm.com',
        name: 'Priya Singh',
        role: 'seller',
        verified_email: true,
        phone: '9876543212',
        location: 'Haryana, India',
      },
      {
        id: USER_MAP['seller3@farm.com'],
        email: 'seller3@farm.com',
        name: 'Vikram Patel',
        role: 'seller',
        verified_email: true,
        phone: '9876543213',
        location: 'Rajasthan, India',
      },
      {
        id: USER_MAP['buyer1@mail.com'],
        email: 'buyer1@mail.com',
        name: 'Amit Kumar',
        role: 'buyer',
        verified_email: true,
        phone: '9876543214',
        location: 'Bangalore, India',
      },
      {
        id: USER_MAP['buyer2@mail.com'],
        email: 'buyer2@mail.com',
        name: 'Neha Sharma',
        role: 'buyer',
        verified_email: false,
        phone: '9876543215',
        location: 'Mumbai, India',
      },
    ];

    const { error: usersError } = await supabase.from('users').insert(usersData);
    if (usersError) throw usersError;
    console.log(`✅ Created ${usersData.length} users\n`);

    // 4. Create sample orders
    console.log('📦 Creating sample orders...');
    const ordersData = [
      {
        id: 'order-001',
        buyer_id: USER_MAP['buyer1@mail.com'],
        animal_id: 'animal-001',
        quantity: 2,
        total_price: 170000,
        status: 'confirmed',
        notes: 'Need high-yield cows for dairy business',
      },
      {
        id: 'order-002',
        buyer_id: USER_MAP['buyer2@mail.com'],
        animal_id: 'animal-005',
        quantity: 10,
        total_price: 80000,
        status: 'pending',
        notes: 'For meat production',
      },
      {
        id: 'order-003',
        buyer_id: USER_MAP['buyer1@mail.com'],
        animal_id: 'animal-010',
        quantity: 100,
        total_price: 25000,
        status: 'confirmed',
        notes: 'Broiler chickens for processing',
      },
    ];

    const { error: ordersError } = await supabase.from('orders').insert(ordersData);
    if (ordersError) throw ordersError;
    console.log(`✅ Created ${ordersData.length} sample orders\n`);

    // 5. Create sample reviews
    console.log('⭐ Creating sample reviews...');
    const reviewsData = [
      {
        id: 'review-001',
        order_id: 'order-001',
        reviewer_id: USER_MAP['buyer1@mail.com'],
        rating: 5,
        comment: 'Excellent quality cattle, very healthy. Highly recommend Meadow Ridge Farm!',
      },
      {
        id: 'review-002',
        order_id: 'order-003',
        reviewer_id: USER_MAP['buyer1@mail.com'],
        rating: 4,
        comment: 'Good quality birds, timely delivery. Minor issue with 2 birds but overall satisfied.',
      },
    ];

    const { error: reviewsError } = await supabase.from('reviews').insert(reviewsData);
    if (reviewsError) throw reviewsError;
    console.log(`✅ Created ${reviewsData.length} sample reviews\n`);

    console.log('✨ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log(`   - ${farmsData.length} Farms`);
    console.log(`   - ${animalsData.length} Animals`);
    console.log(`   - ${usersData.length} Users`);
    console.log(`   - ${ordersData.length} Orders`);
    console.log(`   - ${reviewsData.length} Reviews`);
    console.log('\n🚀 Ready to test! Run: npm run dev\n');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
