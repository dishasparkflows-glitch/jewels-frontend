import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  HiOutlineX,
  HiChevronUp,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
  HiOutlinePlus,
  HiOutlineMinus,
  HiOutlineArrowsExpand,
} from 'react-icons/hi';
import { isVideoMedia } from '../../../utils/productImages';

/**
 * Luxury High-Resolution Image Viewer Lightbox Modal with Zoom, Pan, Thumbnail Strip & Color Switcher
 */
export default function ProductImageLightboxModal({
  isOpen = false,
  lightboxIndex = 0,
  setLightboxIndex,
  onClose,
  galleryImages = [],
  selectedColor = '',
  setSelectedColor,
  modalColorsToRender = [],
}) {
  const [isLightboxFullscreen, setIsLightboxFullscreen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxPan, setLightboxPan] = useState({ x: 0, y: 0 });
  const [isLightboxDragging, setIsLightboxDragging] = useState(false);

  const thumbnailContainerRef = useRef(null);
  const lightboxStageRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const lastLightboxWheelTimeRef = useRef(0);

  // Reset zoom & pan when image changes or modal opens
  useEffect(() => {
    setLightboxZoom(1);
    setLightboxPan({ x: 0, y: 0 });
  }, [lightboxIndex, isOpen]);

  // Keep active thumbnail visible in vertical strip when switching images
  useEffect(() => {
    if (isOpen && thumbnailContainerRef.current) {
      const activeThumb = thumbnailContainerRef.current.children[lightboxIndex];
      if (activeThumb?.scrollIntoView) {
        activeThumb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [lightboxIndex, isOpen]);

  // Mouse wheel scroll up/down on lightbox to switch images
  useEffect(() => {
    if (!isOpen) return;
    const stageEl = lightboxStageRef.current;
    if (!stageEl) return;

    const handleWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!galleryImages || galleryImages.length <= 1) return;

      const now = Date.now();
      if (now - lastLightboxWheelTimeRef.current < 250) {
        return;
      }

      if (Math.abs(e.deltaY) < 15) return;

      if (e.deltaY > 0) {
        setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
      } else if (e.deltaY < 0) {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
      }

      setLightboxZoom(1);
      setLightboxPan({ x: 0, y: 0 });
      lastLightboxWheelTimeRef.current = now;
    };

    stageEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      stageEl.removeEventListener('wheel', handleWheel);
    };
  }, [isOpen, galleryImages, setLightboxIndex]);

  if (!isOpen || lightboxIndex === null || !galleryImages[lightboxIndex]) return null;

  const handleLightboxMouseDown = (e) => {
    if (lightboxZoom <= 1) return;
    setIsLightboxDragging(true);
    dragStartRef.current = {
      x: e.clientX - lightboxPan.x,
      y: e.clientY - lightboxPan.y,
    };
  };

  const handleLightboxMouseMove = (e) => {
    if (!isLightboxDragging || lightboxZoom <= 1) return;
    const maxPan = (lightboxZoom - 1) * 250;
    const newX = Math.max(-maxPan, Math.min(maxPan, e.clientX - dragStartRef.current.x));
    const newY = Math.max(-maxPan, Math.min(maxPan, e.clientY - dragStartRef.current.y));
    setLightboxPan({ x: newX, y: newY });
  };

  const handleLightboxMouseUp = () => {
    setIsLightboxDragging(false);
  };

  const handleLightboxDoubleClick = () => {
    if (lightboxZoom > 1) {
      setLightboxZoom(1);
      setLightboxPan({ x: 0, y: 0 });
    } else {
      setLightboxZoom(2);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`bg-white shadow-2xl relative flex flex-col md:flex-row overflow-hidden transition-all duration-300 ${
          isLightboxFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-[820px] h-[75vh] max-h-[600px] rounded-2xl border border-stone-200/80'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button at top-right */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-2.5 right-2.5 z-30 p-1.5 rounded-full bg-white/90 hover:bg-white text-stone-500 hover:text-stone-900 shadow-sm border border-stone-200/60 transition-colors cursor-pointer"
          aria-label="Close image viewer"
        >
          <HiOutlineX className="w-4 h-4" />
        </button>

        {/* ─── COLUMN 1: Vertical Thumbnail Strip (Left) ─── */}
        <div className="hidden md:flex w-16 sm:w-20 shrink-0 flex-col items-center py-3 px-1.5 border-r border-stone-150 bg-[#FAFAFA]/80 select-none">
          <button
            type="button"
            onClick={() => {
              thumbnailContainerRef.current?.scrollBy({ top: -120, behavior: 'smooth' });
            }}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer mb-1.5"
            aria-label="Scroll thumbnails up"
          >
            <HiChevronUp className="w-4 h-4" />
          </button>

          <div
            ref={thumbnailContainerRef}
            className="flex-1 w-full overflow-y-auto no-scrollbar space-y-2 px-0.5 py-0.5"
          >
            {galleryImages.map((img, idx) => {
              const isActive = idx === lightboxIndex;
              const isVid = isVideoMedia(img);
              return (
                <button
                  key={`thumb-${img}-${idx}`}
                  type="button"
                  onClick={() => {
                    setLightboxIndex(idx);
                    setLightboxZoom(1);
                    setLightboxPan({ x: 0, y: 0 });
                  }}
                  className={`w-full aspect-square rounded-lg overflow-hidden p-0.5 bg-white cursor-pointer transition-all flex items-center justify-center relative ${
                    isActive
                      ? 'border-2 border-[#D4A373] ring-2 ring-[#D4A373]/20 shadow-xs scale-102'
                      : 'border border-stone-200/80 hover:border-stone-300 opacity-75 hover:opacity-100'
                  }`}
                >
                  {isVid ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-stone-50 text-[#C59B65]">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  ) : (
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => {
              thumbnailContainerRef.current?.scrollBy({ top: 120, behavior: 'smooth' });
            }}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition-colors cursor-pointer mt-1.5"
            aria-label="Scroll thumbnails down"
          >
            <HiChevronDown className="w-4 h-4" />
          </button>
        </div>

        {/* ─── COLUMN 2: Main Image Canvas Stage (Center) ─── */}
        <div className="flex-1 relative flex items-center justify-center bg-[#FDFBF7] overflow-hidden select-none min-h-[260px]">
          {/* TOP: Metal Color Swatches (Only displayed if dynamic metal colors exist) */}
          {modalColorsToRender && modalColorsToRender.length > 0 && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-full border border-stone-200/80 shadow-xs">
              <div className="flex items-center gap-1.5">
                {modalColorsToRender.map((c) => {
                  const isSelected = selectedColor?.toLowerCase() === c.name?.toLowerCase();
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => {
                        if (setSelectedColor) setSelectedColor(c.name);
                        setLightboxIndex(0);
                        setLightboxZoom(1);
                        setLightboxPan({ x: 0, y: 0 });
                      }}
                      className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full transition-all cursor-pointer shadow-inner relative flex items-center justify-center overflow-hidden border border-black/10 bg-white ${
                        isSelected
                          ? 'ring-2 ring-black ring-offset-1 ring-offset-white scale-110'
                          : 'hover:scale-105 opacity-80 hover:opacity-100'
                      }`}
                      style={c.variantIcon ? undefined : { background: c.gradient }}
                      title={c.name}
                    >
                      {c.variantIcon ? (
                        <img
                          src={c.variantIcon}
                          alt={c.name}
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Previous Image Arrow */}
          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setLightboxIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1));
                setLightboxZoom(1);
                setLightboxPan({ x: 0, y: 0 });
              }}
              className="absolute left-2.5 sm:left-3 z-20 w-8 h-8 rounded-full bg-white/95 hover:bg-white shadow-xs border border-stone-200/70 flex items-center justify-center text-stone-700 hover:text-black cursor-pointer transition-all hover:scale-105 active:scale-95"
              aria-label="Previous image"
            >
              <HiChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Next Image Arrow */}
          {galleryImages.length > 1 && (
            <button
              type="button"
              onClick={() => {
                setLightboxIndex((prev) => (prev + 1) % galleryImages.length);
                setLightboxZoom(1);
                setLightboxPan({ x: 0, y: 0 });
              }}
              className="absolute right-2.5 sm:right-3 z-20 w-8 h-8 rounded-full bg-white/95 hover:bg-white shadow-xs border border-stone-200/70 flex items-center justify-center text-stone-700 hover:text-black cursor-pointer transition-all hover:scale-105 active:scale-95"
              aria-label="Next image"
            >
              <HiChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Active Image / Video Stage with Zoom & Pan & Mouse Wheel Scroll Navigation */}
          <div
            ref={lightboxStageRef}
            title="Scroll up / down to switch between images"
            className={`w-full h-full flex items-center justify-center p-3 sm:p-5 pt-12 pb-12 select-none ${
              lightboxZoom > 1 ? (isLightboxDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
            }`}
            onMouseDown={handleLightboxMouseDown}
            onMouseMove={handleLightboxMouseMove}
            onMouseUp={handleLightboxMouseUp}
            onMouseLeave={handleLightboxMouseUp}
            onDoubleClick={handleLightboxDoubleClick}
          >
            {isVideoMedia(galleryImages[lightboxIndex]) ? (
              <video
                src={galleryImages[lightboxIndex]}
                controls
                autoPlay
                loop
                playsInline
                className="max-h-full max-w-full object-contain rounded-xl shadow-md"
              />
            ) : (
              <div
                style={{
                  transform: `translate(${lightboxPan.x}px, ${lightboxPan.y}px) scale(${lightboxZoom})`,
                  transition: isLightboxDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
                }}
                className="w-full h-full flex items-center justify-center origin-center pointer-events-none"
              >
                <img
                  src={galleryImages[lightboxIndex]}
                  alt="Zoomed Product View"
                  className="max-h-full max-w-full object-contain"
                  draggable={false}
                />
              </div>
            )}
          </div>

          {/* Floating Bottom Pill Toolbar (Zoom Controls) */}
          {!isVideoMedia(galleryImages[lightboxIndex]) && (
            <div className="absolute bottom-3 sm:bottom-3.5 left-1/2 -translate-x-1/2 z-20 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-md border border-stone-200/80 flex items-center gap-2 text-stone-700 select-none text-xs">
              <button
                type="button"
                onClick={() => setLightboxZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                className="p-1 hover:text-stone-950 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Zoom in"
                aria-label="Zoom in"
              >
                <HiOutlinePlus className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setLightboxZoom(1);
                  setLightboxPan({ x: 0, y: 0 });
                }}
                className="text-[11px] font-semibold tracking-wider text-stone-800 min-w-[36px] text-center hover:text-[#92704E] cursor-pointer"
                title="Click to reset zoom"
              >
                {Math.round(lightboxZoom * 100)}%
              </button>

              <button
                type="button"
                onClick={() => {
                  setLightboxZoom((z) => {
                    const next = Math.max(1, +(z - 0.25).toFixed(2));
                    if (next === 1) setLightboxPan({ x: 0, y: 0 });
                    return next;
                  });
                }}
                className="p-1 hover:text-stone-950 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title="Zoom out"
                aria-label="Zoom out"
              >
                <HiOutlineMinus className="w-3.5 h-3.5" />
              </button>

              <div className="h-3 w-px bg-stone-300" />

              <button
                type="button"
                onClick={() => setIsLightboxFullscreen((f) => !f)}
                className="p-1 hover:text-stone-950 hover:scale-110 active:scale-95 transition-all cursor-pointer"
                title={isLightboxFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                aria-label="Toggle fullscreen"
              >
                <HiOutlineArrowsExpand className="w-3.5 h-3.5" />
              </button>

              <div className="h-3 w-px bg-stone-300" />

              <span
                className="text-[10px] text-stone-500 font-mono px-0.5"
                title="Image count (Scroll up / down to navigate)"
              >
                {lightboxIndex + 1}/{galleryImages.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

ProductImageLightboxModal.propTypes = {
  isOpen: PropTypes.bool,
  lightboxIndex: PropTypes.number,
  setLightboxIndex: PropTypes.func,
  onClose: PropTypes.func,
  galleryImages: PropTypes.array,
  selectedColor: PropTypes.string,
  setSelectedColor: PropTypes.func,
  modalColorsToRender: PropTypes.array,
};
