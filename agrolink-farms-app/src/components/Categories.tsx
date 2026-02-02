import Link from 'next/link';
import { CategoryImage, CategoryImageErrorBoundary } from '@/lib/images/components';

const categories = [
  { name: 'Cows', href: '/animals?category=cows' },
  { name: 'Goats', href: '/animals?category=goats' },
  { name: 'Poultry', href: '/animals?category=poultry' },
  { name: 'Fish', href: '/animals?category=fish' },
  { name: 'Dogs', href: '/animals?category=dogs' },
  { name: 'Others', href: '/animals?category=others' },
];

export default function Categories() {
  return (
    <section className="py-16 sm:py-24 bg-white relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 right-10 w-32 h-32 bg-green-100 rounded-full blur-2xl"></div>
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-amber-100 rounded-full blur-2xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-white border border-green-200 rounded-full px-4 py-2 text-sm font-medium text-green-600 shadow-md mb-6">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse-soft"></div>
            Explore Categories
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Browse by <span className="text-green-600">Category</span>
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto font-light">
            Find the perfect livestock for your needs from our verified farms
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category, index) => (
            <Link key={category.name} href={category.href}>
              <div 
                className="bg-white rounded-lg border border-gray-200 hover:border-green-400 hover:shadow-md text-center group h-full flex flex-col items-center justify-center gap-3 min-h-40 p-4 transition-all duration-300 animate-fade-in-scale overflow-hidden"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                {/* Category Image */}
                <div className="w-full h-20 mb-2">
                  <CategoryImageErrorBoundary category={category.name.toLowerCase()}>
                    <CategoryImage
                      category={category.name.toLowerCase()}
                      size="small"
                      lazy={true}
                      showAttribution={false}
                      className="w-full h-full rounded-md"
                    />
                  </CategoryImageErrorBoundary>
                </div>
                
                <div className="space-y-2">
                  <p className="font-semibold text-sm text-gray-900 group-hover:text-green-600 transition-colors">
                    {category.name}
                  </p>
                  <div className="w-6 h-0.5 bg-gray-300 group-hover:bg-green-500 group-hover:w-8 transition-all duration-300 mx-auto rounded-full"></div>
                  <button className="mt-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-1 px-3 rounded-md transition-colors duration-200">
                    Browse
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>


      </div>
    </section>
  );
}
