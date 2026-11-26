import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import ZoomableProductImage from './ZoomableProductImage';

/**
 * Product Studio Image Gallery
 * - Mobile (<sm): Interactive horizontal swipe carousel with indicator dots
 * - Desktop (sm+): Studio gallery grid with interactive loupe zoom
 */
export default function ProductGallery({
  galleryImages = [],
  product = {},
  selectedColor = '',
  openLightboxAtIndex,
}) {
  const mobileGalleryRef = useRef(null);
  const [activeMobileSlide, setActiveMobileSlide] = useState(0);

  const handleMobileGalleryScroll = (e) => {
    const el = e.currentTarget;
    if (!el || el.clientWidth === 0) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    if (idx !== activeMobileSlide) {
      setActiveMobileSlide(idx);
    }
  };

  const scrollToMobileSlide = (idx) => {
    if (mobileGalleryRef.current) {
      mobileGalleryRef.current.scrollTo({
        left: idx * mobileGalleryRef.current.clientWidth,
        behavior: 'smooth',
      });
      setActiveMobileSlide(idx);
    }
  };

  return (
    <div className="lg:col-span-7">
      {galleryImages.length > 0 ? (
        <div className="sticky top-24 space-y-2.5">
          {/* Mobile Slider View (< sm) */}
          <div className="sm:hidden relative">
            <div
              ref={mobileGalleryRef}
              onScroll={handleMobileGalleryScroll}
              className="flex overflow-x-auto snap-x snap-mandatory gap-2 no-scrollbar rounded-2xl"
            >
              {galleryImages.map((image, index) => (
                <div
                  key={`mob-${image}-${index}`}
                  className="w-full min-w-full snap-center shrink-0"
                >
                  <ZoomableProductImage
                    image={image}
                    index={index}
                    alt={`${product.basicInfo?.title || 'Fine Jewelry'} ${selectedColor} view ${index + 1}`}
                    onOpenLightbox={() => openLightboxAtIndex(index)}
                  />
                </div>
              ))}
            </div>

            {/* Mobile Indicator Dots */}
            {galleryImages.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 pt-2">
                {galleryImages.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    type="button"
                    onClick={() => scrollToMobileSlide(dotIdx)}
                    style={
                      activeMobileSlide === dotIdx
                        ? { backgroundColor: 'var(--btn-primary-bg, #8c6536)' }
                        : undefined
                    }
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activeMobileSlide === dotIdx ? 'w-5' : 'w-1.5 bg-stone-300'
                    }`}
                    aria-label={`Go to slide ${dotIdx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop Studio Gallery (sm+) - Centered if single image, 2-column grid if multiple */}
          {galleryImages.length === 1 ? (
            <div className="hidden sm:flex sm:justify-center sm:items-center py-2">
              <div className="w-full max-w-[480px] lg:max-w-[500px]">
                <ZoomableProductImage
                  image={galleryImages[0]}
                  index={0}
                  alt={`${product.basicInfo?.title || 'Fine Jewelry'} ${selectedColor} view 1`}
                  onOpenLightbox={() => openLightboxAtIndex(0)}
                />
              </div>
            </div>
          ) : (
            <div className="hidden sm:grid sm:grid-cols-2 gap-3 sm:gap-4">
              {galleryImages.map((image, index) => (
                <ZoomableProductImage
                  key={`${image}-${index}`}
                  image={image}
                  index={index}
                  alt={`${product.basicInfo?.title || 'Fine Jewelry'} ${selectedColor} view ${index + 1}`}
                  onOpenLightbox={() => openLightboxAtIndex(index)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="aspect-square bg-[#fbf9f6] rounded-sm border border-stone-100 flex items-center justify-center text-sm text-stone-400">
          Image coming soon
        </div>
      )}
    </div>
  );
}

ProductGallery.propTypes = {
  galleryImages: PropTypes.array,
  product: PropTypes.object,
  selectedColor: PropTypes.string,
  openLightboxAtIndex: PropTypes.func,
};
