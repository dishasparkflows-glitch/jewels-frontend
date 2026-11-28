import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import LuxuryDivider from '../../components/common/LuxuryDivider';
import { reviewsAPI } from '../../api/services';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { getMediaUrl } from '../../utils/imageUrl';
import { HiOutlineHome, HiOutlineChevronRight, HiOutlineChatAlt2, HiStar } from 'react-icons/hi';

export default function Reviews() {
  const { brandName } = useStoreSettings();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    reviewsAPI
      .getApproved({ limit: 50 })
      .then((res) => {
        if (!active) return;
        const list = res?.data?.data?.items || res?.data?.data || [];
        setReviews(Array.isArray(list) ? list : []);
      })
      .catch((err) => {
        console.error('Failed to load customer reviews:', err);
        if (active) setReviews([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return null;
    const total = reviews.reduce((sum, item) => sum + (Number(item?.review?.rating) || 0), 0);
    return (total / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <div className="min-h-screen bg-[#fbfaf8] text-stone-900 pb-20">
      <SEO
        title={`Customer Reviews | ${brandName}`}
        description={`Read verified customer stories and ratings for handcrafted jewellery from ${brandName}.`}
      />

      {/* Header */}
      <div className="border-b border-stone-200/80 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-8">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-stone-500 mb-6">
            <Link to="/" className="inline-flex items-center gap-1 hover:text-stone-900 transition-colors">
              <HiOutlineHome className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <HiOutlineChevronRight className="w-3 h-3 text-stone-300" />
            <span className="text-stone-900 font-medium">Customer Reviews</span>
          </nav>

          <div className="text-center max-w-2xl mx-auto">
            <h1 className="font-serif lining-nums text-2xl sm:text-3xl md:text-[34px] font-normal text-stone-900 tracking-tight">
              Loved by {brandName} Patrons
            </h1>
            <LuxuryDivider className="mt-3 mb-3" />
            {averageRating ? (
              <p className="text-xs sm:text-sm text-stone-600 lining-nums">
                Rated <span className="font-semibold text-stone-900">{averageRating} / 5</span> across{' '}
                <span className="font-semibold text-stone-900">{reviews.length}</span> verified customer{' '}
                {reviews.length === 1 ? 'review' : 'reviews'}
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-stone-500">
                Verified experiences shared by our fine jewellery customers.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Reviews Grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="rounded-2xl border border-stone-200 bg-white p-6 space-y-4">
                <div className="h-44 bg-stone-100 rounded-xl" />
                <div className="h-4 w-28 bg-stone-200 rounded" />
                <div className="h-5 w-3/4 bg-stone-200 rounded" />
                <div className="h-16 bg-stone-100 rounded" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="max-w-md mx-auto rounded-2xl border border-stone-200 bg-white p-10 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
              <HiOutlineChatAlt2 className="w-6 h-6" />
            </div>
            <h2 className="font-serif text-xl text-stone-900">No Reviews Yet</h2>
            <p className="text-xs sm:text-sm text-stone-500">
              Verified customer stories will appear here once published.
            </p>
            <Link
              to="/shop"
              style={{ backgroundColor: 'var(--btn-primary-bg, #8b6f4e)' }}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-full text-white text-xs font-semibold tracking-wider uppercase hover:brightness-95 transition-all"
            >
              Explore Jewellery
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((item) => {
              const rating = Math.max(1, Math.min(5, Number(item?.review?.rating) || 5));
              const imageUrl = getMediaUrl(item?.image?.url);
              const reviewerName = String(item?.customer?.name || 'Verified Customer').trim();
              const reviewTitle = String(item?.review?.title || '').trim();
              const reviewComment = String(item?.review?.comment || '').trim();
              const rawDate = item?.review?.reviewDate || item?.meta?.createdAt;
              const formattedDate = rawDate
                ? new Date(rawDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : '';

              return (
                <article
                  key={item._id}
                  className="flex flex-col rounded-2xl border border-stone-200/90 bg-white overflow-hidden shadow-2xs hover:shadow-md transition-shadow"
                >
                  {imageUrl && (
                    <div className="aspect-[4/3] w-full bg-stone-100 overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={reviewTitle || reviewerName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="flex flex-col flex-1 p-5 sm:p-6">
                    <div className="flex items-center gap-0.5 mb-2.5" aria-label={`${rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <HiStar
                          key={star}
                          className={`w-4 h-4 ${star <= rating ? 'text-amber-500' : 'text-stone-200'}`}
                        />
                      ))}
                    </div>

                    {reviewTitle && (
                      <h2 className="font-serif text-lg font-medium text-stone-900 mb-2 leading-snug">
                        {reviewTitle}
                      </h2>
                    )}

                    {reviewComment && (
                      <p className="text-xs sm:text-sm text-stone-600 leading-relaxed flex-1">
                        {reviewComment}
                      </p>
                    )}

                    <div className="mt-4 pt-3.5 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-stone-900 truncate">{reviewerName}</span>
                      {formattedDate && (
                        <span className="text-stone-400 shrink-0 lining-nums">{formattedDate}</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
