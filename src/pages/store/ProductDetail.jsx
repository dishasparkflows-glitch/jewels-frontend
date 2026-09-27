import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { products } from '../../data/products';
import { useCart } from '../../contexts/CartContext';
import {
  HiStar,
  HiOutlineShoppingBag,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineSparkles,
  HiOutlineArrowNarrowLeft,
} from 'react-icons/hi';

const ProductDetail = () => {
  const { id } = useParams();
  const product = products.find((p) => p.id === id) || products[0];
  const [selectedMetal, setSelectedMetal] = useState(product?.metals?.[0] || '18K Yellow Gold');
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="font-serif text-3xl text-white">Piece Not Found</h2>
        <Link to="/shop" className="btn-gold text-xs uppercase tracking-wider">
          Return to High Jewelry
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      {/* Breadcrumb Back */}
      <Link
        to="/shop"
        className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-surface-400 hover:text-gold-300 transition-colors"
      >
        <HiOutlineArrowNarrowLeft className="w-4 h-4" />
        <span>Back to Collection</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        {/* Product Visual */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-surface-900 border border-surface-800 shadow-2xl relative">
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute top-4 right-4 bg-surface-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-gold-300 border border-gold-500/30">
              GIA Certified
            </div>
          </div>
        </div>

        {/* Product Purchase Actions & Info */}
        <div className="space-y-8">
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-[0.25em] text-gold-400 font-semibold">
              {product.category}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <HiStar key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="font-semibold text-white">{product.rating}</span>
              <span className="text-surface-500">({product.reviewsCount} verified reviews)</span>
            </div>
          </div>

          <div className="flex items-baseline gap-4">
            <span className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              ${product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-lg text-surface-500 line-through">
                ${product.originalPrice.toLocaleString()}
              </span>
            )}
            <span className="text-xs text-gold-400 font-medium px-2 py-0.5 rounded bg-gold-500/10 border border-gold-500/20">
              Includes Luxury Presentation Box
            </span>
          </div>

          <p className="text-sm text-surface-300 leading-relaxed font-light">
            {product.description}
          </p>

          {/* Metal Option Selector */}
          {product.metals && product.metals.length > 0 && (
            <div className="space-y-3">
              <label className="block text-xs uppercase tracking-wider font-semibold text-surface-300">
                Precious Metal: <span className="text-gold-300">{selectedMetal}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {product.metals.map((metal) => (
                  <button
                    key={metal}
                    type="button"
                    onClick={() => setSelectedMetal(metal)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold tracking-wider transition-all duration-200 border text-center ${
                      selectedMetal === metal
                        ? 'bg-gold-500/20 border-gold-400 text-white shadow-md shadow-gold-500/10'
                        : 'bg-surface-900 border-surface-800 text-surface-400 hover:text-white hover:border-surface-700'
                    }`}
                  >
                    {metal}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Add to Bag */}
          <div className="flex items-center gap-4 pt-2">
            <div className="flex items-center bg-surface-900 border border-surface-800 rounded-xl px-3 py-2 text-white">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-7 h-7 flex items-center justify-center text-surface-400 hover:text-white text-base"
              >
                −
              </button>
              <span className="w-10 text-center font-bold text-sm">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="w-7 h-7 flex items-center justify-center text-surface-400 hover:text-white text-base"
              >
                +
              </button>
            </div>

            <button
              onClick={() => addToCart(product, quantity, { selectedMetal })}
              className="btn-gold flex-1 flex items-center justify-center gap-2 text-xs sm:text-sm uppercase tracking-wider"
            >
              <HiOutlineShoppingBag className="w-5 h-5" />
              <span>Add to Shopping Bag</span>
            </button>
          </div>

          {/* Trust Guarantees */}
          <div className="border-t border-surface-800 pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-surface-400">
            <div className="flex items-center gap-2">
              <HiOutlineShieldCheck className="w-5 h-5 text-gold-400" />
              <span>GIA Dossier Included</span>
            </div>
            <div className="flex items-center gap-2">
              <HiOutlineTruck className="w-5 h-5 text-gold-400" />
              <span>Insured Overnight Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <HiOutlineSparkles className="w-5 h-5 text-gold-400" />
              <span>Lifetime Sizing & Polish</span>
            </div>
          </div>

          {/* Specifications List */}
          {product.details && (
            <div className="bg-surface-900/40 rounded-2xl border border-surface-800 p-6 space-y-3">
              <h3 className="text-xs uppercase tracking-wider font-semibold text-white">
                Masterpiece Specifications
              </h3>
              <ul className="space-y-2 text-xs text-surface-300">
                {product.details.map((detail, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-gold-400" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
