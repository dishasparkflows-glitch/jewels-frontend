import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { commonAPI } from '../api/services';

/* eslint-disable react/prop-types */

const StoreSettingsContext = createContext(null);
const BOOTSTRAP_STORAGE_KEY = 'neirah_storefront_bootstrap_v1';

function getInitialCachedBootstrap() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(BOOTSTRAP_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

export function StoreSettingsProvider({ children }) {
  const cached = useMemo(() => getInitialCachedBootstrap(), []);

  const [settings, setSettings] = useState(() => cached?.settings || {});
  const [footerSettings, setFooterSettings] = useState(() => cached?.footerSettings || {});
  const [topAnnouncement, setTopAnnouncement] = useState(() => cached?.topAnnouncement || {
    isEnabled: false,
    displayDirection: 'horizontal',
    autoplayInterval: 4000,
    items: [],
  });
  const [websiteConfig, setWebsiteConfig] = useState(() => cached?.websiteConfig || null);
  const [navigation, setNavigation] = useState(() => cached?.navigation || []);
  const [revision, setRevision] = useState(() => cached?.revision || 0);
  const [loading, setLoading] = useState(() => !cached);

  const currentRevisionRef = useRef(revision);
  useEffect(() => {
    currentRevisionRef.current = revision;
  }, [revision]);

  const applyBootstrapData = useCallback((data) => {
    if (!data) return;
    if (data.settings) setSettings(data.settings);
    if (data.footerSettings) setFooterSettings(data.footerSettings);
    if (data.topAnnouncement) setTopAnnouncement(data.topAnnouncement);
    if (data.websiteConfig) setWebsiteConfig(data.websiteConfig);
    if (Array.isArray(data.navigation)) setNavigation(data.navigation);
    if (typeof data.revision === 'number') {
      setRevision(data.revision);
      currentRevisionRef.current = data.revision;
    }

    try {
      sessionStorage.setItem(BOOTSTRAP_STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
  }, []);

  const refreshBootstrap = useCallback(async (options = { fresh: true }) => {
    try {
      const res = await commonAPI.getBootstrap(options);
      const data = res?.data?.data;
      if (data) {
        applyBootstrapData(data);
      }
      return data;
    } catch (err) {
      console.warn('Failed to load storefront bootstrap data:', err);
      return null;
    }
  }, [applyBootstrapData]);

  // Initial load
  useEffect(() => {
    let mounted = true;
    commonAPI.getBootstrap()
      .then((res) => {
        if (!mounted) return;
        const data = res?.data?.data;
        if (data) applyBootstrapData(data);
      })
      .catch((err) => {
        console.warn('Initial bootstrap fetch error:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [applyBootstrapData]);

  // Smart Revalidation: Check revision on tab focus & gentle interval
  useEffect(() => {
    let isChecking = false;

    const checkFreshness = async () => {
      if (isChecking) return;
      isChecking = true;
      try {
        const res = await commonAPI.getRevision();
        const remoteRev = res?.data?.data?.revision;
        if (typeof remoteRev === 'number' && remoteRev !== currentRevisionRef.current) {
          // Admin updated something! Silently fetch fresh bootstrap data
          await refreshBootstrap({ fresh: true });
        }
      } catch (_) {
        // Silently ignore revision ping failures
      } finally {
        isChecking = false;
      }
    };

    const handleFocus = () => {
      checkFreshness();
    };

    window.addEventListener('focus', handleFocus);
    const intervalTimer = window.setInterval(checkFreshness, 60_000); // Check every 60s

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.clearInterval(intervalTimer);
    };
  }, [refreshBootstrap]);

  const theme = websiteConfig?.theme?.config || null;

  // Dynamically apply primary button colors across the entire storefront & portals
  useEffect(() => {
    const root = document.documentElement;
    const colors = settings?.themeColors || {};
    const btnBg = colors.buttonColor || settings?.buttonColor || theme?.colors?.primary || '#8b6f4e';
    const btnHover = colors.buttonHoverColor || settings?.buttonHoverColor || '#755c3e';
    const btnText = colors.buttonTextColor || '#ffffff';

    const topBarBg = colors.topBarBgColor || '#201e1b';
    const topBarText = colors.topBarTextColor || '#ffffff';
    const headerBg = colors.headerBgColor || '#201e1b';
    const headerText = colors.headerTextColor || '#ffffff';
    const footerBg = colors.footerBgColor || '#0f0d0b';
    const footerText = colors.footerTextColor || '#c8b89e';

    root.style.setProperty('--btn-primary-bg', btnBg);
    root.style.setProperty('--btn-primary-hover', btnHover);
    root.style.setProperty('--btn-primary-text', btnText);

    root.style.setProperty('--storefront-topbar-bg', topBarBg);
    root.style.setProperty('--storefront-topbar-text', topBarText);
    root.style.setProperty('--storefront-header-bg', headerBg);
    root.style.setProperty('--storefront-header-text', headerText);
    root.style.setProperty('--storefront-footer-bg', footerBg);
    root.style.setProperty('--storefront-footer-text', footerText);
  }, [settings?.themeColors, theme?.colors?.primary]);

  useEffect(() => {
    const title = theme?.seo?.metaTitle;
    const description = theme?.seo?.metaDescription;
    if (!title && !description) return undefined;
    const previousTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const previousDescription = meta?.content;
    if (title) document.title = title;
    if (description && meta) meta.content = description;
    return () => {
      document.title = previousTitle;
      if (meta && previousDescription !== undefined) meta.content = previousDescription;
    };
  }, [theme?.seo?.metaTitle, theme?.seo?.metaDescription]);

  const themeStyle = useMemo(() => {
    const colors = theme?.colors || {};
    const savedButtonColors = settings?.themeColors || {};
    const btnBg = savedButtonColors.buttonColor || settings?.buttonColor || colors.primary || '#8b6f4e';
    const btnHover = savedButtonColors.buttonHoverColor || settings?.buttonHoverColor || '#755c3e';
    const btnText = savedButtonColors.buttonTextColor || settings?.buttonTextColor || '#ffffff';

    return {
      '--btn-primary-bg': btnBg,
      '--btn-primary-hover': btnHover,
      '--btn-primary-text': btnText,
      '--jewel-primary': btnBg,
      '--jewel-secondary': colors.secondary || '#EADCC8',
      '--jewel-paper': colors.background || '#FBF9F5',
      '--jewel-surface': colors.surface || '#FFFFFF',
      '--jewel-ink': colors.text || '#29251F',
      '--jewel-accent': colors.accent || btnBg,
      '--jewel-heading-font': `'${theme?.typography?.headingFont || 'Cormorant Garamond'}', Georgia, serif`,
      '--jewel-body-font': `'${theme?.typography?.bodyFont || 'Montserrat'}', system-ui, sans-serif`,
      '--jewel-radius': `${Math.min(32, Math.max(0, Number(theme?.borderRadius) || 0))}px`,
    };
  }, [theme, settings?.themeColors, settings?.buttonColor, settings?.buttonHoverColor, settings?.buttonTextColor]);

  return (
    <StoreSettingsContext.Provider
      value={{
        settings,
        footerSettings,
        topAnnouncement,
        websiteConfig,
        navigation,
        revision,
        theme,
        themeStyle,
        loading,
        refreshBootstrap,
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
}

// Provider and hook intentionally live together with this context.
// eslint-disable-next-line react-refresh/only-export-components
export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);
  if (!context) throw new Error('useStoreSettings must be used within StoreSettingsProvider');
  return context;
}
