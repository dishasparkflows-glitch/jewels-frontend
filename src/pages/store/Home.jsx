import { Link } from 'react-router-dom';
import { products, categories } from '../../data/products';
import { useCart } from '../../contexts/CartContext';
import {
  HiOutlineSparkles,
  HiOutlineArrowNarrowRight,
  HiOutlineShoppingBag,
  HiStar,
} from 'react-icons/hi';

const Home = () => {
  const { addToCart } = useCart();
  const featuredProducts = products.filter((p) => p.featured);

  return (
    <div className="space-y-24 pb-20">
      {/* ─── Hero Section ───────────────────────────────────── */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-surface-950 via-surface-900 to-surface-950 px-4 sm:px-6 lg:px-8">
        {/* Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 py-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-xs font-semibold uppercase tracking-widest animate-fade-in">
            <HiOutlineSparkles className="w-4 h-4 text-gold-400" />
            <span>The 2026 Solitaire & High Jewelry Collection</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1]">
            Timeless Masterpieces <br />
            <span className="gold-gradient-text italic font-normal">
              Handcrafted for Eternity
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-surface-300 font-light leading-relaxed">
            Discover bespoke solitaire engagement rings, radiant emerald pendants, and ethically certified GIA diamonds designed to celebrate life's most momentous chapters.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/shop" className="btn-gold w-full sm:w-auto text-base tracking-wider uppercase">
              Explore Collection
            </Link>
            <Link
              to="/shop?category=diamonds"
              className="btn-gold-outline w-full sm:w-auto text-base tracking-wider uppercase flex items-center justify-center gap-2"
            >
              <span>Certified Diamonds</span>
              <HiOutlineArrowNarrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Shop By Category ─────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs uppercase tracking-[0.25em] text-gold-400 font-semibold">
            Curated Categories
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white">
            Explore By Silhouette
          </h2>
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent mx-auto" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              to={cat.id === 'all' ? '/shop' : `/shop?category=${cat.id}`}
              className="group bg-surface-900/60 hover:bg-surface-800/80 border border-surface-800 hover:border-gold-500/40 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-gold-500/10"
            >
              <div className="text-3xl mb-3 group-hover:scale-125 transition-transform duration-300">
                {cat.icon}
              </div>
              <h3 className="text-sm font-semibold text-white tracking-wide group-hover:text-gold-300 transition-colors">
                {cat.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── Featured High Jewelry ────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-gold-400 font-semibold">
              Signature Pieces
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mt-1">
              Featured Creations
            </h2>
          </div>
          <Link
            to="/shop"
            className="text-gold-400 hover:text-gold-300 font-medium text-sm flex items-center gap-1.5 group"
          >
            <span>View All Creations</span>
            <HiOutlineArrowNarrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="group bg-surface-900/50 rounded-2xl border border-surface-800 overflow-hidden hover:border-gold-500/40 transition-all duration-300 hover:shadow-xl flex flex-col"
            >
              {/* Product Image */}
              <Link to={`/product/${product.id}`} className="relative h-64 overflow-hidden bg-surface-950">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 right-3 bg-surface-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-semibold text-gold-400 border border-gold-500/30">
                  Featured
                </div>
              </Link>

              {/* Product Content */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-xs mb-1.5">
                    <HiStar className="w-4 h-4 fill-amber-400" />
                    <span className="font-semibold text-white">{product.rating}</span>
                    <span className="text-surface-500">({product.reviewsCount})</span>
                  </div>
                  <Link
                    to={`/product/${product.id}`}
                    className="font-serif text-lg font-semibold text-white group-hover:text-gold-300 transition-colors line-clamp-1"
                  >
                    {product.name}
                  </Link>
                  <p className="text-xs text-surface-400 mt-1 line-clamp-2">
                    {product.description}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-surface-800/80 flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-white tracking-tight">
                      ${product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="text-xs text-surface-500 line-through ml-2">
                        ${product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => addToCart(product, 1)}
                    className="p-2.5 rounded-xl bg-gold-500/10 hover:bg-gold-500 text-gold-300 hover:text-surface-950 border border-gold-500/30 transition-all duration-200"
                    title="Add to Shopping Bag"
                  >
                    <HiOutlineShoppingBag className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Atelier Heritage Banner ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-surface-900 via-surface-800 to-surface-900 border border-gold-500/20 p-8 sm:p-12 lg:p-16">
          <div className="max-w-2xl space-y-6">
            <span className="text-xs uppercase tracking-[0.3em] text-gold-400 font-semibold">
              The Jewels Atelier
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-white leading-tight">
              Bespoke Creations Crafted to Your Exacting Vision
            </h2>
            <p className="text-surface-300 text-sm sm:text-base leading-relaxed">
              From selecting the rarest conflict-free diamonds to shaping personalized settings in pure platinum and 18K gold, our private atelier brings your romantic narrative to life.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <Link to="/shop" className="btn-gold text-sm tracking-wider uppercase">
                Schedule Private Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
