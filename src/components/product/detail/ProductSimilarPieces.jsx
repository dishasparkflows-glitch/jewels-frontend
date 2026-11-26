import PropTypes from 'prop-types';
import ProductCard from '../ProductCard';

/**
 * "MOST LIKED PIECES" recommendation shelf
 */
export default function ProductSimilarPieces({ mostLikedProducts = [] }) {
  if (!mostLikedProducts || mostLikedProducts.length === 0) return null;

  return (
    <div className="pt-6 sm:pt-8 border-t border-stone-200 mt-6 sm:mt-8">
      <div className="mb-5 sm:mb-6 text-center">
        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-stone-900 font-sans">
          MOST LIKED PIECES
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-3.5 md:gap-4">
        {mostLikedProducts.map((item) => (
          <ProductCard
            key={item._id || item.id || item.basicInfo?.slug || item.slug}
            product={item}
            showSimilarButton={false}
          />
        ))}
      </div>
    </div>
  );
}

ProductSimilarPieces.propTypes = {
  mostLikedProducts: PropTypes.array,
};
