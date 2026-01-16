import { supabase } from './supabase';
import type { Animal, Farm, Order, User } from '@/types';

// Animals
export async function getAnimals(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('animals')
    .select('*, farms(name, verified, rating)')
    .eq('farms.verified', true)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAnimalById(animalId: string) {
  const { data, error } = await supabase
    .from('animals')
    .select('*, farms(id, name, location, verified, rating, image_url)')
    .eq('id', animalId)
    .single();

  if (error) throw error;
  return data as Animal & { farms: Farm };
}

export async function getAnimalsByCategory(category: string, limit = 20) {
  const { data, error } = await supabase
    .from('animals')
    .select('*, farms(name, verified, rating)')
    .eq('type', category)
    .eq('farms.verified', true)
    .limit(limit)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function searchAnimals(query: string, limit = 20) {
  const { data, error } = await supabase
    .from('animals')
    .select('*, farms(name, verified, rating)')
    .or(`breed.ilike.%${query}%,description.ilike.%${query}%`)
    .eq('farms.verified', true)
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function createAnimal(animalData: {
  type: string;
  breed: string;
  age: number;
  gender: string;
  price: number;
  quantity: number;
  description: string;
  healthCertificate?: boolean;
  vaccination?: string;
  imageUrl?: string | null;
  farmId?: string;
}) {
  const { data, error } = await supabase
    .from('animals')
    .insert({
      type: animalData.type,
      breed: animalData.breed,
      age: animalData.age,
      gender: animalData.gender,
      price: animalData.price,
      quantity: animalData.quantity,
      description: animalData.description,
      health_certified: animalData.healthCertificate || false,
      vaccination_status: animalData.vaccination || 'not_vaccinated',
      image_url: animalData.imageUrl,
      farm_id: animalData.farmId,
      status: 'active',
    })
    .select()
    .single();

  if (error) throw error;
  return data as Animal;
}

// Farms
export async function getFarms(limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .eq('verified', true)
    .range(offset, offset + limit - 1)
    .order('rating', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getFarmById(farmId: string) {
  const { data, error } = await supabase
    .from('farms')
    .select('*')
    .eq('id', farmId)
    .single();

  if (error) throw error;
  return data as Farm;
}

export async function getFarmListings(farmId: string) {
  const { data, error } = await supabase
    .from('animals')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Orders
export async function createOrder(buyerId: string, animalId: string, quantity: number, totalPrice: number, notes?: string) {
  const { data, error } = await supabase
    .from('orders')
    .insert({
      buyer_id: buyerId,
      animal_id: animalId,
      quantity,
      total_price: totalPrice,
      status: 'inquiry',
      notes,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Order;
}

export async function getOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, animals(*), farms(*)')
    .or(`buyer_id.eq.${userId},farms.owner_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSellerOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, animals(*), users(*)')
    .eq('farms.user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getBuyerOrders(userId: string) {
  const { data, error } = await supabase
    .from('orders')
    .select('*, animals(*), farms(*)')
    .eq('buyer_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// Users
export async function getUserById(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data as User;
}

// Stats
export async function getStats() {
  const [usersResponse, farmsResponse, animalsResponse, ordersResponse] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('farms').select('*', { count: 'exact', head: true }).eq('verified', true),
    supabase.from('animals').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
  ]);

  return {
    users: usersResponse.count || 0,
    farms: farmsResponse.count || 0,
    animals: animalsResponse.count || 0,
    orders: ordersResponse.count || 0,
  };
}
