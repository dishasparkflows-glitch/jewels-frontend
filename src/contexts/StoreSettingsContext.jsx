import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { settingsAPI, websiteAPI } from '../api/services';

/* eslint-disable react/prop-types */

const StoreSettingsContext = createContext(null);

export function StoreSettingsProvider({ children }) {
  const [settings, setSettings] = useState({});
  const [footerSettings, setFooterSettings] = useState({});
  const [topAnnouncement, setTopAnnouncement] = useState({ isEnabled: false, displayDirection: 'horizontal', autoplayInterval: 4000, items: [] });
  const [websiteConfig, setWebsiteConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([settingsAPI.getCommonSettings(), websiteAPI.getConfig()])
      .then(([commonResult, themeResult]) => {
        if (!mounted) return;
        if (commonResult.status === 'fulfilled') {
          const commonData = commonResult.value?.data?.data || {};
          setSettings(commonData.settings || {});
          setFooterSettings(commonData.footerSettings || {});
          if (commonData.topAnnouncement) {
            setTopAnnouncement(commonData.topAnnouncement);
          }
        } else {
          console.warn('Failed to load store settings:', commonResult.reason);
        }
        if (themeResult.status === 'fulfilled') setWebsiteConfig(themeResult.value?.data?.data || null);
        else console.warn('Failed to load website theme configuration:', themeResult.reason);
      })
      .finally(() => { if (mounted) setLoading(false); });

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const refreshStoreData = () => {
      websiteAPI.getConfig()
        .then(({ data }) => {
          if (!mounted) return;
          const next = data?.data || null;
          setWebsiteConfig((current) => current?.revision === next?.revision ? current : next);
        })
        .catch((error) => console.warn('Failed to refresh website theme configuration:', error));

      settingsAPI.getCommonSettings({ fresh: true })
        .then(({ data }) => {
          if (!mounted) return;
          const commonData = data?.data || {};
          setSettings(commonData.settings || {});
          setFooterSettings(commonData.footerSettings || {});
          if (commonData.topAnnouncement) {
            setTopAnnouncement(commonData.topAnnouncement);
          }
        })
        .catch((error) => console.warn('Failed to refresh store settings:', error));
    };

    const timer = window.setInterval(refreshStoreData, 300_000);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const theme = websiteConfig?.theme?.config || null;

  // Dynamically apply primary button colors across the entire storefront & portals
  useEffect(() => {
    const root = document.documentElement;
    const colors = settings?.themeColors || {};
    const btnBg = colors.buttonColor || settings?.buttonColor || theme?.colors?.primary || '#1f3a2b';
    const btnHover = colors.buttonHoverColor || settings?.buttonHoverColor || '#162b20';
    const btnText = colors.buttonTextColor || settings?.buttonTextColor || '#ffffff';

    const topBarBg = colors.topBarBgColor || '#60574d';
    const topBarText = colors.topBarTextColor || '#ffffff';
    const headerBg = colors.headerBgColor || '#22201e';
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
  }, [settings?.themeColors, settings?.buttonColor, settings?.buttonHoverColor, settings?.buttonTextColor, theme?.colors?.primary]);
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
    const btnBg = settings?.buttonColor || colors.primary || '#1f3a2b';
    const btnHover = settings?.buttonHoverColor || '#162b20';
    const btnText = settings?.buttonTextColor || '#ffffff';

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
  }, [theme, settings?.buttonColor, settings?.buttonHoverColor, settings?.buttonTextColor]);

  return (
    <StoreSettingsContext.Provider value={{ settings, footerSettings, topAnnouncement, websiteConfig, theme, themeStyle, loading }}>
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
