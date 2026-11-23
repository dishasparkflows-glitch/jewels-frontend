import PropTypes from 'prop-types';
import { IoStar } from 'react-icons/io5';

const formatReviewDate = (d) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * Customer Reviews and Ratings section for Product Detail
 */
export default function ProductReviewsSection({
  reviewsLoading = false,
  sortedReviews = [],
}) {
  if (reviewsLoading || !sortedReviews || sortedReviews.length === 0) return null;

  return (
    <section id="customer-reviews" className="pt-6 sm:pt-8 border-t border-stone-200 mt-6 sm:mt-8 scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-5 sm:mb-6">
          <h2 className="text-xs sm:text-sm font-bold uppercase tracking-[0.25em] text-stone-900 font-sans">
            CUSTOMER REVIEWS &amp; RATINGS
          </h2>
        </div>

        {/* Reviews Cards Grid */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6">
            {sortedReviews.map((rev, idx) => {
              const reviewerName = rev.customer?.name || 'Verified Buyer';
              const rating = Number(rev.review?.rating || 5);
              const reviewTitle = rev.review?.title || '';
              const reviewComment = rev.review?.comment || '';
              const dateStr = formatReviewDate(rev.review?.reviewDate || rev.meta?.createdAt);

              return (
                <div
                  key={rev._id || `rev_${idx}`}
                  className="bg-[#FAF7F2] rounded-xl border border-[#EFE8DD] p-5 sm:p-6 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-3">
                    {/* Top: Customer Name & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-stone-900 text-sm sm:text-[15px]">
                        {reviewerName}
                      </h4>
                      <span className="text-xs sm:text-sm text-stone-500 font-normal shrink-0">
                        {dateStr}
                      </span>
                    </div>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <IoStar
                          key={s}
                          className={`w-4 h-4 ${s <= rating ? 'text-amber-500 fill-amber-500' : 'text-stone-300'}`}
                        />
                      ))}
                    </div>

                    {/* Review Title */}
                    {reviewTitle && (
                      <h5 className="font-bold text-stone-900 text-sm sm:text-[15px] leading-snug">
                        {reviewTitle}
                      </h5>
                    )}

                    {/* Review Comment */}
                    <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal whitespace-pre-line">
                      {reviewComment}
                    </p>
                  </div>

                  {/* Review Image (if customer uploaded photo) */}
                  {rev.image?.url && (
                    <div className="pt-2">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-stone-200/80 bg-white cursor-pointer hover:opacity-90 transition-opacity">
                        <img
                          src={rev.image.url}
                          alt={reviewTitle || 'Customer photo'}
                          className="w-full h-full object-cover"
                          onClick={() => window.open(rev.image.url, '_blank')}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

ProductReviewsSection.propTypes = {
  reviewsLoading: PropTypes.bool,
  sortedReviews: PropTypes.array,
};
