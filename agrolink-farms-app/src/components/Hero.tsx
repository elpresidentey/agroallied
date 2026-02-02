import Link from 'next/link';
import { HeroImage, HeroImageErrorBoundary } from '@/lib/images/components';

export default function Hero() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28 lg:py-36 min-h-[600px]">
      {/* Dynamic Hero Background Image */}
      <div className="absolute inset-0">
        <HeroImageErrorBoundary>
          <HeroImage 
            className="w-full h-full"
            fallbackImage="/images/hero-fallback.svg"
          />
        </HeroImageErrorBoundary>
      </div>

      {/* Fallback decorative elements (shown when image fails) */}
      <div className="absolute inset-0 overflow-hidden opacity-30">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-green-100 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-amber-100 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-50 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-8 animate-fade-in-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white border border-green-200 rounded-full px-4 py-2 text-sm font-medium text-green-600 shadow-md">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse-soft"></div>
            Welcome to AgroLink Farms
          </div>

          {/* Main Headline */}
          <div className="space-y-6">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight">
              <span className="text-gray-900">Premium Farm Animals</span>
              <br />
              <span className="text-green-600">Direct from Trusted Farms</span>
            </h1>
            
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
              Connect directly with verified farms. Browse healthy livestock with complete health records,
              transparent pricing, and reliable delivery.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link href="/animals" className="btn-primary text-lg px-8 py-4">
              Browse Animals
            </Link>
            <Link href="/signup" className="btn-secondary text-lg px-8 py-4">
              Start Selling
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="pt-16">
            <p className="text-sm text-gray-500 mb-8 font-medium">Trusted by farmers and buyers nationwide</p>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="space-y-2 animate-fade-in-scale">
                <div className="text-3xl sm:text-4xl font-bold text-green-600">500+</div>
                <div className="text-sm text-gray-600 font-medium">Verified Farms</div>
              </div>
              <div className="space-y-2 animate-fade-in-scale" style={{animationDelay: '0.1s'}}>
                <div className="text-3xl sm:text-4xl font-bold text-green-600">2,500+</div>
                <div className="text-sm text-gray-600 font-medium">Active Listings</div>
              </div>
              <div className="space-y-2 animate-fade-in-scale" style={{animationDelay: '0.2s'}}>
                <div className="text-3xl sm:text-4xl font-bold text-green-600">15K+</div>
                <div className="text-sm text-gray-600 font-medium">Happy Buyers</div>
              </div>
              <div className="space-y-2 animate-fade-in-scale" style={{animationDelay: '0.3s'}}>
                <div className="text-3xl sm:text-4xl font-bold text-green-600">98%</div>
                <div className="text-sm text-gray-600 font-medium">Satisfaction Rate</div>
              </div>
            </div>
          </div>

          {/* Features Preview */}
          <div className="pt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center space-y-3 animate-fade-in-scale" style={{animationDelay: '0.4s'}}>
              <h3 className="font-semibold text-gray-800 text-sm">Verified Quality</h3>
              <p className="text-xs text-gray-600">All animals health-checked and certified</p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center space-y-3 animate-fade-in-scale" style={{animationDelay: '0.5s'}}>
              <h3 className="font-semibold text-gray-800 text-sm">Safe Delivery</h3>
              <p className="text-xs text-gray-600">Professional transport and handling</p>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-4 text-center space-y-3 animate-fade-in-scale" style={{animationDelay: '0.6s'}}>
              <h3 className="font-semibold text-gray-800 text-sm">Fair Pricing</h3>
              <p className="text-xs text-gray-600">Transparent costs, no hidden fees</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
