import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AnimalCard from '@/components/AnimalCard';
import { Animal } from '@/types';
import { createClient } from '@/lib/supabase-server';

interface SearchParams {
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
}

async function AnimalsList({ searchParams }: { searchParams: Promise<SearchParams> }) {
  try {
    const params = await searchParams;
    const supabase = createClient();

    // Fetch animals from Supabase
    const { data, error } = await supabase
      .from('animals')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching animals:', error);
      throw error;
    }

    let animals: Animal[] = data || [];

    // Filter by category
    if (params.category && params.category !== 'all') {
      animals = animals.filter((a) => a.type === params.category);
    }

    // Filter by search term
    if (params.search) {
      const query = params.search.toLowerCase();
      animals = animals.filter(
        (a) =>
          a.breed.toLowerCase().includes(query) ||
          a.type.toLowerCase().includes(query) ||
          (a.description?.toLowerCase().includes(query) ?? false)
      );
    }

    // Filter by price
    if (params.minPrice || params.maxPrice) {
      const minPrice = parseInt(params.minPrice || '0');
      const maxPrice = parseInt(params.maxPrice || '999999999');
      animals = animals.filter((a) => a.price >= minPrice && a.price <= maxPrice);
    }

    if (animals.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-2xl font-bold text-gray-800">No animals found</p>
          <p className="text-gray-600 mt-2">Try adjusting your filters</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {animals.map((animal) => (
          <AnimalCard key={animal.id} animal={animal} />
        ))}
      </div>
    );
  } catch (error) {
    console.error('Failed to load animals:', error);
    return (
      <div className="text-center py-12">
        <p className="text-2xl font-bold text-gray-800">Failed to load animals</p>
        <p className="text-gray-600 mt-2">Please try again later</p>
      </div>
    );
  }
}

export const metadata = {
  title: 'Browse Animals | AgroLink Farms',
  description: 'Discover verified livestock from trusted farms across India',
};

export default function AnimalsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const categories = [
    { id: 'all', label: 'All Animals' },
    { id: 'cattle', label: '🐄 Cattle' },
    { id: 'goat', label: '🐐 Goats' },
    { id: 'sheep', label: '🐑 Sheep' },
    { id: 'poultry', label: '🐔 Poultry' },
    { id: 'pig', label: '🐷 Pigs' },
  ];

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 text-white py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-bold mb-2">Browse Livestock</h1>
            <p className="text-green-100">Discover verified animals from trusted farms</p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Filters */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Category</h2>
            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`/animals${cat.id !== 'all' ? `?category=${cat.id}` : ''}`}
                  className={`px-4 py-2 rounded-full font-semibold transition-colors bg-white text-gray-900 border-2 border-gray-200 hover:border-green-700`}
                >
                  {cat.label}
                </a>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <form className="mb-8 flex gap-3">
            <input
              type="text"
              name="search"
              placeholder="Search by breed or type..."
              className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-green-700"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-bold rounded-lg transition-colors"
            >
              Search
            </button>
          </form>

          {/* Animals Grid */}
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-200 rounded-lg h-96 animate-pulse"
                  ></div>
                ))}
              </div>
            }
          >
            <AnimalsList searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
