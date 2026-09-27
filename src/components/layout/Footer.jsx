import { Link } from 'react-router-dom';
import { HiOutlineShieldCheck, HiOutlineSparkles, HiOutlineTruck, HiOutlineRefresh } from 'react-icons/hi';

const Footer = () => {
  return (
    <footer className="bg-surface-950 text-surface-300 border-t border-surface-800">
      {/* Trust Badges Bar */}
      <div className="border-b border-surface-800/80 bg-surface-900/50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <HiOutlineShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">GIA Certified Diamonds</h4>
              <p className="text-xs text-surface-400 mt-0.5">100% Conflict-free & ethically sourced</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <HiOutlineTruck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Insured Global Delivery</h4>
              <p className="text-xs text-surface-400 mt-0.5">Complimentary for orders over $1,000</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <HiOutlineSparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Bespoke Craftsmanship</h4>
              <p className="text-xs text-surface-400 mt-0.5">Master jewelers with 30+ yrs heritage</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/30 flex items-center justify-center text-gold-400">
              <HiOutlineRefresh className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Lifetime Warranty</h4>
              <p className="text-xs text-surface-400 mt-0.5">Complimentary cleaning & annual care</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-300 to-amber-600 flex items-center justify-center text-surface-950 font-serif font-bold text-lg">
                J
              </div>
              <span className="font-serif text-2xl font-bold tracking-[0.2em] text-white">
                JEWELS
              </span>
            </div>
            <p className="text-sm text-surface-400 leading-relaxed max-w-sm">
              Crafting timeless fine jewelry, certified solitaires, and bespoke heirloom pieces inspired by royal traditions and contemporary artistry.
            </p>
            <div className="pt-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gold-400 block mb-2">
                Join The Privé Circle
              </span>
              <div className="flex gap-2 max-w-md">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="bg-surface-900 border border-surface-700 rounded-lg px-4 py-2 text-sm text-white placeholder-surface-500 focus:outline-none focus:border-gold-500 flex-1"
                />
                <button className="px-4 py-2 bg-gradient-to-r from-gold-500 to-amber-600 text-surface-950 font-semibold text-sm rounded-lg hover:brightness-110 transition-all">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Column 1 */}
          <div>
            <h5 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">High Jewelry</h5>
            <ul className="space-y-2.5 text-sm text-surface-400">
              <li><Link to="/shop?category=rings" className="hover:text-gold-400 transition-colors">Engagement Rings</Link></li>
              <li><Link to="/shop?category=diamonds" className="hover:text-gold-400 transition-colors">Solitaire Diamonds</Link></li>
              <li><Link to="/shop?category=necklaces" className="hover:text-gold-400 transition-colors">Pendants & Necklaces</Link></li>
              <li><Link to="/shop?category=earrings" className="hover:text-gold-400 transition-colors">Drop & Stud Earrings</Link></li>
              <li><Link to="/shop?category=bracelets" className="hover:text-gold-400 transition-colors">Diamond Tennis Bracelets</Link></li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h5 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Services</h5>
            <ul className="space-y-2.5 text-sm text-surface-400">
              <li><a href="#consultation" className="hover:text-gold-400 transition-colors">Private Virtual Consultation</a></li>
              <li><a href="#custom" className="hover:text-gold-400 transition-colors">Custom Ring Design</a></li>
              <li><a href="#resizing" className="hover:text-gold-400 transition-colors">Complimentary Resizing</a></li>
              <li><a href="#certification" className="hover:text-gold-400 transition-colors">GIA & IGI Verification</a></li>
              <li><a href="#care" className="hover:text-gold-400 transition-colors">Jewelry Cleaning & Care</a></li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h5 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Maison</h5>
            <ul className="space-y-2.5 text-sm text-surface-400">
              <li><a href="#heritage" className="hover:text-gold-400 transition-colors">Our Heritage</a></li>
              <li><a href="#sustainability" className="hover:text-gold-400 transition-colors">Ethical Sourcing</a></li>
              <li><a href="#press" className="hover:text-gold-400 transition-colors">Press & Accolades</a></li>
              <li><a href="#careers" className="hover:text-gold-400 transition-colors">Careers</a></li>
              <li><a href="#contact" className="hover:text-gold-400 transition-colors">Boutique Locations</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-surface-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-surface-500 gap-4">
          <p>© {new Date().getFullYear()} JEWELS Haute Joaillerie. All rights reserved.</p>
          <div className="flex gap-6">
            <span className="hover:text-gold-400 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gold-400 cursor-pointer">Terms of Service</span>
            <span className="hover:text-gold-400 cursor-pointer">GIA Diamond Guide</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
