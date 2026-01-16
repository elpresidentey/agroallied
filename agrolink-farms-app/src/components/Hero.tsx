import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-primary-light to-white py-16 sm:py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
        {/* Tagline */}
        <div className="space-y-4">
          <p className="text-secondary font-bold text-sm sm:text-base tracking-wide uppercase">
            Welcome to AgroLink Farms
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
            Verified Farm Animals
            <br />
            <span className="text-secondary">Direct from Trusted Farms</span>
          </h1>
        </div>

        {/* Description */}
        <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
          Connect directly with verified farms. Browse healthy livestock with complete health records,
          transparent pricing, and reliable delivery. Your trusted marketplace for farm animals.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/animals"
            className="bg-secondary text-white px-8 py-3 rounded-lg font-bold hover:bg-secondary-light transition-colors shadow-soft"
          >
            Browse Animals
          </Link>
          <Link
            href="/become-seller"
            className="border-2 border-secondary text-secondary px-8 py-3 rounded-lg font-bold hover:bg-secondary hover:text-white transition-colors"
          >
            Become a Seller
          </Link>
        </div>

        {/* Stats */}
        <div className="pt-12 grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-bold text-secondary">500+</p>
            <p className="text-sm text-gray-600">Verified Farms</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-bold text-secondary">2K+</p>
            <p className="text-sm text-gray-600">Active Listings</p>
          </div>
          <div className="space-y-1">
            <p className="text-2xl sm:text-3xl font-bold text-secondary">10K+</p>
            <p className="text-sm text-gray-600">Happy Buyers</p>
          </div>
        </div>
      </div>
    </section>
  );
}
