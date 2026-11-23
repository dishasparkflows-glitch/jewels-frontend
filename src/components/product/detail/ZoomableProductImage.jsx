import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { isVideoMedia } from '../../../utils/productImages';

/**
 * High-definition interactive loupe zoom image / video card for product detail gallery
 */
export default function ZoomableProductImage({ image, alt, index, onOpenLightbox }) {
  const [isHovered, setIsHovered] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  const isVideo = isVideoMedia(image);
  const LENS_SIZE = 160;
  const ZOOM_FACTOR = 2.6;

  const handleMouseMove = (e) => {
    if (isVideo || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    setCoords({
      x,
      y,
      width: rect.width,
      height: rect.height,
    });
  };

  const handleMouseEnter = (e) => {
    if (!isVideo) {
      handleMouseMove(e);
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const lensLeft = coords.width > 0
    ? Math.max(0, Math.min(coords.x - LENS_SIZE / 2, coords.width - LENS_SIZE))
    : 0;
  const lensTop = coords.height > 0
    ? Math.max(0, Math.min(coords.y - LENS_SIZE / 2, coords.height - LENS_SIZE))
    : 0;

  return (
    <div
      ref={containerRef}
      onClick={onOpenLightbox}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleMouseLeave}
      className={`group relative aspect-square bg-[#fbf9f6] rounded-sm overflow-hidden border border-stone-100 flex items-center justify-center p-4 sm:p-6 select-none ${isVideo ? 'cursor-pointer' : 'cursor-crosshair'}`}
    >
      {isVideo ? (
        <div className="relative w-full h-full flex items-center justify-center">
          <video
            ref={videoRef}
            src={image}
            autoPlay
            loop
            muted
            playsInline
            controls
            preload="metadata"
            className="w-full h-full object-contain rounded-sm"
          />
        </div>
      ) : (
        <img
          src={image}
          alt={alt}
          className="w-full h-full object-contain pointer-events-none"
          loading={index < 2 ? 'eager' : 'lazy'}
        />
      )}

      {/* Floating Magnifier Loupe Lens (Images only) */}
      {!isVideo && isHovered && coords.width > 0 && (
        <div
          className="absolute pointer-events-none z-30 border border-white/90 rounded-sm overflow-hidden bg-[#fbf9f6]"
          style={{
            width: `${LENS_SIZE}px`,
            height: `${LENS_SIZE}px`,
            left: `${lensLeft}px`,
            top: `${lensTop}px`,
            boxShadow:
              '0 16px 36px -4px rgba(0, 0, 0, 0.35), 0 6px 14px -2px rgba(0, 0, 0, 0.25), inset 0 0 0 1px rgba(255, 255, 255, 0.7)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: `${coords.width}px`,
              height: `${coords.height}px`,
              left: `${-lensLeft}px`,
              top: `${-lensTop}px`,
              transformOrigin: `${coords.x}px ${coords.y}px`,
              transform: `scale(${ZOOM_FACTOR})`,
            }}
            className="flex items-center justify-center p-4 sm:p-6 bg-[#fbf9f6]"
          >
            <img
              src={image}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Fullscreen Expansion Hint (Images only) */}
      {!isVideo && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full pointer-events-none z-10">
          Click to expand
        </div>
      )}
    </div>
  );
}

ZoomableProductImage.propTypes = {
  image: PropTypes.string,
  alt: PropTypes.string,
  index: PropTypes.number,
  onOpenLightbox: PropTypes.func,
};
