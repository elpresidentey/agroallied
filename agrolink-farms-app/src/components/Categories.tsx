import Link from 'next/link';

const categories = [
  { name: 'Cows', icon: '🐄', href: '/animals?category=cows' },
  { name: 'Goats', icon: '🐐', href: '/animals?category=goats' },
  { name: 'Poultry', icon: '🐔', href: '/animals?category=poultry' },
  { name: 'Fish', icon: '🐠', href: '/animals?category=fish' },
  { name: 'Dogs', icon: '🐕', href: '/animals?category=dogs' },
  { name: 'Others', icon: '🦙', href: '/animals?category=others' },
];

export default function Categories() {
  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Browse by Category</h2>
          <p className="text-lg text-gray-600">Find the livestock you need</p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => (
            <Link key={category.name} href={category.href}>
              <div className="card text-center hover:shadow-medium hover:border-secondary transition-all duration-300 cursor-pointer group h-full flex flex-col items-center justify-center gap-3 min-h-32">
                <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform duration-300">
                  {category.icon}
                </span>
                <p className="font-bold text-sm sm:text-base text-gray-900 group-hover:text-secondary transition-colors">
                  {category.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
