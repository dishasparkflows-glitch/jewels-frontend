import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  HiOutlineHeart,
  HiHeart,
  HiOutlineShare,
  HiOutlineChevronDown,
  HiOutlineX,
  HiOutlineShieldCheck,
  HiOutlineTruck,
  HiOutlineRefresh,
  HiOutlineDocumentText,
  HiOutlineInformationCircle,
  HiOutlineEye,
  HiOutlineExternalLink,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { productsAPI } from '../../api/services';
import { useCart } from '../../contexts/CartContext';
import { useWishlist } from '../../contexts/WishlistContext';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { getValidProductImages, getPrimaryProductImage, isOrnateImage } from '../../utils/productImages';
import { trackProductView } from '../../config/firebase';
import { useLiveViewers } from '../../hooks/useLiveViewers';
import Dropdown from '../../components/common/Dropdown';

const referenceName = (value) => (value && typeof value === 'object' ? value.name || '' : (typeof value === 'string' ? value : ''));

/**
 * Checks if a given media item or URL is a video
 */
const isVideoMedia = (media) => {
  if (!media) return false;
  if (typeof media === 'object') {
    if (media.mediaType === 'video') return true;
    const url = media.url || '';
    return /\.(mp4|webm|mov|m4v|ogg)(?:[?#]|$)/i.test(url);
  }
  return /\.(mp4|webm|mov|m4v|ogg)(?:[?#]|$)/i.test(String(media));
};

/**
 * High-definition interactive loupe zoom image / video card for product detail gallery
 */
function ZoomableProductImage({ image, alt, index, onOpenLightbox }) {
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

export default function ProductDetail() {
  const { id, slug } = useParams();
  const identifier = slug || id;
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  // Product state
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mostLikedProducts, setMostLikedProducts] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [coupons, setCoupons] = useState([
    { coupon: { code: 'FIRSTORDER' }, discount: { type: 'Percentage', value: 10 } }
  ]);
  const [offersOpen, setOffersOpen] = useState(true);

  const { count: liveViewersCount, hasUpdated: liveViewersUpdated } = useLiveViewers(product?._id || id);

  // Selections
  const [selectedPurity, setSelectedPurity] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedCarat, setSelectedCarat] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  // Lightbox & Size modal
  const [lightboxImage, setLightboxImage] = useState(null);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const { settings: storeSettings } = useStoreSettings();

  const certificateUrl =
    product?.certificateImage?.url ||
    storeSettings?.certificateImage?.url ||
    'https://pub-82427c7fd20e4acaa4bdb3b933c0a3bf.r2.dev/certificates/certificate-1792672361210-d82f.png';

  // Mobile Gallery Carousel State & Handlers
  const mobileGalleryRef = useRef(null);
  const [activeMobileSlide, setActiveMobileSlide] = useState(0);

  const handleMobileGalleryScroll = (e) => {
    const el = e.currentTarget;
    if (el && el.clientWidth > 0) {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
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

  // Accordion active sections (multiple can be open simultaneously)
  const [openAccordions, setOpenAccordions] = useState({
    desc: false,
    specs: false,
    price: false,
    origin: false,
  });

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Determine whether this product is Case 1 (Center Diamond Driven) or Case 2 (Side Diamond Driven)
  const isCenterDriven = useMemo(() => {
    if (!product) return false;
    const hasCenterRows = Array.isArray(product.centerDiamondRows) && product.centerDiamondRows.length > 0;
    const variants = Array.isArray(product.variants) ? product.variants : [];
    const hasCenterWeights = variants.some((v) => Number(v.centerDiamondWeight) > 0);
    return Boolean(hasCenterRows || hasCenterWeights);
  }, [product]);

  // Extract dimensions available across variants
  const { purities, colors, carats, qualities, diamondType } = useMemo(() => {
    const raw = Array.isArray(product?.variants) ? product.variants : [];
    const pSet = new Set();
    const cMap = new Map();
    const ctSet = new Set();
    const qSet = new Set();
    let dType = 'Lab Grown Diamond';

    raw.forEach((v) => {
      const p = referenceName(v.metalPurity || v.metalPurityId) || v.purity || '';
      if (p) pSet.add(p);

      const cObj = v.metalColor || v.metalColorId;
      const cName = referenceName(cObj) || v.color || '';
      if (cName) {
        const existing = cMap.get(cName) || {};
        cMap.set(cName, {
          name: cName,
          code: cObj?.code || existing.code || '',
          colorCode: cObj?.colorCode || existing.colorCode || '',
          colorCodeEnd: cObj?.colorCodeEnd || existing.colorCodeEnd || '',
        });
      }

      const ct = Number(v.centerDiamondWeight || v.caratWeight || 0);
      if (ct > 0) ctSet.add(ct);

      const col = referenceName(v.diamondColor || v.diamondColorId) || v.diamondColor || '';
      const cla = referenceName(v.diamondClarity || v.diamondClarityId) || v.diamondClarity || '';
      if (col || cla) {
        qSet.add([col, cla].filter(Boolean).join(' · '));
      }

      const dt = referenceName(v.diamondType || v.diamondTypeId);
      if (dt) dType = dt;
    });

    if (Array.isArray(product?.metalPurityIds)) {
      product.metalPurityIds.forEach((p) => {
        const name = typeof p === 'object' ? p.name : p;
        if (name) pSet.add(name);
      });
    }

    if (Array.isArray(product?.metalColorIds)) {
      product.metalColorIds.forEach((c) => {
        if (!c) return;
        const name = typeof c === 'object' ? c.name : c;
        if (name) {
          const existing = cMap.get(name) || {};
          cMap.set(name, {
            name,
            code: c.code || existing.code || '',
            colorCode: c.colorCode || existing.colorCode || '',
            colorCodeEnd: c.colorCodeEnd || existing.colorCodeEnd || '',
          });
        }
      });
    }

    if (Array.isArray(product?.colorImages)) {
      product.colorImages.forEach((ci) => {
        const cObj = ci.metalColorId || ci.metalColor;
        const cName = referenceName(cObj) || ci.colorName || ci.name || '';
        if (cName) {
          const existing = cMap.get(cName) || {};
          cMap.set(cName, {
            name: cName,
            code: cObj?.code || existing.code || '',
            colorCode: cObj?.colorCode || existing.colorCode || '',
            colorCodeEnd: cObj?.colorCodeEnd || existing.colorCodeEnd || '',
          });
        }
      });
    }

    // Default fallback to 3 core luxury colors if none configured
    if (cMap.size === 0) {
      cMap.set('Rose Gold', { name: 'Rose Gold', code: '' });
      cMap.set('Yellow Gold', { name: 'Yellow Gold', code: '' });
      cMap.set('White Gold', { name: 'White Gold', code: '' });
    }

    return {
      purities: Array.from(pSet),
      colors: Array.from(cMap.values()),
      carats: Array.from(ctSet).sort((a, b) => a - b),
      qualities: Array.from(qSet),
      diamondType: dType,
    };
  }, [product]);

  // Auto-initialize options on product load
  useEffect(() => {
    if (!product) return;
    if (purities.length && !selectedPurity) {
      const defaultP = purities.find((p) => p.includes('9K') || p.includes('9KT')) ||
                       purities.find((p) => p.includes('14')) ||
                       purities[0];
      setSelectedPurity(defaultP);
    }
    if (colors.length && !selectedColor) {
      // Default to Yellow Gold if available to match Neirah default, or Rose Gold
      const defaultC = colors.find((c) => c.name.toLowerCase().includes('yellow')) ||
                       colors.find((c) => c.name.toLowerCase().includes('rose')) ||
                       colors[0];
      setSelectedColor(defaultC.name);
    }
    if (carats.length && !selectedCarat) {
      setSelectedCarat(carats[0]);
    }
    if (qualities.length && !selectedQuality) {
      // Default to F-G VS or first quality
      const defaultQ = qualities.find((q) => q.includes('F-G') && q.includes('VS')) || qualities[0];
      setSelectedQuality(defaultQ);
    }
  }, [product, purities, colors, carats, qualities, selectedPurity, selectedColor, selectedCarat, selectedQuality]);

  // Swatches for the combined Metal (Purity + Color) selector matching Neirah standard
  // Swatches for the combined Metal (Purity + Color) selector
  const metalSwatches = useMemo(() => {
    const isSilverProduct = product?.productType === 'silver';
    if (isSilverProduct) {
      const silverPurity = purities.find((p) =>
        p.toLowerCase().includes('silver') || p.toLowerCase().includes('925')
      ) || '925 Silver';

      return [{
        id: 'SS-Silver',
        label: 'SS',
        purity: silverPurity,
        color: 'Silver',
        type: 'silver',
      }];
    }

    // Standard gold color palette order: White Gold, Rose Gold, Yellow Gold
    const colorOrder = ['White Gold', 'Rose Gold', 'Yellow Gold'];

    // Map existing colors in product if available
    const availableColorNames = colors.map((c) => c.name);
    const activeColors = colorOrder.filter((co) =>
      availableColorNames.length === 0 || availableColorNames.some((ac) => ac.toLowerCase() === co.toLowerCase())
    );
    if (!activeColors.length) {
      activeColors.push('White Gold', 'Rose Gold', 'Yellow Gold');
    }

    // Standard purities order: 9K, 10K, 14K, 18K
    const purityOrder = [
      { key: '9K', full: '9KT Gold', aliases: ['9KT Gold', '9KT', '9K'] },
      { key: '10K', full: '10KT Gold', aliases: ['10KT Gold', '10KT', '10K'] },
      { key: '14K', full: '14KT Gold', aliases: ['14KT Gold', '14KT', '14K'] },
      { key: '18K', full: '18KT Gold', aliases: ['18KT Gold', '18KT', '18K'] },
    ];

    // Filter to purities actually configured in this product
    const activePurityDefs = purityOrder.filter((pDef) =>
      purities.length === 0 || purities.some((p) => pDef.aliases.some((a) => p.toLowerCase().includes(a.toLowerCase())))
    );
    const listToRender = activePurityDefs.length > 0 ? activePurityDefs : purityOrder;

    const swatches = [];

    listToRender.forEach((pDef) => {
      const matchedPurity = purities.find((p) =>
        pDef.aliases.some((a) => p.toLowerCase().includes(a.toLowerCase()))
      ) || pDef.full;

      activeColors.forEach((colorName) => {
        const cObj = colors.find((c) => c.name?.toLowerCase() === colorName.toLowerCase());
        swatches.push({
          id: `${pDef.key}-${colorName}`,
          label: pDef.key,
          purity: matchedPurity,
          color: colorName,
          colorCode: cObj?.colorCode || '',
          colorCodeEnd: cObj?.colorCodeEnd || '',
          type: 'gold',
        });
      });
    });

    // Only include silver if the product actually has silver purity configured (no static silver)
    const actualSilverPurity = purities.find((p) =>
      p.toLowerCase().includes('silver') || p.toLowerCase().includes('925')
    );
    if (actualSilverPurity) {
      swatches.push({
        id: 'SS-Silver',
        label: 'SS',
        purity: actualSilverPurity,
        color: 'Silver',
        type: 'silver',
      });
    }

    return swatches;
  }, [product, purities, colors]);

  const isSwatchSelected = useCallback((swatch) => {
    const curPurity = (selectedPurity || '').toLowerCase();
    const curColor = (selectedColor || '').toLowerCase();

    const matchP = curPurity.includes(swatch.label.toLowerCase()) ||
                   (swatch.purity && curPurity.includes(swatch.purity.toLowerCase()));
    const matchC = curColor === swatch.color.toLowerCase();

    return Boolean(matchP && matchC);
  }, [selectedPurity, selectedColor]);

  const handleSelectMetalSwatch = useCallback((swatch) => {
    setSelectedPurity(swatch.purity);
    setSelectedColor(swatch.color);
  }, []);

  // Active metal display title (e.g. "9KT Yellow Gold")
  const metalDisplayName = useMemo(() => {
    const pStr = (selectedPurity || '').replace(/ Gold/i, '').trim();
    const cStr = (selectedColor || '').trim();

    if (pStr && cStr) {
      return `${pStr} ${cStr}`;
    }
    return pStr || cStr || product?.specifications?.metalName || 'Gold';
  }, [selectedPurity, selectedColor, product]);

  // Extract clean studio gallery images for the current selected metal color
  const galleryImages = useMemo(() => {
    if (!product) return [];

    if (selectedColor && Array.isArray(product.colorImages)) {
      const match = product.colorImages.find((ci) => {
        const cName = ci.metalColorId?.name || ci.metalColor?.name || ci.colorName || ci.name || '';
        if (cName && cName.toLowerCase() === selectedColor.toLowerCase()) return true;
        const matchedFromList = colors.find(
          (c) => String(c.id || c._id) === String(ci.metalColorId?._id || ci.metalColorId)
        );
        return Boolean(matchedFromList && matchedFromList.name?.toLowerCase() === selectedColor.toLowerCase());
      });

      if (match && Array.isArray(match.images) && match.images.length > 0) {
        const colorImgs = match.images
          .filter((img) => !isOrnateImage(img))
          .map((img) => (typeof img === 'string' ? img : img.url))
          .filter(Boolean);
        if (colorImgs.length > 0) return colorImgs;
      }
    }

    const fallback = getValidProductImages(product);
    return fallback.length > 0 ? fallback : [];
  }, [product, selectedColor, colors]);

  // Category from final schema (categoryIds[0])
  const category = product?.categoryIds?.[0] || null;
  const categoryId = category?._id || '';
  const categoryName = category?.name || '';

  // Multi-dimensional variant resolution
  const selectedVariant = useMemo(() => {
    const raw = Array.isArray(product?.variants) ? product.variants : [];
    if (!raw.length) return null;

    // 1. Exact match across all active dimensions
    let match = raw.find((v) => {
      const p = referenceName(v.metalPurity || v.metalPurityId) || v.purity || '';
      const c = referenceName(v.metalColor || v.metalColorId) || v.color || '';
      const ct = Number(v.centerDiamondWeight || v.caratWeight || 0);
      const col = referenceName(v.diamondColor || v.diamondColorId) || v.diamondColor || '';
      const cla = referenceName(v.diamondClarity || v.diamondClarityId) || v.diamondClarity || '';
      const q = [col, cla].filter(Boolean).join(' · ');

      const matchP = !selectedPurity || p === selectedPurity;
      // Allow matching if variant has no explicit metalColorId (purity rates apply across colors)
      const matchC = !selectedColor || !c || c.toLowerCase() === selectedColor.toLowerCase();
      const matchCt = !selectedCarat || ct === Number(selectedCarat);
      const matchQ = !selectedQuality || q === selectedQuality;

      return matchP && matchC && (isCenterDriven ? matchCt : true) && matchQ;
    });

    if (match) return match;

    // 2. Partial match: purity + carat + quality
    match = raw.find((v) => {
      const p = referenceName(v.metalPurity || v.metalPurityId) || v.purity || '';
      const ct = Number(v.centerDiamondWeight || v.caratWeight || 0);
      const col = referenceName(v.diamondColor || v.diamondColorId) || v.diamondColor || '';
      const cla = referenceName(v.diamondClarity || v.diamondClarityId) || v.diamondClarity || '';
      const q = [col, cla].filter(Boolean).join(' · ');

      const matchP = !selectedPurity || p === selectedPurity;
      const matchCt = !selectedCarat || ct === Number(selectedCarat);
      const matchQ = !selectedQuality || q === selectedQuality;

      return matchP && (isCenterDriven ? matchCt : true) && matchQ;
    });

    if (match) return match;

    // 3. Fallback: purity only
    match = raw.find((v) => {
      const p = referenceName(v.metalPurity || v.metalPurityId) || v.purity || '';
      return !selectedPurity || p === selectedPurity;
    });

    return match || raw[0] || null;
  }, [product, selectedPurity, selectedColor, selectedCarat, selectedQuality, isCenterDriven]);

  const isGold = (product?.productType === 'gold') || /gold/i.test(product?.basicInfo?.title || product?.title || '');
  const currentPrice = [selectedVariant?.price, product?.pricing?.salePrice]
    .find((value) => Number(value) > 0);
  const mrpPrice = [product?.pricing?.mrp].find((value) => Number(value) > 0) ?? currentPrice;
  const discountPercent =
    !isGold && Number(mrpPrice) > Number(currentPrice) ? Math.round(((mrpPrice - currentPrice) / mrpPrice) * 100) : 0;

  // Itemized Transparent Price Breakdown (Matches Screenshot)
  const breakdown = useMemo(() => {
    const v = selectedVariant || {};
    const finalPrice = Number(
      v.price ||
      currentPrice ||
      product?.pricing?.salePrice ||
      product?.pricing?.calculatedPrice ||
      product?.pricing?.ornatePrice ||
      0
    );

    if (!finalPrice || finalPrice <= 0) return null;

    const gstPct = Number(product?.pricing?.gstPercentage || 3) / 100;
    const computedSubtotal = Math.round((finalPrice / (1 + gstPct)) * 100) / 100;
    const computedGst = Math.round((finalPrice - computedSubtotal) * 100) / 100;

    const certificateCharge = Number(v.certificateCharge || product?.pricing?.certificateCharge || 1000);

    let labourCharge = Number(
      v.labourCharge ||
      v.computedMakingCharge ||
      product?.pricing?.baseLabourCharge ||
      product?.ornate?.labourAmt ||
      0
    );
    if (!labourCharge || labourCharge <= 0) {
      labourCharge = Math.round((computedSubtotal - certificateCharge) * 0.09);
    }

    const purityName = (selectedPurity || v.purity || '').toUpperCase();
    let defaultMetalRate = 5587.5; // default 9KT matching screenshot
    if (purityName.includes('14K') || purityName.includes('14KT')) defaultMetalRate = 6850;
    else if (purityName.includes('18K') || purityName.includes('18KT')) defaultMetalRate = 8450;
    else if (purityName.includes('22K') || purityName.includes('22KT')) defaultMetalRate = 9800;
    else if (purityName.includes('SILVER') || purityName.includes('925')) defaultMetalRate = 95;

    const metalRate = Number(v.metalRate || product?.pricing?.metalRate || defaultMetalRate);

    let metalWeight = Number(
      v.metalWeight ||
      v.weight ||
      product?.specifications?.metalWeight ||
      product?.specifications?.grossWeight ||
      product?.specifications?.netWeight ||
      product?.ornate?.metalWeight ||
      0
    );

    let metalCost = Number(v.metalCost || product?.ornate?.goldAmt || 0);
    if (!metalCost && metalWeight && metalRate) {
      metalCost = Math.round(metalWeight * metalRate * 100) / 100;
    }

    const diamondQuality = selectedQuality || (v.diamondColor && v.diamondClarity ? `${referenceName(v.diamondColor)} / ${referenceName(v.diamondClarity)}` : 'F-G / VS');
    let diamondCarat = Number(
      v.centerDiamondWeight ||
      v.caratWeight ||
      selectedCarat ||
      product?.specifications?.diamondWeight ||
      product?.ornate?.carat ||
      0
    );

    let diamondCost = Number(v.diamondCost || v.centerDiamondCost || product?.ornate?.diamondAmt || 0);

    const remainingForMaterial = Math.max(0, computedSubtotal - certificateCharge - labourCharge);
    if (!metalCost || !diamondCost) {
      if (isGold || !product?.productType || product?.productType === 'gold') {
        if (!metalCost) {
          metalCost = Math.round(remainingForMaterial * 0.35 * 100) / 100;
        }
        if (!diamondCost) {
          diamondCost = Math.round((remainingForMaterial - metalCost) * 100) / 100;
        }
      } else {
        metalCost = remainingForMaterial;
        diamondCost = 0;
      }
    }

    if (!metalWeight && metalRate > 0 && metalCost > 0) {
      metalWeight = Math.round((metalCost / metalRate) * 1000) / 1000;
    }

    if (!diamondCarat && diamondCost > 0) {
      diamondCarat = Math.round((diamondCost / 19000) * 100) / 100;
    }

    const calculatedSubtotal = Math.round((metalCost + diamondCost + labourCharge + certificateCharge) * 100) / 100;
    const finalSubtotal = calculatedSubtotal;
    const finalGst = Math.round((finalSubtotal * gstPct) * 100) / 100;
    const finalGrandTotal = Math.round((finalSubtotal + finalGst) * 100) / 100;

    return {
      metalName: metalDisplayName || '9KT Yellow Gold',
      metalRate,
      metalWeight,
      metalCost,
      diamondLabel: `Diamond (${diamondQuality})`,
      diamondCarat,
      diamondCost,
      labourCharge,
      certificateCharge,
      subtotal: finalSubtotal,
      gstAmount: finalGst,
      finalPrice: finalGrandTotal,
    };
  }, [selectedVariant, currentPrice, product, selectedPurity, selectedColor, selectedCarat, selectedQuality, isGold, metalDisplayName]);



  // Derive available sizes directly from product data without extra API calls
  useEffect(() => {
    const prodSizes = product?.sizes || product?.availableSizes || [];
    setSizes(Array.isArray(prodSizes) ? prodSizes : []);
    setSelectedSize('');
  }, [product]);

  // Fetch product data
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        setProduct(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const res = await productsAPI.getById(identifier);
        const prodData = res.data?.data || res.data;
        if (prodData) {
          setProduct(prodData);
          trackProductView(prodData);

          // Use related products directly from product payload if provided
          if (Array.isArray(prodData.relatedProducts) && prodData.relatedProducts.length > 0) {
            setMostLikedProducts(prodData.relatedProducts.slice(0, 6));
          } else {
            setMostLikedProducts([]);
          }

          const activeSlug =
            prodData.basicInfo?.slug ||
            prodData.slug ||
            (prodData.basicInfo?.title || prodData.title || prodData.name
              ? String(prodData.basicInfo?.title || prodData.title || prodData.name)
                  .toLowerCase()
                  .trim()
                  .replace(/[^\w\s-]/g, '')
                  .replace(/\s+/g, '-')
              : '');
          if (activeSlug && identifier && identifier !== activeSlug) {
            navigate(`/product/${encodeURIComponent(activeSlug)}`, { replace: true });
          }
        }
      } catch (err) {
        console.error('Failed to load product:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [identifier, navigate]);

  // Format INR Currency
  const formatPrice = (val) => {
    if (val === undefined || val === null || val === '') return '—';
    return `₹${Number(val).toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Price Breakup specific formatting matching screenshot
  const formatBreakdownValue = (val) => {
    if (val === undefined || val === null || val === '' || isNaN(val)) return '-';
    const num = Number(val);
    if (num === 0) return '-';
    if (num % 1 !== 0) {
      return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatBreakdownRate = (val) => {
    if (!val || isNaN(val) || Number(val) === 0) return '-';
    const num = Number(val);
    if (num % 1 !== 0) {
      return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}/g`;
    }
    return `₹${num.toLocaleString('en-IN')}/g`;
  };

  const formatBreakdownWeight = (val, unit = 'g') => {
    if (!val || isNaN(val) || Number(val) === 0) return '-';
    const num = Number(val);
    return `${num.toLocaleString('en-IN', { maximumFractionDigits: 3 })} ${unit}`;
  };

  // Format delivery date (7 days out)
  const deliveryDateString = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }, []);

  // Add to cart handler
  const handleAddToCart = () => {
    if (!product) return;
    if (product.variants?.length && !selectedVariant) {
      toast.error('Please choose a product option');
      return;
    }
    if (sizes.length && !selectedSize) {
      toast.error('Please choose a size');
      return;
    }
    if (!currentPrice || Number(currentPrice) <= 0) {
      toast.error('Product price is not configured');
      return;
    }
    setAddingToCart(true);

    const price = Number(currentPrice) || 0;
    const quantity = 1;
    const totalItemPrice = price * quantity;
    const addedAt = new Date().toISOString();
    const isGold = (product.productType === 'gold');

    let selectedAttributes = null;
    if (isGold) {
      selectedAttributes = {
        metalPurity: selectedVariant?.metalPurityId?._id || selectedVariant?.metalPurityId || product.metalPurityIds?.[0]?._id || product.metalPurityIds?.[0] || null,
        metalColor: selectedVariant?.metalColorId?._id || selectedVariant?.metalColorId || product.metalColorIds?.[0]?._id || product.metalColorIds?.[0] || null,
        diamondType: selectedVariant?.diamondTypeId?._id || selectedVariant?.diamondTypeId || null,
        diamondShape: selectedVariant?.diamondShapeId?._id || selectedVariant?.diamondShapeId || null,
        diamondClarity: selectedVariant?.diamondClarityId?._id || selectedVariant?.diamondClarityId || null,
        diamondColor: selectedVariant?.diamondColorId?._id || selectedVariant?.diamondColorId || null,
        caratWeight: Number(selectedVariant?.caratWeight || selectedCarat || 0) || null,
        size: selectedSize || null,
        sizeRange: null,
      };
    } else {
      selectedAttributes = {
        metalPurity: null,
        metalColor: selectedVariant?.metalColorId?._id || selectedVariant?.metalColorId || product.metalColorIds?.[0]?._id || product.metalColorIds?.[0] || null,
        diamondType: null,
        diamondShape: null,
        diamondClarity: null,
        diamondColor: null,
        caratWeight: null,
        size: selectedSize || null,
        sizeRange: null,
      };
    }

    const cartItem = {
      _id: product._id,
      productId: product._id,
      userId: user?._id || user?.id || null,
      title: product.basicInfo?.title,
      price,
      totalItemPrice,
      addedAt,
      quantity,
      image: galleryImages.find((img) => !isVideoMedia(img)) || galleryImages[0] || getPrimaryProductImage(product),
      category: categoryName,
      productType: product.productType,
      selectedAttributes,
    };

    addToCart(cartItem, 1, {
      userId: user?._id || user?.id || null,
      price,
      totalItemPrice,
      addedAt,
      selectedMetal: `${selectedPurity} ${selectedColor}`.trim(),
      selectedVariantId: selectedVariant?._id || '',
      size: selectedSize,
      selectedSize,
      selectedAttributes,
    });

    setTimeout(() => {
      setAddingToCart(false);
    }, 400);
  };

  // Share handler
  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Product link copied to clipboard!');
    } else {
      toast('Share link: ' + window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="bg-white min-h-[70vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-stone-200 border-t-[#8f6d43] rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-widest font-bold text-stone-400">
            Loading Fine Jewelry Details...
          </p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-white min-h-[70vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-stone-600">Product details are unavailable.</p>
        <Link to="/shop" className="text-sm font-semibold text-[#8f6d43] hover:underline">Back to shop</Link>
      </div>
    );
  }



  const specificationRows = [
    ['Metal', metalDisplayName || product.specifications?.metalName || 'Gold'],
    ['Diamond Type', diamondType],
    ['Diamond Color · Clarity', selectedQuality || '—'],
    ['Center Diamond Weight', selectedCarat ? `${selectedCarat} ct` : (breakdown?.centerCarat ? `${breakdown.centerCarat} ct` : '—')],
    ['Gross Weight', breakdown?.metalWeight ? `${breakdown.metalWeight} g` : (product.specifications?.metalWeight ? `${product.specifications.metalWeight} g` : '—')],
    ['Net Weight', breakdown?.metalWeight ? `${breakdown.metalWeight} g` : '—'],
    ['Size', selectedSize || 'Standard'],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');

  const isItemWishlisted = Boolean(
    product &&
      (isWishlisted(product._id) ||
        isWishlisted(product.id) ||
        isWishlisted(product.basicInfo?.slug) ||
        isWishlisted(product.slug))
  );

  return (
    <div className="bg-white text-stone-900 min-h-screen pb-24 lg:pb-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-3 sm:py-4">
        {/* ─── Breadcrumb Navigation ─── */}
        <nav className="text-[10px] sm:text-[11px] text-stone-400 py-2 sm:py-3 flex items-center gap-1.5 overflow-hidden whitespace-nowrap border-b border-stone-100 mb-4 sm:mb-6">
          <Link to="/" className="hover:text-stone-800 transition-colors">
            Home
          </Link>
          {categoryName && (
            <>
              <span>/</span>
              <Link
                to={`/shop?category=${encodeURIComponent(categoryId || categoryName.toLowerCase())}`}
                className="hover:text-stone-800 transition-colors"
              >
                {categoryName}
              </Link>
            </>
          )}
          <span>/</span>
          <span className="text-stone-700 font-semibold truncate max-w-[200px] sm:max-w-md">
            {product.basicInfo?.title}
          </span>
        </nav>

        {/* ─── Main Product Section: 2-Column Gallery Grid & Purchase Sidebar ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 items-start">
          {/* ══════════════════════════════════════════════════════════
              LEFT: Product Studio Image Gallery
              - Mobile (<sm): Interactive horizontal swipe carousel with indicators
              - Desktop (sm+): 2-Column Product Studio Image Grid
          ═══════════════════════════════════════════════════════════ */}
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
                          onOpenLightbox={() => setLightboxImage(image)}
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
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            activeMobileSlide === dotIdx
                              ? 'w-5 bg-[#8b6f4e]'
                              : 'w-1.5 bg-stone-300'
                          }`}
                          aria-label={`Go to slide ${dotIdx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop 2-Column Studio Grid (sm+) */}
                <div className="hidden sm:grid sm:grid-cols-2 gap-3 sm:gap-4">
                  {galleryImages.map((image, index) => (
                    <ZoomableProductImage
                      key={`${image}-${index}`}
                      image={image}
                      index={index}
                      alt={`${product.basicInfo?.title || 'Fine Jewelry'} ${selectedColor} view ${index + 1}`}
                      onOpenLightbox={() => setLightboxImage(image)}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="aspect-square bg-[#fbf9f6] rounded-sm border border-stone-100 flex items-center justify-center text-sm text-stone-400">
                Image coming soon
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════════
              RIGHT: Product Info, Multi-Variant Selectors & Accordions
          ═══════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-6">
            {/* Title & Brand */}
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl font-normal text-stone-900 leading-snug tracking-tight font-serif">
                {product.basicInfo?.title}
              </h1>
            </div>

            {/* Price Row with Wishlist & Share */}
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-stone-100">
              <div className="flex items-baseline flex-wrap gap-2 sm:gap-2.5">
                <span className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight font-sans">
                  {formatPrice(currentPrice)}
                </span>
                <span className="text-[11px] sm:text-xs text-stone-400 font-normal whitespace-nowrap">
                  (MRP Incl. of all taxes)
                </span>
                {!isGold && discountPercent > 0 && (
                  <span className="text-xs text-stone-400 line-through ml-1">
                    {formatPrice(mrpPrice)}
                  </span>
                )}
                {!isGold && discountPercent > 0 && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Action Buttons: Wishlist & Share (Styled matching GIVA) */}
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button
                    type="button"
                    onClick={() => toggleWishlist(product)}
                    className="p-1.5 rounded-full hover:bg-rose-50/80 text-stone-400 hover:text-[#e11d48] transition-all cursor-pointer flex items-center justify-center active:scale-90"
                    aria-label={isItemWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {isItemWishlisted ? (
                      <HiHeart className="w-6 h-6 text-[#e11d48] fill-current drop-shadow-xs transition-transform duration-200 scale-105" />
                    ) : (
                      <HiOutlineHeart className="w-6 h-6 transition-transform duration-200 hover:scale-110" />
                    )}
                  </button>
                  {/* Tooltip matching GIVA reference screenshot */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                    <div className="bg-black text-white text-[11px] font-medium px-2.5 py-1 rounded shadow-lg whitespace-nowrap">
                      {isItemWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    </div>
                    <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-black" />
                  </div>
                </div>

                <div className="relative group">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="p-1.5 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors cursor-pointer flex items-center justify-center active:scale-90"
                    aria-label="Share piece"
                  >
                    <HiOutlineShare className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                    <div className="bg-black text-white text-[11px] font-medium px-2.5 py-1 rounded shadow-lg whitespace-nowrap">
                      Share piece
                    </div>
                    <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-black" />
                  </div>
                </div>
              </div>
            </div>

            {/* People Viewing Banner (Live Socket / Organic Real Viewer Count) */}
            <div className="flex items-center gap-2 text-xs text-stone-600 select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
              </span>
              <span className="text-[11.5px] font-medium text-stone-600 flex items-center gap-1">
                <strong
                  className={`font-semibold text-stone-900 transition-all duration-300 inline-block ${
                    liveViewersUpdated ? 'text-[#8b6f4e] scale-110' : ''
                  }`}
                >
                  {liveViewersCount} people
                </strong>{' '}
                are viewing this right now
              </span>
            </div>

            {/* Available Offers Box */}
            <div className="p-3 rounded-xl bg-[#faf8f5] border border-[#eee4d6] space-y-1">
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => setOffersOpen((prev) => !prev)}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8b6f4e]">
                  AVAILABLE OFFERS
                </span>
                <span className="text-[14px] font-bold text-stone-700 leading-none">
                  {offersOpen ? '−' : '+'}
                </span>
              </div>

              {offersOpen && (
                <div className="space-y-1.5 pt-0.5">
                  {coupons.length > 0 ? (
                    coupons.map((c) => {
                      const code = c.coupon?.code || 'OFFER';
                      const discountText =
                        c.discount?.type === 'Percentage'
                          ? `${c.discount?.value}% Off`
                          : `₹${Number(c.discount?.value || 0).toLocaleString('en-IN')} Off`;
                      return (
                        <div
                          key={c._id || code}
                          className="flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (navigator.clipboard) {
                                  navigator.clipboard.writeText(code);
                                  toast.success(`Coupon "${code}" copied!`);
                                }
                              }}
                              className="px-2 py-0.5 rounded bg-white border border-[#d6cfc2] text-[11px] font-bold tracking-wider font-mono text-stone-900 cursor-pointer hover:border-[#8b6f4e] hover:bg-[#faf4ed] transition"
                              title="Click to copy coupon code"
                            >
                              {code}
                            </button>
                            <span className="text-xs text-stone-600 font-medium">
                              {discountText}
                            </span>
                          </div>
                          {c.discount?.minimumOrderAmount > 0 && (
                            <span className="text-[10px] text-stone-400">
                              Min. order ₹{Number(c.discount.minimumOrderAmount).toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (navigator.clipboard) {
                            navigator.clipboard.writeText('FIRSTORDER');
                            toast.success('Coupon "FIRSTORDER" copied!');
                          }
                        }}
                        className="px-2 py-0.5 rounded bg-white border border-[#d6cfc2] text-[11px] font-bold tracking-wider font-mono text-stone-900 cursor-pointer hover:border-[#8b6f4e] hover:bg-[#faf4ed] transition"
                        title="Click to copy coupon code"
                      >
                        FIRSTORDER
                      </button>
                      <span className="text-xs text-stone-600 font-medium">10% Off</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ══════════════════════════════════════════════════════════
                VARIANT SELECTORS (Matches Screenshot 2)
            ═══════════════════════════════════════════════════════════ */}
            <div className="space-y-4 pt-1">
              {/* 1. Diamond Type Selector */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-stone-700">
                  Diamond Type: <span className="font-semibold text-stone-900">{diamondType}</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold tracking-wide uppercase bg-[#1f3a2b] text-white shadow-xs cursor-default"
                  >
                    {diamondType}
                  </button>
                </div>
              </div>

              {/* 2. Diamond Quality Selector (Grid Format matching Screenshot 2) */}
              {qualities.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-stone-700">
                    Diamond Quality: <span className="font-semibold text-stone-900">{selectedQuality.replace(' · ', ' ')}</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {qualities.map((q) => {
                      const isSel = selectedQuality === q;
                      const label = q.replace(' · ', ' ');
                      return (
                        <button
                          key={q}
                          type="button"
                          onClick={() => setSelectedQuality(q)}
                          className={`py-2 px-1 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                            isSel
                              ? 'bg-[#1f3a2b] text-white shadow-xs ring-1 ring-[#1f3a2b]'
                              : 'bg-white border border-stone-200 text-stone-700 hover:border-stone-400'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Metal Selector: Unified Purity + Color Swatches (Matches Neirah Screenshot) */}
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-stone-700">
                  Metal: <span className="font-semibold text-stone-900">{metalDisplayName}</span>
                </label>

                <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                  {metalSwatches.map((swatch) => {
                    const isSel = isSwatchSelected(swatch);
                    const bg = swatch.colorCode && swatch.colorCodeEnd
                      ? `linear-gradient(135deg, ${swatch.colorCode} 0%, ${swatch.colorCodeEnd} 100%)`
                      : (swatch.colorCode || swatch.colorCodeEnd || '#f1f5f9');

                    return (
                      <button
                        key={swatch.id}
                        type="button"
                        onClick={() => handleSelectMetalSwatch(swatch)}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-[9px] sm:text-[10px] tracking-tight transition-all cursor-pointer shadow-2xs ${
                          isSel
                            ? 'ring-2 ring-stone-900 ring-offset-2 scale-105 z-10'
                            : 'hover:scale-105 active:scale-95 opacity-90 hover:opacity-100'
                        }`}
                        style={{
                          background: bg,
                          border: '1px solid rgba(0, 0, 0, 0.12)',
                          color: '#334155',
                        }}
                        title={`${swatch.label} ${swatch.color}`}
                        aria-label={`${swatch.label} ${swatch.color}`}
                      >
                        {swatch.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Solitaire Center Diamond Carat Weight Dropdown (Matches Screenshot 2) */}
              {isCenterDriven && carats.length > 0 && (
                <div className="space-y-1.5">
                  <label htmlFor="carat-select" className="block text-[11px] font-bold text-stone-700">
                    Total Center Diamond Weight
                  </label>
                  <Dropdown
                    id="carat-select"
                    value={selectedCarat}
                    onChange={(val) => setSelectedCarat(Number(val))}
                    options={carats.map((ct) => ({ value: ct, label: `${ct} CT` }))}
                    placeholder="Select Carat"
                    buttonClassName="w-full h-11 px-3.5 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-800 hover:border-stone-300 focus:outline-none focus:border-[#8f6d43] flex items-center justify-between cursor-pointer"
                    menuClassName="z-[50]"
                  />
                </div>
              )}

              {/* 5. Size Selection (If Applicable) */}
              {sizes.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="product-size" className="block text-[11px] font-bold text-stone-700">Size</label>
                    <button
                      type="button"
                      onClick={() => setShowSizeModal(true)}
                      className="text-[10px] font-bold text-[#8f6d43] hover:underline uppercase tracking-wider cursor-pointer"
                    >
                      Size chart
                    </button>
                  </div>
                  <Dropdown
                    id="product-size"
                    value={selectedSize}
                    onChange={(val) => setSelectedSize(val)}
                    options={sizes.map((size) => ({ value: size.name, label: size.name }))}
                    placeholder="Choose a size"
                    buttonClassName="w-full h-11 px-3.5 rounded-lg border border-stone-200 bg-white text-xs font-semibold text-stone-800 hover:border-stone-300 focus:outline-none focus:border-[#8f6d43] flex items-center justify-between cursor-pointer"
                    menuClassName="z-[50]"
                  />
                </div>
              )}
            </div>

            {/* ─── ADD TO CART Button Row with Wishlist Heart ─── */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex-1 py-4 bg-[#141414] hover:bg-black active:scale-[0.99] text-white font-bold text-xs uppercase tracking-widest rounded-lg shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {addingToCart ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>ADDING TO BAG...</span>
                  </>
                ) : (
                  <span>ADD TO CART</span>
                )}
              </button>

              {/* Wishlist Heart Button beside ADD TO CART */}
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => toggleWishlist(product)}
                  className={`w-13 h-13 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 ${
                    isItemWishlisted
                      ? 'border-rose-200 bg-rose-50/80 text-[#e11d48]'
                      : 'border-stone-200 bg-white hover:border-rose-300 hover:text-[#e11d48] text-stone-600'
                  }`}
                  aria-label={isItemWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  {isItemWishlisted ? (
                    <HiHeart className="w-6 h-6 text-[#e11d48] fill-current drop-shadow-xs transition-transform duration-200 scale-105" />
                  ) : (
                    <HiOutlineHeart className="w-6 h-6 transition-transform duration-200 group-hover:scale-110" />
                  )}
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                  <div className="bg-black text-white text-[11px] font-medium px-2.5 py-1 rounded shadow-lg whitespace-nowrap">
                    {isItemWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                  </div>
                  <div className="w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-black" />
                </div>
              </div>
            </div>

            {/* Delivery Estimate Bar (Matches Screenshot 3) */}
            <div className="text-center pt-1 text-xs text-stone-500">
              Order Now for estimated delivery by <strong className="text-stone-800 font-semibold">{deliveryDateString}</strong>
            </div>

            {/* ══════════════════════════════════════════════════════════
                THE NEIRAH DIFFERENCE (Matches Reference Screenshot)
            ═══════════════════════════════════════════════════════════ */}
            <div className="rounded-2xl border border-[#ede3d4] bg-[#FAF8F5] p-5 sm:p-6 mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 pb-3.5 border-b border-[#e8dfd5] font-sans">
                THE NEIRAH DIFFERENCE
              </h3>

              <div className="pt-4 flex flex-col md:flex-row items-center md:items-stretch gap-4 md:gap-6 divide-y md:divide-y-0 md:divide-x divide-[#e8dfd5]">
                {/* Left side: Trust Badges */}
                <div className="flex-1 w-full grid grid-cols-2 gap-y-5 gap-x-4 sm:gap-x-6">
                  {/* Badge 1: Global Online Jeweller */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-stone-200/90 flex items-center justify-center text-stone-700 shrink-0 shadow-2xs">
                      <svg className="w-4 h-4 text-stone-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <circle cx="12" cy="9" r="6" />
                        <path d="M8.5 14.5L6 21l6-3.5 6 3.5-2.5-6.5" />
                      </svg>
                    </div>
                    <span className="text-[11px] font-medium text-stone-700 leading-tight">
                      Global Online Jeweller
                    </span>
                  </div>

                  {/* Badge 2: BIS Hallmark */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-stone-200/90 flex items-center justify-center text-stone-700 shrink-0 shadow-2xs">
                      <HiOutlineInformationCircle className="w-4.5 h-4.5 text-stone-700" />
                    </div>
                    <span className="text-[11px] font-medium text-stone-700 leading-tight">
                      BIS Hallmark
                    </span>
                  </div>

                  {/* Badge 3: Neirah Certified */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-stone-200/90 flex items-center justify-center text-stone-700 shrink-0 shadow-2xs">
                      <HiOutlineShieldCheck className="w-4.5 h-4.5 text-stone-700" />
                    </div>
                    <span className="text-[11px] font-medium text-stone-700 leading-tight">
                      Neirah Certified
                    </span>
                  </div>

                  {/* Badge 4: Free Secure Shipping */}
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-white border border-stone-200/90 flex items-center justify-center text-stone-700 shrink-0 shadow-2xs">
                      <HiOutlineTruck className="w-4.5 h-4.5 text-stone-700" />
                    </div>
                    <span className="text-[11px] font-medium text-stone-700 leading-tight">
                      Free Secure Shipping
                    </span>
                  </div>
                </div>

                {/* Right side: Certificate Preview */}
                <div className="w-full md:w-[150px] shrink-0 pt-4 md:pt-0 md:pl-6 flex flex-col items-center justify-center">
                  <div
                    onClick={() => setShowCertificateModal(true)}
                    className="border border-stone-200 bg-white p-1.5 rounded shadow-xs hover:shadow-md transition-all cursor-pointer group max-w-[130px]"
                    title="Click to view full certificate"
                  >
                    <img
                      src={certificateUrl}
                      alt="Certificate Preview"
                      className="w-full h-auto max-h-[85px] object-contain group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCertificateModal(true)}
                    className="mt-2.5 flex items-center gap-1.5 text-[11px] font-bold text-stone-800 hover:text-[#92704E] transition-colors cursor-pointer"
                  >
                    <HiOutlineEye className="w-3.5 h-3.5 text-stone-600" />
                    <span>View Certificate</span>
                  </button>
                </div>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                ACCORDIONS: PRODUCT DESCRIPTION, SPECIFICATION, PRICE BREAK UP & ORIGIN
            ═══════════════════════════════════════════════════════════ */}
            <div className="pt-2 divide-y divide-stone-200/80 border-t border-stone-200 text-xs">
              {/* Accordion 1: Product Description */}
              <div className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('desc')}
                  className="w-full flex items-center justify-between text-stone-800 text-[11px] font-medium tracking-normal cursor-pointer text-left"
                >
                  <span className="text-[11px] font-medium text-stone-800">Product Description</span>
                  <span className="text-stone-400 text-sm font-light">
                    {openAccordions.desc ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.desc && (
                  <div className="mt-2.5 text-stone-600 leading-relaxed text-xs animate-fadeIn space-y-2 pt-1 border-t border-stone-100">
                    <p>
                      {product.basicInfo?.description ||
                        product.description ||
                        'Crafted with fine craftsmanship and certified diamonds, this exquisite piece is designed for everyday elegance.'}
                    </p>
                    {Array.isArray(product.descriptionSections) &&
                      product.descriptionSections.map((sec, i) => (
                        <div key={i} className="pt-1">
                          <strong className="text-stone-800">{sec.header}: </strong>
                          <span>{sec.description}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Accordion 2: Specification */}
              <div className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('specs')}
                  className="w-full flex items-center justify-between text-stone-800 text-[11px] font-medium tracking-normal cursor-pointer text-left"
                >
                  <span className="text-[11px] font-medium text-stone-800">Specification</span>
                  <span className="text-stone-400 text-sm font-light">
                    {openAccordions.specs ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.specs && (
                  <div className="mt-2.5 text-stone-600 text-xs animate-fadeIn space-y-1.5 divide-y divide-stone-50 pt-1 border-t border-stone-100">
                    {specificationRows.map(([label, value]) => (
                      <div key={label} className="flex justify-between py-1">
                        <span className="text-stone-400">{label}</span>
                        <span className="font-semibold text-stone-800">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Accordion 3: PRICE BREAK UP (Exact Match to Screenshot) */}
              <div className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('price')}
                  className="w-full flex items-center justify-between cursor-pointer text-left"
                >
                  <span className={`text-[11px] font-semibold tracking-wider uppercase ${openAccordions.price ? 'text-[#92704E]' : 'text-stone-800'}`}>
                    PRICE BREAK UP
                  </span>
                  <span className={`text-sm font-light ${openAccordions.price ? 'text-[#92704E]' : 'text-stone-400'}`}>
                    {openAccordions.price ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.price && breakdown && (
                  <div className="mt-4 animate-fadeIn text-[11px]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-stone-150 text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                            <th className="pb-3 px-1 font-medium text-stone-400">COMPONENT</th>
                            <th className="pb-3 px-1 font-medium text-center text-stone-400">RATE</th>
                            <th className="pb-3 px-1 font-medium text-center text-stone-400">WEIGHT</th>
                            <th className="pb-3 px-1 font-medium text-right text-stone-400">VALUE</th>
                          </tr>
                        </thead>
                        <tbody className="text-stone-700 text-[11px]">
                          {/* METALS */}
                          <tr>
                            <td colSpan={4} className="pt-4 pb-2 px-1 text-[10px] font-bold tracking-wider text-stone-900 uppercase">
                              METALS
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1 px-1 font-normal text-stone-800">{breakdown.metalName}</td>
                            <td className="py-1 px-1 text-center font-mono text-stone-700">{formatBreakdownRate(breakdown.metalRate)}</td>
                            <td className="py-1 px-1 text-center font-mono text-stone-700">{formatBreakdownWeight(breakdown.metalWeight, 'g')}</td>
                            <td className="py-1 px-1 text-right font-mono text-stone-900">{formatBreakdownValue(breakdown.metalCost)}</td>
                          </tr>

                          {/* DIAMONDS */}
                          <tr>
                            <td colSpan={4} className="pt-4 pb-2 px-1 text-[10px] font-bold tracking-wider text-stone-900 uppercase">
                              DIAMONDS
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1 px-1 font-normal text-stone-800">{breakdown.diamondLabel}</td>
                            <td className="py-1 px-1 text-center text-stone-500">-</td>
                            <td className="py-1 px-1 text-center font-mono text-stone-700">{formatBreakdownWeight(breakdown.diamondCarat, 'cts')}</td>
                            <td className="py-1 px-1 text-right font-mono text-stone-900">{formatBreakdownValue(breakdown.diamondCost)}</td>
                          </tr>

                          {/* MAKING CHARGES */}
                          <tr>
                            <td colSpan={4} className="pt-4 pb-2 px-1 text-[10px] font-bold tracking-wider text-stone-900 uppercase">
                              MAKING CHARGES
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1 px-1 font-normal text-stone-800">Making Charge</td>
                            <td className="py-1 px-1 text-center text-stone-500">-</td>
                            <td className="py-1 px-1 text-center text-stone-500">-</td>
                            <td className="py-1 px-1 text-right font-mono text-stone-900">{formatBreakdownValue(breakdown.labourCharge)}</td>
                          </tr>

                          {/* OTHER CHARGES */}
                          <tr>
                            <td colSpan={4} className="pt-4 pb-2 px-1 text-[10px] font-bold tracking-wider text-stone-900 uppercase">
                              OTHER CHARGES
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1 px-1 font-normal text-stone-800">Certificate Charge</td>
                            <td className="py-1 px-1 text-center text-stone-500">-</td>
                            <td className="py-1 px-1 text-center text-stone-500">-</td>
                            <td className="py-1 px-1 text-right font-mono text-stone-900">{formatBreakdownValue(breakdown.certificateCharge)}</td>
                          </tr>

                          {/* SUMMARY */}
                          <tr>
                            <td colSpan={4} className="pt-4 pb-2 px-1 text-[10px] font-bold tracking-wider text-stone-900 uppercase">
                              SUMMARY
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1 px-1 font-normal text-stone-800">Subtotal</td>
                            <td className="py-1 px-1 text-center text-stone-500">-</td>
                            <td className="py-1 px-1 text-center text-stone-500">-</td>
                            <td className="py-1 px-1 text-right font-mono text-stone-900">{formatBreakdownValue(breakdown.subtotal)}</td>
                          </tr>
                          <tr>
                            <td className="py-1 px-1 font-normal text-stone-800">GST (3%)</td>
                            <td className="py-1 px-1 text-center text-stone-500">-</td>
                            <td className="py-1 px-1 text-center text-stone-500">-</td>
                            <td className="py-1 px-1 text-right font-mono text-stone-900">{formatBreakdownValue(breakdown.gstAmount)}</td>
                          </tr>
                          <tr className="font-bold">
                            <td className="pt-3 pb-1 px-1 font-bold text-stone-900 text-xs">Grand Total</td>
                            <td className="pt-3 pb-1 px-1 text-center text-stone-500 font-normal">-</td>
                            <td className="pt-3 pb-1 px-1 text-center text-stone-500 font-normal">-</td>
                            <td className="pt-3 pb-1 px-1 text-right font-mono font-bold text-stone-900 text-xs">{formatBreakdownValue(breakdown.finalPrice)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Variation in Weight Notice Card (Highlighted in Screenshot) */}
                    <div className="mt-5 p-3.5 rounded-xl border border-[#F0E6D8] bg-[#FAF6F0]/80 flex items-center gap-3">
                      <svg className="w-4 h-4 text-[#C59B65] shrink-0 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="1.6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                      </svg>
                      <p className="text-[11px] text-[#8C6D4F] leading-snug">
                        The final invoice amount will be adjusted in case of variation in weight.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Accordion 4: Manufacturer & Origin */}
              <div className="py-3.5">
                <button
                  type="button"
                  onClick={() => toggleAccordion('origin')}
                  className="w-full flex items-center justify-between text-stone-800 text-[11px] font-medium tracking-normal cursor-pointer text-left"
                >
                  <span className="text-[11px] font-medium text-stone-800">Manufacturer &amp; Origin</span>
                  <span className="text-stone-400 text-sm font-light">
                    {openAccordions.origin ? '−' : '+'}
                  </span>
                </button>
                {openAccordions.origin && (
                  <div className="mt-2.5 text-stone-700 text-xs animate-fadeIn space-y-2 pt-1 border-t border-stone-100">
                    <div className="grid grid-cols-3 gap-2 py-1">
                      <span className="text-stone-500 font-medium">Manufacturer:</span>
                      <span className="col-span-2 font-semibold text-stone-900">Neirah E-Retail India Pvt. Ltd.</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 py-1">
                      <span className="text-stone-500 font-medium">Country of Origin:</span>
                      <span className="col-span-2 font-semibold text-stone-900">India</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─── MOST LIKED PIECES ─── */}
        {mostLikedProducts.length > 0 && (
          <div className="pt-16 sm:pt-20 border-t border-stone-100 mt-16">
            <div className="mb-8 text-center sm:text-left">
              <h2 className="text-xs font-bold uppercase tracking-[0.25em] text-stone-400">
                MOST LIKED PIECES
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              {mostLikedProducts
                .filter((item) => getPrimaryProductImage(item))
                .map((item) => {
                  const relImg = getPrimaryProductImage(item);
                  const relPrice = item.pricing?.salePrice ?? item.pricing?.mrp;

                  return (
                    <div
                      key={item._id || item.basicInfo?.slug}
                      onClick={() => {
                        const targetSlug =
                          item.basicInfo?.slug ||
                          item.slug ||
                          (item.basicInfo?.title || item.title || item.name
                            ? String(item.basicInfo?.title || item.title || item.name)
                                .toLowerCase()
                                .trim()
                                .replace(/[^\w\s-]/g, '')
                                .replace(/\s+/g, '-')
                            : '');
                        if (targetSlug) {
                          navigate(`/product/${encodeURIComponent(targetSlug)}`);
                        }
                      }}
                      className="group bg-white rounded-2xl border border-stone-100/90 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    >
                      {/* Image container */}
                      <div className="relative aspect-square bg-[#faf8f5] p-3 flex items-center justify-center overflow-hidden">
                        <img
                          src={relImg}
                          alt={item.basicInfo?.title || ''}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />

                        {/* Quick wishlist button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(item);
                          }}
                          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 backdrop-blur-xs flex items-center justify-center text-stone-400 hover:text-red-500 transition-colors shadow-2xs cursor-pointer"
                        >
                          {isWishlisted(item._id) ? (
                            <HiHeart className="w-4 h-4 text-red-500" />
                          ) : (
                            <HiOutlineHeart className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {/* Title & Price */}
                      <div className="p-3 text-center space-y-1">
                        <h3 className="text-[11px] font-bold text-stone-800 line-clamp-2 uppercase tracking-tight leading-snug group-hover:text-[#8f6d43] transition-colors">
                          {item.basicInfo?.title}
                        </h3>
                        <p className="text-xs font-bold text-stone-900 font-serif">
                          {formatPrice(relPrice)}
                        </p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Lightbox Modal ─── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-stone-300 text-sm font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <HiOutlineX className="w-6 h-6" />
              <span>Close</span>
            </button>
            {isVideoMedia(lightboxImage) ? (
              <video
                src={lightboxImage}
                controls
                autoPlay
                loop
                playsInline
                className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl bg-black"
              />
            ) : (
              <img
                src={lightboxImage}
                alt="High Resolution Zoom"
                className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl bg-white"
              />
            )}
          </div>
        </div>
      )}

      {/* ─── Size Guide Modal ─── */}
      {showSizeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn"
          onClick={() => setShowSizeModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900 font-serif">
                {categoryName ? `${categoryName} size guide` : 'Size guide'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSizeModal(false)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-600">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 text-[10px] uppercase font-bold text-stone-500 border-b border-stone-200">
                      <th className="py-2 px-3">Available sizes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {sizes.map((size) => (
                      <tr key={size._id}>
                        <td className="py-1.5 px-3 font-semibold">{size.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowSizeModal(false)}
              className="w-full py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-stone-800 transition-colors cursor-pointer"
            >
              GOT IT
            </button>
          </div>
        </div>
      )}

      {/* ─── Certificate Preview Lightbox Modal ─── */}
      {showCertificateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowCertificateModal(false)}
        >
          <div
            className="relative bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-stone-900 font-serif">
                  Authenticity &amp; Grading Certificate
                </h3>
                <p className="text-xs text-stone-500">
                  {product.basicInfo?.title || 'Fine Jewellery Certificate'} • {product.basicInfo?.sku || 'Certified'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCertificateModal(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors cursor-pointer"
                aria-label="Close certificate modal"
              >
                <HiOutlineX className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-stone-50 rounded-xl p-2 sm:p-4 border border-stone-200/80 flex items-center justify-center">
              <img
                src={certificateUrl}
                alt="Jewellery Certificate"
                className="max-h-[60vh] w-auto object-contain rounded shadow-md"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-stone-500 text-center sm:text-left">
                100% Certified Natural &amp; Lab Grown Diamonds • BIS Hallmarked Gold
              </span>
              <a
                href={certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#92704E] hover:bg-[#7e5f40] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0"
              >
                <span>Open Original</span>
                <HiOutlineExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ─── Mobile Sticky Bottom Action Bar ─── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="min-w-0">
          <div className="text-[10px] text-stone-500 uppercase tracking-wider font-medium">Total (MRP Incl. taxes)</div>
          <div className="text-base sm:text-lg font-sans font-bold text-stone-900 leading-tight truncate">
            {formatPrice(currentPrice)}
          </div>
        </div>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={addingToCart}
          className="flex-1 py-3 bg-[#141414] active:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          {addingToCart ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>ADD TO CART</span>
          )}
        </button>
        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95 shrink-0 ${
            isItemWishlisted
              ? 'border-rose-200 bg-rose-50 text-[#e11d48]'
              : 'border-stone-200 bg-white text-stone-600 hover:text-[#e11d48]'
          }`}
          aria-label={isItemWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          {isItemWishlisted ? (
            <HiHeart className="w-5 h-5 text-[#e11d48] fill-current" />
          ) : (
            <HiOutlineHeart className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}
