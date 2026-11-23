import { useState } from 'react';
import PropTypes from 'prop-types';
import { HiOutlineX } from 'react-icons/hi';
import { IoStar } from 'react-icons/io5';

/**
 * Write a Customer Review Modal
 */
export default function ProductWriteReviewModal({
  isOpen = false,
  onClose,
  newReview,
  setNewReview,
  onSubmit,
  submittingReview = false,
}) {
  const [hoverRating, setHoverRating] = useState(0);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 animate-scaleUp max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8f6d43]">
              Share Your Story
            </span>
            <h3 className="text-lg font-bold font-serif text-stone-900">
              Write a Customer Review
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <HiOutlineX className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Star Rating Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-900">
              Overall Rating <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50/60">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setNewReview({ ...newReview, rating: star })}
                    className="p-1 cursor-pointer transition-transform hover:scale-110"
                  >
                    <IoStar
                      className={`w-6 h-6 transition-colors ${
                        star <= (hoverRating || newReview.rating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-stone-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-xs font-bold text-stone-800 ml-2">
                {hoverRating || newReview.rating} of 5 Stars
              </span>
            </div>
          </div>

          {/* Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800">
                Your Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Priya Sharma"
                value={newReview.name}
                onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-[#8f6d43] focus:ring-1 focus:ring-[#8f6d43]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800">
                Email Address <span className="text-stone-400 font-normal">(Private)</span>
              </label>
              <input
                type="email"
                placeholder="e.g. priya@example.com"
                value={newReview.email}
                onChange={(e) => setNewReview({ ...newReview, email: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-[#8f6d43] focus:ring-1 focus:ring-[#8f6d43]"
              />
            </div>
          </div>

          {/* Review Headline */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-800">
              Review Headline <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Absolutely stunning sparkle and quality!"
              value={newReview.title}
              onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-[#8f6d43] focus:ring-1 focus:ring-[#8f6d43]"
            />
          </div>

          {/* Review Body */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-800">
              Your Review <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows="4"
              required
              placeholder="Share details about the craftsmanship, fit, sparkle, and your overall experience..."
              value={newReview.comment}
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs sm:text-[13px] bg-white border border-stone-300 rounded-xl focus:outline-none focus:border-[#8f6d43] focus:ring-1 focus:ring-[#8f6d43] resize-y"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={submittingReview}
              className="flex-1 py-3 px-5 rounded-xl bg-[#1f3a2b] hover:bg-[#15271d] text-white text-xs font-bold tracking-wider uppercase transition-colors shadow-sm cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submittingReview ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <span>Submit Review</span>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

ProductWriteReviewModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  newReview: PropTypes.object,
  setNewReview: PropTypes.func,
  onSubmit: PropTypes.func,
  submittingReview: PropTypes.bool,
};
