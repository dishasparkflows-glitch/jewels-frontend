import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import {
  HiOutlineLocationMarker,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineClock,
  HiOutlineExternalLink,
  HiOutlineCalendar,
  HiOutlineHome,
  HiOutlineChevronRight,
} from 'react-icons/hi';
import { storesAPI } from '../../api/services';
import { useStoreSettings } from '../../contexts/StoreSettingsContext';
import { getImageUrl } from '../../utils/imageUrl';
import LuxuryDivider from '../../components/common/LuxuryDivider';

// Crisp architectural fine-line storefront icon for state cards
function StateLandmarkIcon({ variant = 0 }) {
  const idx = variant % 4;
  if (idx === 0) {
    return (
      <svg className="w-11 h-11 mx-auto" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 40h32" />
        <path d="M12 40V22l12-8 12 8v18" />
        <path d="M20 40V29a4 4 0 0 1 8 0v11" />
        <path d="M16 14v-3a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3" />
        <circle cx="24" cy="20" r="1.5" />
      </svg>
    );
  }
  if (idx === 1) {
    return (
      <svg className="w-11 h-11 mx-auto" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 40h36" />
        <path d="M10 40V20h28v20" />
        <path d="M18 40V28a6 6 0 0 1 12 0v12" />
        <path d="M13 20c0-4 2-6 2-8M35 20c0-4-2-6-2-8M24 20v-7" />
        <circle cx="24" cy="11" r="2" />
      </svg>
    );
  }
  if (idx === 2) {
    return (
      <svg className="w-11 h-11 mx-auto" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 40h34" />
        <path d="M11 40V18l4-4 4 4v22M29 40V18l4-4 4 4v22" />
        <path d="M19 26h10M19 40V26h10v14" />
        <path d="M22 26v-5a2 2 0 0 1 4 0v5" />
      </svg>
    );
  }
  return (
    <svg className="w-11 h-11 mx-auto" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 40h32" />
      <path d="M14 40V16l10-8 10 8v24" />
      <path d="M10 40V25h4M34 25h4v15" />
      <path d="M21 40v-9a3 3 0 0 1 6 0v9" />
      <path d="M24 8V5" />
    </svg>
  );
}

const THEME_PRIMARY = 'var(--btn-primary-bg, #8b6f4e)';
const THEME_PRIMARY_HOVER = 'var(--btn-primary-hover, #755c3e)';
const THEME_PRIMARY_TEXT = 'var(--btn-primary-text, #ffffff)';
const THEME_SOFT_BG = 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 8%, #ffffff)';
const THEME_BADGE_BG = 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 12%, #ffffff)';
const THEME_BORDER_SOFT = 'color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 32%, transparent)';
const THEME_GLOW = '0 8px 24px -6px color-mix(in srgb, var(--btn-primary-bg, #8b6f4e) 22%, transparent)';

const formatProperText = (value) => {
  const str = String(value || '').trim().replace(/\s+/g, ' ');
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => {
      // Leave words that already contain uppercase letters or start with digits (e.g. SCO, MG, C-Scheme, 11th) intact
      if (/[A-Z]/.test(word) || !/^[a-z]/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

const formatStoreAddress = (loc = {}) => {
  const addr = loc.address || {};
  const rawParts = [addr.line1, addr.line2, addr.landmark, loc.area, loc.city, loc.state];
  const seenTokens = new Set();
  const dedupedParts = [];

  rawParts.forEach((raw) => {
    const cleaned = formatProperText(raw);
    if (!cleaned) return;
    const subTokens = cleaned
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    // Skip appending a standalone part (e.g. loc.area / loc.city) if all its comma tokens already appear in earlier address lines
    if (subTokens.length > 0 && subTokens.every((t) => seenTokens.has(t))) {
      return;
    }
    subTokens.forEach((t) => seenTokens.add(t));
    dedupedParts.push(cleaned);
  });

  const baseAddress = dedupedParts.join(', ');
  const pin = String(addr.pincode || '').trim();
  return pin ? `${baseAddress} - ${pin}` : baseAddress;
};

export default function Stores() {
  const { brandName } = useStoreSettings();
  const [searchParams, setSearchParams] = useSearchParams();

  const [statesSummary, setStatesSummary] = useState({ totalStores: 0, totalStates: 0, states: [] });
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedState, setSelectedState] = useState(searchParams.get('state') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '');
  const [selectedArea, setSelectedArea] = useState(searchParams.get('area') || '');

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const [statesRes, storesRes] = await Promise.all([
          storesAPI.getStates(),
          storesAPI.getLookup(),
        ]);
        if (!mounted) return;
        const summaryData = statesRes.data?.data || { totalStores: 0, totalStates: 0, states: [] };
        const storesList = Array.isArray(storesRes.data?.data) ? storesRes.data.data : [];
        setStatesSummary(summaryData);
        setStores(storesList);
      } catch (err) {
        console.error('Failed to load stores:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Sync URL query params when filters change
  useEffect(() => {
    const next = new URLSearchParams();
    if (selectedState) next.set('state', selectedState);
    if (selectedCity) next.set('city', selectedCity);
    if (selectedArea) next.set('area', selectedArea);
    setSearchParams(next, { replace: true });
  }, [selectedState, selectedCity, selectedArea, setSearchParams]);

  // Active state summary data
  const activeStateSummary = useMemo(() => {
    if (!selectedState) return null;
    return statesSummary.states.find(
      (s) => s.state.toLowerCase() === selectedState.toLowerCase()
    );
  }, [statesSummary.states, selectedState]);

  // Cities for the active state
  const stateCities = useMemo(() => {
    if (!selectedState) return [];
    if (activeStateSummary?.cities?.length > 0) {
      return activeStateSummary.cities;
    }
    const map = new Map();
    stores
      .filter((s) => String(s.location?.state || '').toLowerCase() === selectedState.toLowerCase())
      .forEach((s) => {
        if (!s.location?.city) return;
        const key = s.location.city.toLowerCase();
        if (!map.has(key)) map.set(key, { city: s.location.city, count: 0 });
        map.get(key).count += 1;
      });
    return Array.from(map.values()).sort((a, b) => a.city.localeCompare(b.city));
  }, [selectedState, activeStateSummary, stores]);

  // Stores in active state count
  const stateStoreCount = useMemo(() => {
    if (!selectedState) return 0;
    if (activeStateSummary?.count) return activeStateSummary.count;
    return stores.filter((s) => String(s.location?.state || '').toLowerCase() === selectedState.toLowerCase()).length;
  }, [selectedState, activeStateSummary, stores]);

  // Filtered stores
  const filteredStores = useMemo(() => {
    return stores.filter((s) => {
      if (selectedState && String(s.location?.state || '').toLowerCase() !== selectedState.toLowerCase()) {
        return false;
      }
      if (selectedCity && String(s.location?.city || '').toLowerCase() !== selectedCity.toLowerCase()) {
        return false;
      }
      if (selectedArea && String(s.location?.area || '').toLowerCase() !== selectedArea.toLowerCase()) {
        return false;
      }
      return true;
    });
  }, [stores, selectedState, selectedCity, selectedArea]);

  const handleStateCardClick = (stateName) => {
    if (selectedState.toLowerCase() === stateName.toLowerCase()) {
      setSelectedState('');
      setSelectedCity('');
      setSelectedArea('');
    } else {
      setSelectedState(stateName);
      setSelectedCity('');
      setSelectedArea('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCityCardClick = (cityName) => {
    if (selectedCity.toLowerCase() === cityName.toLowerCase()) {
      setSelectedCity('');
      setSelectedArea('');
    } else {
      setSelectedCity(cityName);
      setSelectedArea('');
      setTimeout(() => {
        document.getElementById('stores-listing-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  const handleBackToAllStates = () => {
    setSelectedState('');
    setSelectedCity('');
    setSelectedArea('');
  };

  const hasActiveFilter = Boolean(selectedState || selectedCity || selectedArea);
  const totalCount = statesSummary.totalStores || stores.length;
  const countryLabel = useMemo(() => {
    const countries = Array.from(new Set(stores.map((s) => s.location?.country).filter(Boolean)));
    return countries.length === 1 ? countries[0] : 'India';
  }, [stores]);

  return (
    <div
      style={{
        backgroundColor: 'var(--jewel-paper, #fbfaf8)',
        color: 'var(--jewel-ink, #29251f)',
      }}
      className="min-h-[75vh] pb-20"
    >
      <SEO
        title={`Store Locator | ${brandName} Stores`}
        description={`Find ${brandName} fine jewellery boutiques and showrooms near you across states, cities, and areas.`}
        type="website"
      />

      {/* ─── Hero Header Strip ───────────────────────────────── */}
      <section className="border-b border-stone-200/70 bg-white/70 backdrop-blur-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center">
          <h1
            style={{
              fontVariantNumeric: 'lining-nums',
              fontFeatureSettings: '"lnum" 1',
              color: 'var(--jewel-ink, #29251f)',
            }}
            className="font-serif text-2xl sm:text-3xl font-normal tracking-wide lining-nums"
          >
            {selectedState
              ? `${stateStoreCount} ${brandName} ${stateStoreCount === 1 ? 'Store' : 'Stores'} in ${selectedState}`
              : `${totalCount} ${brandName} ${totalCount === 1 ? 'Store' : 'Stores'} in ${countryLabel}`}
          </h1>
          <LuxuryDivider
            lineWidth="w-12 sm:w-20"
            starSize="w-3 h-3 sm:w-3.5 sm:h-3.5"
            className="mt-2 sm:mt-2.5"
          />
        </div>
      </section>

      {/* ─── Breadcrumb & State / City Cards Section ────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        {selectedState && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-7">
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs sm:text-sm text-stone-500">
              <button
                type="button"
                onClick={handleBackToAllStates}
                className="inline-flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                title="All States"
              >
                <HiOutlineHome className="w-4 h-4 shrink-0" style={{ color: THEME_PRIMARY }} />
                <span>{countryLabel}</span>
              </button>

              <HiOutlineChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />

              {selectedCity ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCity('');
                    setSelectedArea('');
                  }}
                  className="hover:underline cursor-pointer text-stone-600 font-medium"
                >
                  {selectedState}
                </button>
              ) : (
                <span className="font-semibold text-stone-900">{selectedState}</span>
              )}

              {selectedCity && (
                <>
                  <HiOutlineChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                  <span className="font-semibold" style={{ color: THEME_PRIMARY }}>
                    {selectedCity}
                  </span>
                </>
              )}
            </nav>

            <button
              type="button"
              onClick={handleBackToAllStates}
              style={{
                borderColor: THEME_BORDER_SOFT,
                backgroundColor: THEME_SOFT_BG,
                color: 'var(--jewel-ink, #29251f)',
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold hover:shadow-xs transition-all cursor-pointer"
            >
              <HiOutlineLocationMarker className="w-3.5 h-3.5 shrink-0" style={{ color: THEME_PRIMARY }} />
              <span>View All States</span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {Array.from({ length: 7 }).map((_, idx) => (
              <div
                key={idx}
                className="w-[calc(50%-0.5rem)] sm:w-[155px] h-[155px] rounded-xl bg-white border border-stone-200/70 animate-pulse"
              />
            ))}
          </div>
        ) : selectedState ? (
          /* ─── State Selected: Centered Horizontal City Pill Cards ─── */
          stateCities.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-3.5 mb-6">
              {stateCities.map((c) => {
                const isSelected =
                  selectedCity.toLowerCase() === c.city.toLowerCase() || stateCities.length === 1;
                return (
                  <button
                    key={c.city}
                    type="button"
                    onClick={() => handleCityCardClick(c.city)}
                    style={
                      isSelected
                        ? {
                            borderColor: THEME_PRIMARY,
                            backgroundColor: THEME_SOFT_BG,
                            boxShadow: THEME_GLOW,
                          }
                        : undefined
                    }
                    className={`min-w-[205px] max-w-xs px-5 py-3.5 rounded-xl bg-white border flex items-center gap-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm cursor-pointer ${
                      isSelected ? 'border-[1.5px]' : 'border-stone-200/90 hover:border-stone-300'
                    }`}
                  >
                    <div
                      style={{ backgroundColor: THEME_BADGE_BG, color: THEME_PRIMARY }}
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    >
                      <HiOutlineLocationMarker className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm font-semibold text-stone-900 truncate" title={formatProperText(c.city)}>
                        {formatProperText(c.city)}
                      </h2>
                      <p className="text-xs text-stone-500 mt-0.5 lining-nums">
                        {c.count} {c.count === 1 ? 'Store' : 'Stores'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null
        ) : statesSummary.states.length > 0 ? (
          /* ─── No State Selected: Centered State Cards Grid ─── */
          <div className="flex flex-wrap justify-center gap-3.5 sm:gap-4">
            {statesSummary.states.map((st, idx) => {
              const isSelected = selectedState.toLowerCase() === st.state.toLowerCase();
              const iconUrl = st.stateIcon?.url || (typeof st.stateIcon === 'string' ? st.stateIcon : '');

              return (
                <button
                  key={st.state}
                  type="button"
                  onClick={() => handleStateCardClick(st.state)}
                  style={
                    isSelected
                      ? {
                          borderColor: THEME_PRIMARY,
                          backgroundColor: THEME_SOFT_BG,
                          boxShadow: THEME_GLOW,
                        }
                      : undefined
                  }
                  className="group w-[calc(50%-0.5rem)] sm:w-[156px] h-[156px] p-4 rounded-xl bg-white border border-stone-200/90 hover:border-stone-300 flex flex-col items-center justify-between text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                >
                  <div
                    style={{ color: THEME_PRIMARY }}
                    className="flex-1 flex items-center justify-center w-full"
                  >
                    {iconUrl ? (
                      <img
                        src={getImageUrl(iconUrl)}
                        alt={st.state}
                        className="w-12 h-12 object-contain mx-auto"
                      />
                    ) : (
                      <StateLandmarkIcon variant={idx} />
                    )}
                  </div>
                  <div className="w-full">
                    <h2 className="text-xs sm:text-sm font-semibold text-stone-900 truncate" title={formatProperText(st.state)}>
                      {formatProperText(st.state)}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-stone-500 mt-0.5 lining-nums">
                      {st.count} {st.count === 1 ? 'Store' : 'Stores'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : null}
      </section>

      {/* ─── Boutiques Listing (Horizontal Luxury Cards when State / City Filter Active) ─── */}
      {hasActiveFilter && (
        <section id="stores-listing-section" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="relative text-center pb-4 border-b border-stone-200/80 mb-6">
            <div>
              <h2 className="font-serif text-2xl sm:text-[28px] font-medium text-stone-900 leading-tight">
                {selectedCity
                  ? `${formatProperText(selectedCity)} Boutiques`
                  : selectedState
                  ? `${formatProperText(selectedState)} Boutiques`
                  : 'Matching Stores'}
              </h2>
              <p className="text-xs sm:text-[13px] text-stone-600 mt-1 lining-nums">
                Showing {filteredStores.length} {filteredStores.length === 1 ? 'store' : 'stores'}
                {selectedCity ? ` in ${formatProperText(selectedCity)}` : selectedState ? ` in ${formatProperText(selectedState)}` : ''}
              </p>
            </div>

            {selectedCity && (
              <button
                type="button"
                onClick={() => setSelectedCity('')}
                style={{ color: THEME_PRIMARY }}
                className="mt-2 sm:mt-0 sm:absolute sm:right-0 sm:bottom-4 text-xs font-semibold hover:underline cursor-pointer"
              >
                Show all in {formatProperText(selectedState)}
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-48 rounded-2xl bg-white border border-stone-200/70 animate-pulse" />
              ))}
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="py-16 text-center space-y-3 bg-white rounded-2xl border border-stone-200/80 p-8">
              <HiOutlineLocationMarker className="w-10 h-10 mx-auto opacity-50" style={{ color: THEME_PRIMARY }} />
              <h3 className="font-serif text-xl font-medium text-stone-800">No stores found</h3>
              <p className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto">
                No boutiques matched your current selection.
              </p>
              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleBackToAllStates}
                  className="px-5 py-2.5 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
                >
                  View All States
                </button>
                <Link
                  to="/shop"
                  style={{
                    backgroundColor: THEME_PRIMARY,
                    color: THEME_PRIMARY_TEXT,
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider hover:opacity-90 transition-opacity"
                >
                  Shop Collection
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5">
              {filteredStores.map((store) => {
                const loc = store.location || {};
                const addr = loc.address || {};
                const contact = store.contact || {};
                const displayName = formatProperText(store.name);
                const displayArea = formatProperText(loc.area);
                const displayCity = formatProperText(loc.city);
                const fullAddress = formatStoreAddress(loc);
                const imgSrc = store.image?.url ? getImageUrl(store.image.url) : '';
                const directionsHref =
                  loc.mapUrl ||
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    [displayName, addr.line1, addr.line2, loc.area, loc.city, loc.state, addr.pincode]
                      .filter(Boolean)
                      .join(', ')
                  )}`;

                return (
                  <article
                    key={store._id}
                    className="rounded-2xl border border-stone-200/80 bg-white shadow-2xs hover:shadow-md transition-all p-4 sm:p-5 lg:p-6"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-7">
                      {/* Left: Store Photo or Theme-tinted Architectural Placeholder */}
                      <div className="w-full lg:w-[270px] xl:w-[295px] h-48 sm:h-52 lg:h-[186px] rounded-xl overflow-hidden border border-stone-200/70 shrink-0 bg-stone-100">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={displayName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            style={{ backgroundColor: THEME_SOFT_BG, color: THEME_PRIMARY }}
                            className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center"
                          >
                            <StateLandmarkIcon variant={0} />
                            <span className="font-serif text-sm font-medium text-stone-700">
                              {brandName} {displayCity ? `• ${displayCity}` : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Middle: Badge, Title & Details */}
                      <div className="flex-1 min-w-0 space-y-2.5">
                        <span
                          style={{
                            backgroundColor: THEME_BADGE_BG,
                            color: THEME_PRIMARY,
                          }}
                          className="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest"
                        >
                          {[displayArea, displayCity].filter(Boolean).join(' • ')}
                        </span>

                        <h3 className="font-serif text-xl sm:text-[22px] font-semibold text-stone-900 leading-snug lining-nums">
                          {displayName}
                        </h3>

                        <div className="space-y-2 text-xs sm:text-[13px] text-stone-700 leading-relaxed pt-0.5 lining-nums">
                          <div className="flex items-start gap-2.5">
                            <HiOutlineLocationMarker
                              className="w-4 h-4 shrink-0 mt-0.5"
                              style={{ color: THEME_PRIMARY }}
                            />
                            <span>{fullAddress}</span>
                          </div>

                          {store.timings && (
                            <div className="flex items-center gap-2.5">
                              <HiOutlineClock
                                className="w-4 h-4 shrink-0"
                                style={{ color: THEME_PRIMARY }}
                              />
                              <span>{store.timings}</span>
                            </div>
                          )}

                          {contact.phone && (
                            <div className="flex items-center gap-2.5">
                              <HiOutlinePhone
                                className="w-4 h-4 shrink-0"
                                style={{ color: THEME_PRIMARY }}
                              />
                              <a
                                href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}
                                className="font-semibold text-stone-900 hover:underline transition-colors"
                              >
                                {contact.phone}
                              </a>
                            </div>
                          )}

                          {contact.email && (
                            <div className="flex items-center gap-2.5">
                              <HiOutlineMail
                                className="w-4 h-4 shrink-0"
                                style={{ color: THEME_PRIMARY }}
                              />
                              <a
                                href={`mailto:${contact.email.toLowerCase()}`}
                                className="font-medium text-stone-800 hover:underline transition-colors truncate"
                              >
                                {contact.email.toLowerCase()}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Divider + Action Buttons */}
                      <div className="lg:w-[220px] xl:w-[232px] shrink-0 lg:self-stretch lg:border-l lg:border-stone-200/80 lg:pl-7 flex flex-row lg:flex-col lg:justify-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-stone-100">
                        <a
                          href={directionsHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            backgroundColor: THEME_PRIMARY,
                            color: THEME_PRIMARY_TEXT,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = THEME_PRIMARY_HOVER;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = THEME_PRIMARY;
                          }}
                          className="flex-1 lg:flex-none lg:w-full min-h-[42px] py-2.5 px-5 inline-flex items-center justify-center gap-2 rounded-lg text-xs sm:text-[13px] font-semibold whitespace-nowrap shadow-2xs transition-colors"
                        >
                          <HiOutlineExternalLink className="w-4 h-4 shrink-0" />
                          <span>Get Directions</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => window.dispatchEvent(new CustomEvent('open-virtual-appointment'))}
                          style={{
                            borderColor: THEME_BORDER_SOFT,
                            color: 'var(--jewel-ink, #29251f)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = THEME_SOFT_BG;
                            e.currentTarget.style.borderColor = THEME_PRIMARY;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.borderColor = THEME_BORDER_SOFT;
                          }}
                          className="flex-1 lg:flex-none lg:w-full min-h-[42px] py-2.5 px-5 inline-flex items-center justify-center gap-2 rounded-lg border bg-white text-xs sm:text-[13px] font-semibold whitespace-nowrap transition-colors cursor-pointer"
                        >
                          <HiOutlineCalendar className="w-4 h-4 shrink-0" style={{ color: THEME_PRIMARY }} />
                          <span>Book Visit</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
