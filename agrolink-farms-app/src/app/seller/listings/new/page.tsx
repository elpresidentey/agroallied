'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createAnimal } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ImageUpload from '@/components/ImageUpload';

interface ListingFormData {
  type: string;
  breed: string;
  age: number;
  gender: string;
  price: number;
  quantity: number;
  description: string;
  healthCertificate?: boolean;
  vaccination?: string;
  imageUrl?: string;
}

export default function NewListingPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState<ListingFormData>({
    type: 'cattle',
    breed: '',
    age: 24,
    gender: 'female',
    price: 50000,
    quantity: 1,
    description: '',
    healthCertificate: false,
    vaccination: 'not_vaccinated',
    imageUrl: undefined,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not seller
  if (!loading && (!isAuthenticated || user?.role !== 'seller')) {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
        </div>
        <Footer />
      </>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['age', 'price', 'quantity'].includes(name)
        ? parseFloat(value)
        : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validate form
      if (!formData.breed.trim()) {
        throw new Error('Breed is required');
      }
      if (formData.price <= 0) {
        throw new Error('Price must be greater than 0');
      }
      if (formData.quantity < 1) {
        throw new Error('At least 1 animal must be available');
      }

      // Create animal in database with image
      const response = await createAnimal({
        type: formData.type,
        breed: formData.breed,
        age: formData.age,
        gender: formData.gender,
        price: formData.price,
        quantity: formData.quantity,
        description: formData.description,
        healthCertificate: formData.healthCertificate,
        vaccination: formData.vaccination,
        imageUrl: formData.imageUrl || null,
        farmId: user?.id,
      });
      
      console.log('Listing created:', response);
      // Show success and redirect
      alert('Listing created successfully!');
      router.push('/seller/listings');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  const animalTypes = [
    { value: 'cattle', label: '🐄 Cattle' },
    { value: 'goat', label: '🐐 Goats' },
    { value: 'sheep', label: '🐑 Sheep' },
    { value: 'poultry', label: '🐔 Poultry' },
    { value: 'pig', label: '🐷 Pigs' },
  ];

  const genders = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'mixed', label: 'Mixed' },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50 py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="mb-8">
            <a href="/seller/listings" className="text-green-700 hover:text-green-800 font-medium">
              ← Back to Listings
            </a>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Listing</h1>
            <p className="text-gray-600">Add a new animal to your farm inventory</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-red-800 font-semibold">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8">
            {/* Animal Type & Breed */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Animal Type *
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-700"
                >
                  {animalTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Breed *
                </label>
                <input
                  type="text"
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                  placeholder="e.g., Holstein Friesian, Boer Goat"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-700"
                />
              </div>
            </div>

            {/* Physical Characteristics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Age (Months) *
                </label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-700"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Health Certificate
                </label>
                <input
                  type="checkbox"
                  name="healthCertificate"
                  checked={formData.healthCertificate || false}
                  onChange={(e) => setFormData(prev => ({...prev, healthCertificate: e.target.checked}))}
                  className="w-4 h-4"
                />
                <span className="ml-2 text-sm text-gray-600">This animal has a health certificate</span>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-700"
                >
                  {genders.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pricing & Availability */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-700"
                />
                <p className="text-xs text-gray-500 mt-1">Price per unit</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Available Count *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  min="1"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-700"
                />
                <p className="text-xs text-gray-500 mt-1">How many available for sale</p>
              </div>
            </div>

            {/* Description */}
            <div className="mb-8">
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the animal, health status, vaccination records, production history, etc."
                rows={5}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-700"
              />
            </div>

            {/* Health & Certifications */}
            <div className="mb-8 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900 mb-3">
                📋 <strong>Health Certifications (Optional)</strong>
              </p>
              <p className="text-xs text-blue-800">
                Coming soon: Upload vaccination records, health certificates, and breeding history documents
              </p>
            </div>

            {/* Image Upload - Optional */}
            <div className="mb-8">
              <ImageUpload
                onUpload={(url) =>
                  setFormData((prev) => ({ ...prev, imageUrl: url }))
                }
                maxFiles={1}
                folder="listings"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className={`flex-1 py-3 rounded-lg font-bold text-white transition-colors ${
                  submitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-700 hover:bg-green-800'
                }`}
              >
                {submitting ? 'Creating...' : 'Create Listing'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/seller/listings')}
                className="flex-1 py-3 rounded-lg font-bold text-green-700 border-2 border-green-700 hover:bg-green-50 transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Info Message */}
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-900">
                ✓ Your listing will be reviewed by our team before appearing on the marketplace
              </p>
            </div>
          </form>

          {/* Help Section */}
          <div className="mt-12 p-6 bg-white rounded-2xl shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tips for a Great Listing</h2>
            <ul className="space-y-3 text-gray-700">
              <li>✓ Include accurate breed and age information</li>
              <li>✓ Provide health history and vaccination details</li>
              <li>✓ Set competitive but fair pricing</li>
              <li>✓ Upload clear, well-lit photos</li>
              <li>✓ Write detailed descriptions</li>
              <li>✓ Be responsive to buyer inquiries</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
