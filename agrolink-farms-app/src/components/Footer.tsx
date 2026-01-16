export default function Footer() {
  return (
    <footer className="bg-secondary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-secondary font-bold">A</span>
              </div>
              <span className="font-bold text-lg">AgroLink</span>
            </div>
            <p className="text-secondary-lighter">
              Connecting verified farms with buyers worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold mb-4">For Buyers</h3>
            <ul className="space-y-2 text-secondary-lighter">
              <li>
                <a href="/animals" className="hover:text-white transition-colors">
                  Browse Animals
                </a>
              </li>
              <li>
                <a href="/farms" className="hover:text-white transition-colors">
                  View Farms
                </a>
              </li>
              <li>
                <a href="/how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
            </ul>
          </div>

          {/* For Sellers */}
          <div>
            <h3 className="font-bold mb-4">For Sellers</h3>
            <ul className="space-y-2 text-secondary-lighter">
              <li>
                <a href="/become-seller" className="hover:text-white transition-colors">
                  Become a Seller
                </a>
              </li>
              <li>
                <a href="/seller-guide" className="hover:text-white transition-colors">
                  Seller Guide
                </a>
              </li>
              <li>
                <a href="/pricing" className="hover:text-white transition-colors">
                  Pricing
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-bold mb-4">Legal</h3>
            <ul className="space-y-2 text-secondary-lighter">
              <li>
                <a href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-secondary-light mb-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-secondary-lighter text-sm">
          <p>&copy; 2026 AgroLink Farms. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">
              Twitter
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Facebook
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Instagram
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
