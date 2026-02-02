// Mock data for development when database is not available
import { Animal } from '@/types';

export const mockAnimals: Animal[] = [
  // Cows
  {
    id: 'mock-001',
    name: 'Premium Holstein Cow',
    type: 'cows',
    breed: 'Holstein Friesian',
    age: 36,
    price: 850000,
    description: 'High-yield dairy cow, produces 25-30 liters per day. Excellent health record and vaccination up to date.',
    farm_id: 'farm-001',
    seller_id: 'seller-001',
    status: 'available',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-002',
    name: 'Jersey Dairy Cow',
    type: 'cows',
    breed: 'Jersey',
    age: 28,
    price: 650000,
    description: 'Premium Jersey cow with rich milk quality. Perfect for small to medium dairy operations.',
    farm_id: 'farm-001',
    seller_id: 'seller-001',
    status: 'available',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-003',
    name: 'Sahiwal Cow',
    type: 'cows',
    breed: 'Sahiwal',
    age: 32,
    price: 550000,
    description: 'Indigenous breed, heat resistant, produces 12-15 liters per day. Ideal for Nigerian climate.',
    farm_id: 'farm-003',
    seller_id: 'seller-003',
    status: 'available',
    created_at: new Date().toISOString(),
  },

  // Goats
  {
    id: 'mock-004',
    name: 'Boer Goat Buck',
    type: 'goats',
    breed: 'Boer',
    age: 18,
    price: 85000,
    description: 'Premium meat goat, fast growth rate. Excellent for commercial meat production.',
    farm_id: 'farm-001',
    seller_id: 'seller-001',
    status: 'available',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-005',
    name: 'Nubian Dairy Goat',
    type: 'goats',
    breed: 'Nubian',
    age: 20,
    price: 75000,
    description: 'High milk production goat, 3-4 liters per day. Great for cheese making.',
    farm_id: 'farm-003',
    seller_id: 'seller-003',
    status: 'available',
    created_at: new Date().toISOString(),
  },

  // Poultry
  {
    id: 'mock-006',
    name: 'Broiler Chickens',
    type: 'poultry',
    breed: 'Ross 308',
    age: 6,
    price: 2500,
    description: 'Fast-growing broiler chickens, ready for market in 6-8 weeks. Sold per bird.',
    farm_id: 'farm-002',
    seller_id: 'seller-002',
    status: 'available',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-007',
    name: 'Layer Hens',
    type: 'poultry',
    breed: 'Isa Brown',
    age: 18,
    price: 3500,
    description: 'High egg production hens, 300+ eggs per year. Currently laying.',
    farm_id: 'farm-002',
    seller_id: 'seller-002',
    status: 'available',
    created_at: new Date().toISOString(),
  },

  // Fish
  {
    id: 'mock-008',
    name: 'Catfish Fingerlings',
    type: 'fish',
    breed: 'African Catfish',
    age: 2,
    price: 150000,
    description: 'Healthy catfish fingerlings, 4-6 inches. Ready for grow-out ponds. Sold per 1000 pieces.',
    farm_id: 'farm-004',
    seller_id: 'seller-001',
    status: 'available',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-009',
    name: 'Tilapia Fingerlings',
    type: 'fish',
    breed: 'Nile Tilapia',
    age: 2,
    price: 120000,
    description: 'Fast-growing tilapia fingerlings. Excellent for commercial aquaculture. Sold per 1000 pieces.',
    farm_id: 'farm-004',
    seller_id: 'seller-001',
    status: 'available',
    created_at: new Date().toISOString(),
  },

  // Dogs
  {
    id: 'mock-010',
    name: 'German Shepherd Puppy',
    type: 'dogs',
    breed: 'German Shepherd',
    age: 3,
    price: 180000,
    description: 'Purebred German Shepherd puppy, excellent for security and companionship. Vaccinated.',
    farm_id: 'farm-003',
    seller_id: 'seller-003',
    status: 'available',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-011',
    name: 'Local Guard Dog',
    type: 'dogs',
    breed: 'Nigerian Local',
    age: 12,
    price: 45000,
    description: 'Well-trained local breed guard dog. Excellent for farm security.',
    farm_id: 'farm-001',
    seller_id: 'seller-001',
    status: 'available',
    created_at: new Date().toISOString(),
  },

  // Others
  {
    id: 'mock-012',
    name: 'Dorper Sheep',
    type: 'others',
    breed: 'Dorper',
    age: 18,
    price: 120000,
    description: 'Premium meat sheep, excellent feed conversion. Hardy and fast-growing.',
    farm_id: 'farm-003',
    seller_id: 'seller-003',
    status: 'available',
    created_at: new Date().toISOString(),
  },
  {
    id: 'mock-013',
    name: 'Yorkshire Pig',
    type: 'others',
    breed: 'Yorkshire',
    age: 16,
    price: 180000,
    description: 'High-quality breeding pig, excellent for commercial pork production.',
    farm_id: 'farm-001',
    seller_id: 'seller-001',
    status: 'available',
    created_at: new Date().toISOString(),
  },
];

export function getMockAnimalsByCategory(category?: string): Animal[] {
  if (!category || category === 'all') {
    return mockAnimals;
  }
  
  return mockAnimals.filter(animal => animal.type === category);
}

export function getMockAnimalById(id: string): Animal | null {
  return mockAnimals.find(animal => animal.id === id) || null;
}