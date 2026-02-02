export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-secondary via-secondary-dark to-secondary relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 right-20 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>
        <div className="absolute bottom-10 left-20 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-soft">
                <span className="text-secondary font-bold text-xl">🌱</span>
              </div>
              <div>
                <span className="font-bold text-xl text-white">AgroLink</span>
                <div className="text-xs text-secondary-lighter font-medium -mt-1">Farms</div>
              </div>
            </div>
            <p className="text-secondary-lighter font-light leading-relaxed">
              Connecting verified farms with buyers worldwide. Building trust in livestock trading.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-secondary-lighter text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse-soft"></span>
                <span className="font-medium">500+ Verified Farms</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <span>🛒</span> For Buyers
            </h3>
            <ul className="space-y-3 text-secondary-lighter">
              <li>
                <a href="/animals" className="hover:text-white transition-all hover:translate-x-1 flex items-center gap-2 group">
                  <span className="group-hover:scale-110 transition-transform">🐄</span>
                  Browse Animals
                </a>
              </li>
              <li>
                <a href="/farms" className="hover:text-white transition-all hover:translate-x-1 flex items-center gap-2 group">
                  <span className="group-hover:scale-110 transition-transform">🏡</span>
                  View Farms
                </a>
              </li>
              <li>
                <a href="/how-it-works" className="hover:text-white transition-all hover:translate-x-1 flex items-center gap-2 group">
                  <span className="group-hover:scale-110 transition-transform">❓</span>
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* For Sellers */}
          <div className="space-y-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <span>🌾</span> For Sellers
            </h3>
            <ul className="space-y-3 text-secondary-lighter">
              <li>
                <a href="/become-seller" className="hover:text-white transition-all hover:translate-x-1 flex items-center gap-2 group">
                  <span className="group-hover:scale-110 transition-transform">🚀</span>
                  Become a Seller
                </a>
              </li>
              <li>
                <a href="/seller-guide" className="hover:text-white transition-all hover:translate-x-1 flex items-center gap-2 group">
                  <span className="group-hover:scale-110 transition-transform">📖</span>
                  Seller Guide
                </a>
              </li>
              <li>
                <a href="/pricing" className="hover:text-white transition-all hover:translate-x-1 flex items-center gap-2 group">
                  <span className="group-hover:scale-110 transition-transform">💰</span>
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div className="space-y-4">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <span>🛡️</span> Support
            </h3>
            <ul className="space-y-3 text-secondary-lighter">
              <li>
                <a href="/contact" className="hover:text-white transition-all hover:translate-x-1 flex items-center gap-2 group">
                  <span className="group-hover:scale-110 transition-transform">📞</span>
                  Contact Us
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-white transition-all hover:translate-x-1 flex items-center gap-2 group">
                  <span className="group-hover:scale-110 transition-transform">🔒</span>
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition-all hover:translate-x-1 flex items-center gap-2 group">
                  <span className="group-hover:scale-110 transition-transform">📋</span>
                  Terms of Service
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider with gradient */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-secondary-light/30"></div>
          </div>
          <div className="relative flex justify-center">
            <div className="bg-gradient-to-r from-secondary via-secondary-light to-secondary px-6 py-1 rounded-full">
              <div className="w-2 h-2 bg-white/50 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-secondary-lighter">
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium">&copy; 2026 AgroLink Farms. All rights reserved.</p>
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse-soft"></span>
              <span>Trusted Platform</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-white transition-all hover:scale-110 flex items-center gap-2 group">
              <span className="text-lg group-hover:animate-bounce">🐦</span>
              <span className="text-sm font-medium">Twitter</span>
            </a>
            <a href="#" className="hover:text-white transition-all hover:scale-110 flex items-center gap-2 group">
              <span className="text-lg group-hover:animate-bounce">📘</span>
              <span className="text-sm font-medium">Facebook</span>
            </a>
            <a href="#" className="hover:text-white transition-all hover:scale-110 flex items-center gap-2 group">
              <span className="text-lg group-hover:animate-bounce">📷</span>
              <span className="text-sm font-medium">Instagram</span>
            </a>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-8 pt-8 border-t border-secondary-light/20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-lg font-bold text-white">500+</div>
              <div className="text-xs text-secondary-lighter">Verified Farms</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-white">2.5K+</div>
              <div className="text-xs text-secondary-lighter">Active Listings</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-white">15K+</div>
              <div className="text-xs text-secondary-lighter">Happy Buyers</div>
            </div>
            <div className="space-y-1">
              <div className="text-lg font-bold text-white">98%</div>
              <div className="text-xs text-secondary-lighter">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
