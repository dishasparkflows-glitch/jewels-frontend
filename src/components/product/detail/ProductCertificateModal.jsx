import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  HiOutlineDocumentText,
  HiOutlineMinus,
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineExternalLink,
  HiOutlineX,
} from 'react-icons/hi';

/**
 * Luxury Authenticity & Grading Certificate Viewer Modal with Zoom, Pan, and Rotate
 */
export default function ProductCertificateModal({
  isOpen = false,
  onClose,
  certificateUrl = '',
  product = {},
}) {
  const [isCertFullscreen, setIsCertFullscreen] = useState(false);
  const [certZoom, setCertZoom] = useState(1);
  const [certPan, setCertPan] = useState({ x: 0, y: 0 });
  const [certRotation, setCertRotation] = useState(0);
  const [isCertDragging, setIsCertDragging] = useState(false);
  const [certDragStart, setCertDragStart] = useState({ x: 0, y: 0 });
  const certCanvasRef = useRef(null);

  // Reset zoom & pan when opened
  useEffect(() => {
    if (isOpen) {
      setCertZoom(1);
      setCertPan({ x: 0, y: 0 });
      setCertRotation(0);
      setIsCertFullscreen(false);
    }
  }, [isOpen]);

  if (!isOpen || !certificateUrl) return null;

  const isCertPdf = /\.pdf(?:[?#]|$)/i.test(certificateUrl);

  const handleCertZoomIn = () => setCertZoom((prev) => Math.min(prev + 0.25, 4));
  const handleCertZoomOut = () =>
    setCertZoom((prev) => {
      const next = Math.max(prev - 0.25, 0.5);
      if (next <= 1) setCertPan({ x: 0, y: 0 });
      return next;
    });
  const handleCertReset = () => {
    setCertZoom(1);
    setCertPan({ x: 0, y: 0 });
    setCertRotation(0);
  };
  const handleCertRotate = () => setCertRotation((prev) => (prev + 90) % 360);

  const handleCertMouseDown = (e) => {
    if (certZoom <= 1 || isCertPdf) return;
    setIsCertDragging(true);
    setCertDragStart({ x: e.clientX - certPan.x, y: e.clientY - certPan.y });
  };

  const handleCertMouseMove = (e) => {
    if (!isCertDragging || certZoom <= 1 || isCertPdf) return;
    setCertPan({
      x: e.clientX - certDragStart.x,
      y: e.clientY - certDragStart.y,
    });
  };

  const handleCertMouseUp = () => setIsCertDragging(false);

  const handleCertDoubleClick = () => {
    if (isCertPdf) return;
    if (certZoom > 1) {
      handleCertReset();
    } else {
      setCertZoom(2);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn overscroll-contain"
      onClick={onClose}
      onWheel={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div
        className={`relative bg-[#1c1917] text-white rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 border border-stone-700/60 ${
          isCertFullscreen
            ? 'w-full h-full rounded-none'
            : 'w-full max-w-4xl lg:max-w-5xl h-[88vh] max-h-[820px]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Toolbar */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-white/10 bg-[#161412] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-3">
            <div className="w-8 h-8 rounded-lg bg-[#92704E]/25 border border-[#92704E]/40 flex items-center justify-center text-[#d4af37] shrink-0">
              <HiOutlineDocumentText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide truncate font-serif">
                Authenticity &amp; Grading Certificate
              </h3>
              <p className="text-[11px] text-stone-400 truncate">
                {product.basicInfo?.title || 'Fine Jewellery'} • {product.basicInfo?.sku || 'Certificate'}
              </p>
            </div>
          </div>

          {/* PDF Toolbar Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {!isCertPdf && (
              <>
                {/* Zoom Out */}
                <button
                  type="button"
                  onClick={handleCertZoomOut}
                  className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Zoom Out (−)"
                  aria-label="Zoom Out"
                >
                  <HiOutlineMinus className="w-4 h-4" />
                </button>

                {/* Zoom % / Reset */}
                <button
                  type="button"
                  onClick={handleCertReset}
                  className="px-2 py-1 text-xs font-semibold font-mono rounded bg-white/10 hover:bg-white/20 text-stone-200 transition-colors min-w-[50px] text-center cursor-pointer"
                  title="Click to reset zoom (100%)"
                >
                  {Math.round(certZoom * 100)}%
                </button>

                {/* Zoom In */}
                <button
                  type="button"
                  onClick={handleCertZoomIn}
                  className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Zoom In (+)"
                  aria-label="Zoom In"
                >
                  <HiOutlinePlus className="w-4 h-4" />
                </button>

                {/* Rotate */}
                <button
                  type="button"
                  onClick={handleCertRotate}
                  className="p-1.5 rounded-lg text-stone-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Rotate 90°"
                  aria-label="Rotate 90 degrees"
                >
                  <HiOutlineRefresh className="w-4 h-4" />
                </button>

                <div className="h-5 w-px bg-white/15 mx-0.5 sm:mx-1" />
              </>
            )}

            {/* Open Original */}
            <a
              href={certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#92704E] hover:bg-[#7e5f40] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
              title="Open Original Document"
            >
              <span>Open Original</span>
              <HiOutlineExternalLink className="w-3.5 h-3.5" />
            </a>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/15 transition-colors cursor-pointer ml-1"
              aria-label="Close certificate modal"
            >
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Stage / Canvas */}
        <div
          ref={certCanvasRef}
          className={`flex-1 relative overflow-hidden bg-[#24211e] flex items-center justify-center p-3 sm:p-6 select-none overscroll-contain ${
            certZoom > 1 ? (isCertDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'
          }`}
          onMouseDown={handleCertMouseDown}
          onMouseMove={handleCertMouseMove}
          onMouseUp={handleCertMouseUp}
          onMouseLeave={handleCertMouseUp}
          onDoubleClick={handleCertDoubleClick}
        >
          {isCertPdf ? (
            <iframe
              src={certificateUrl}
              title="Certificate PDF Preview"
              className="w-full h-full rounded-xl border border-white/10 shadow-2xl bg-white"
            />
          ) : (
            <div
              style={{
                transform: `translate(${certPan.x}px, ${certPan.y}px) scale(${certZoom}) rotate(${certRotation}deg)`,
                transition: isCertDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)',
              }}
              className="max-w-full max-h-full flex items-center justify-center origin-center"
            >
              <img
                src={certificateUrl}
                alt="Jewellery Certificate"
                draggable={false}
                className="max-h-[70vh] sm:max-h-[74vh] max-w-[92vw] sm:max-w-[85vw] object-contain rounded-lg shadow-2xl bg-white ring-1 ring-black/10"
              />
            </div>
          )}
        </div>

        {/* Bottom Footer Info */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#161412] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-stone-400">
          <span className="flex items-center gap-1.5 text-stone-300">
            <span className="text-[#d4af37]">✓</span>
            100% Certified Natural &amp; Lab Grown Diamonds • BIS Hallmarked Gold
          </span>
          <span className="text-stone-500 hidden sm:inline">
            Scroll to zoom • Drag to pan • Double-click to zoom in/out
          </span>
        </div>
      </div>
    </div>
  );
}

ProductCertificateModal.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  certificateUrl: PropTypes.string,
  product: PropTypes.object,
};
