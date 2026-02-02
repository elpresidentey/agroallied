// Core type definitions for AgroLink Farms

export type UserRole = 'buyer' | 'seller' | 'admin';

export type VerificationStatus = 'pending' | 'approved' | 'rejected' | 'unverified';

export type AnimalCategory = 'cows' | 'fish' | 'poultry' | 'goats' | 'dogs' | 'others';

export type HealthStatus = 'healthy' | 'vaccinated' | 'under_treatment' | 'unknown';

export type OrderStatus = 'inquiry' | 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface Farm {
  id: string;
  user_id: string;
  name: string;
  location: string;
  description?: string;
  verified: boolean;
  image_url?: string;
  rating?: number;
  created_at: string;
  updated_at?: string;
}

export interface Animal {
  id: string;
  name: string;
  type: 'cows' | 'goats' | 'poultry' | 'fish' | 'dogs' | 'others';
  breed: string;
  age: number;
  price: number;
  description: string;
  farm_id: string;
  seller_id: string;
  status: 'available' | 'sold' | 'reserved';
  created_at: string;
  updated_at?: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  animal_id: string;
  quantity: number;
  total_price: number;
  status: OrderStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  reviewer_id: string;
  farm_id?: string;
  animal_id?: string;
  rating: number; // 1-5
  comment?: string;
  created_at: string;
}
