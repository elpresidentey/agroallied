import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Browse Farms - AgroLink Farms',
  description: 'Discover verified farms and their livestock listings',
};

export default function FarmsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">Browse Farms</h1>
          <p className="text-gray-600">Connect with verified farms across the region</p>
        </div>

        {/* Filters Section */}
        <div className="mb-8 space-y-4">
          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Search by farm name or location..."
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
            />
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary">
              <option>All Locations</option>
              <option>Lagos</option>
              <option>Abuja</option>
              <option>Ibadan</option>
              <option>Kano</option>
              <option>Others</option>
            </select>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <button className="px-4 py-2 bg-secondary text-white rounded-lg font-medium hover:bg-secondary-light transition-colors">
              Verified Only
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              High Rating
            </button>
            <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              Most Active
            </button>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-bold">0</span> farms
          </p>
        </div>

        {/* Empty State */}
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🏡</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No farms yet</h2>
          <p className="text-gray-600 mb-6">
            Farm listings will appear here once connected to the database.
          </p>
        </div>

        {/* Placeholder Grid for when data loads */}
        {/* This will be replaced with actual farm cards when connected to Supabase */}
      </main>

      <Footer />
    </div>
  );
}
