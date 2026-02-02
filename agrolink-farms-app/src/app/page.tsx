import Link from 'next/link';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Categories from '@/components/Categories';
import Footer from '@/components/Footer';
import { SectionBackground, SectionBackgroundErrorBoundary } from '@/lib/images/components';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Categories />

        {/* Featured Farms Section */}
        <SectionBackgroundErrorBoundary section="featured-farms">
          <SectionBackground 
            section="featured-farms"
            overlay={true}
            overlayOpacity={0.6}
            className="py-16 sm:py-24"
          >
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16 animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-sm border border-green-200 rounded-full px-4 py-2 text-sm font-medium text-green-600 shadow-md mb-6">
                <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse-soft"></div>
                Featured Partners
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
                Trusted <span className="text-green-400">Nigerian Farms</span>
              </h2>
              <p className="text-lg sm:text-xl text-green-100 max-w-2xl mx-auto font-light">
                Discover verified farms from across Nigeria with proven track records
              </p>
            </div>

            {/* Enhanced Placeholder Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Kano Livestock Farm", location: "Kano State", rating: "4.9", animals: "120+" },
                { name: "Ogun Agro Ranch", location: "Ogun State", rating: "4.8", animals: "85+" },
                { name: "Kaduna Heritage Farm", location: "Kaduna State", rating: "5.0", animals: "200+" }
              ].map((farm, i) => (
                <div key={i} className="bg-white/95 backdrop-blur-sm rounded-lg border border-white/20 hover:border-green-300 hover:shadow-lg transition-all duration-300 overflow-hidden animate-fade-in-scale" style={{animationDelay: `${i * 0.2}s`}}>
                  <div className="relative">
                    <div className="h-40 bg-gray-100 flex items-center justify-center relative">
                      <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-md text-xs font-semibold text-green-600 flex items-center gap-1 shadow-sm">
                        {farm.rating}
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-gray-900">{farm.name}</h3>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 flex items-center gap-1">
                          {farm.location}
                        </span>
                        <span className="text-green-600 font-semibold bg-green-50 px-2 py-1 rounded-md">
                          {farm.animals} Animals
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full transition-all duration-500" style={{width: `${90 + i * 5}%`}}></div>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">Verified</span>
                      </div>
                      <div className="pt-2">
                        <button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200">
                          View Farm
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center mt-12 animate-fade-in-up" style={{animationDelay: '0.8s'}}>
              <Link href="/farms" className="btn-secondary bg-white/90 backdrop-blur-sm hover:bg-white text-green-600 hover:text-green-700">
                View All Farms
              </Link>
            </div>
          </div>
        </SectionBackground>
        </SectionBackgroundErrorBoundary>

        {/* Enhanced CTA Section */}
        <SectionBackgroundErrorBoundary section="cta">
          <SectionBackground 
            section="cta"
            overlay={true}
            overlayOpacity={0.7}
            className="py-16 sm:py-24 bg-green-600"
          >
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 animate-fade-in-up">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Ready to get started?
              </h2>
              <p className="text-lg sm:text-xl text-green-100 max-w-2xl mx-auto font-light">
                Join thousands of verified farms and buyers on AgroLink. Start your journey today.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
              <Link href="/signup" className="btn-accent text-lg px-8 py-4">
                Sign Up Now
              </Link>
              <Link href="/animals" className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-green-600 font-semibold px-8 py-4 rounded-xl transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 hover:shadow-md">
                Browse Animals
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="space-y-2">
                <div className="text-2xl sm:text-3xl font-bold text-white">500+</div>
                <div className="text-sm text-green-100">Verified Farms</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl sm:text-3xl font-bold text-white">2.5K+</div>
                <div className="text-sm text-green-100">Active Listings</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl sm:text-3xl font-bold text-white">15K+</div>
                <div className="text-sm text-green-100">Happy Buyers</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl sm:text-3xl font-bold text-white">98%</div>
                <div className="text-sm text-green-100">Satisfaction</div>
              </div>
            </div>
          </div>
        </SectionBackground>
        </SectionBackgroundErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
