/* eslint-disable react/prop-types */
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { currenciesAPI } from '../api/services';
import { useStoreSettings } from './StoreSettingsContext';
import { setActiveCurrency, DEFAULT_CURRENCY } from '../utils/currency';

const STORAGE_KEY = 'neirah_selected_currency';

const defaultContextValue = {
  currencies: [],
  selectedCurrency: DEFAULT_CURRENCY,
  selectCurrency: () => {},
  showOnStorefront: true,
  loading: false,
};

const CurrencyContext = createContext(defaultContextValue);

function normalizeCurrency(doc) {
  if (!doc) return null;
  const code = String(doc.currencyInfo?.code || doc.code || '').trim().toUpperCase();
  if (!code) return null;
  const isBase = Boolean(doc.settings?.isBaseCurrency ?? doc.isBaseCurrency);
  const rawInrRate = Number(doc.exchangeRate?.inrRate);
  const rawRate = Number(doc.exchangeRate?.rate);
  const effectiveRate = isBase
    ? 1
    : Number.isFinite(rawRate) && rawRate > 0
      ? rawRate
      : Number.isFinite(rawInrRate) && rawInrRate > 0
        ? 1 / rawInrRate
        : 1;

  return {
    _id: doc._id,
    code,
    name: doc.currencyInfo?.name || doc.name || code,
    symbol: doc.currencyInfo?.symbol || doc.symbol || code,
    countryCode: doc.currencyInfo?.countryCode || doc.countryCode || '',
    rate: effectiveRate,
    inrRate: Number.isFinite(rawInrRate) && rawInrRate > 0 ? rawInrRate : 1,
    isBaseCurrency: isBase,
    raw: doc,
  };
}

export function CurrencyProvider({ children }) {
  const { settings, loading: settingsLoading } = useStoreSettings();
  const hasExplicitSetting = typeof settings?.currency?.showOnStorefront === 'boolean';
  const shouldLoadCurrencies = settings?.currency?.showOnStorefront !== false;
  const showOnStorefront = hasExplicitSetting
    ? settings.currency.showOnStorefront
    : !settingsLoading;
  const [currencies, setCurrencies] = useState([]);
  const [hasFetchedCurrencies, setHasFetchedCurrencies] = useState(false);
  const [selectedCode, setSelectedCode] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shouldLoadCurrencies || hasFetchedCurrencies) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    currenciesAPI
      .getLookup()
      .then((res) => {
        if (!active) return;
        const rawList = Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res?.data?.items)
            ? res.data.items
            : [];
        const normalized = rawList.map(normalizeCurrency).filter(Boolean);
        setCurrencies(normalized);
        setHasFetchedCurrencies(true);
      })
      .catch(() => {
        if (active) setCurrencies([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [shouldLoadCurrencies, hasFetchedCurrencies]);

  const baseCurrency = useMemo(
    () =>
      currencies.find((c) => c.isBaseCurrency) ||
      currencies.find((c) => c.code === 'INR') ||
      DEFAULT_CURRENCY,
    [currencies]
  );

  const selectedCurrency = useMemo(() => {
    if (!showOnStorefront) return baseCurrency;
    if (!currencies.length) return DEFAULT_CURRENCY;
    const savedMatch = selectedCode
      ? currencies.find((c) => c.code === selectedCode.toUpperCase())
      : null;
    if (savedMatch) return savedMatch;
    return baseCurrency || currencies[0];
  }, [showOnStorefront, currencies, selectedCode, baseCurrency]);

  useEffect(() => {
    setActiveCurrency(selectedCurrency);
  }, [selectedCurrency]);

  const selectCurrency = useCallback((currencyOrCode) => {
    const code =
      typeof currencyOrCode === 'string'
        ? currencyOrCode.trim().toUpperCase()
        : String(currencyOrCode?.code || currencyOrCode?.currencyInfo?.code || '').trim().toUpperCase();
    if (!code) return;
    setSelectedCode(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore storage errors */
    }
  }, []);

  const value = useMemo(
    () => ({
      currencies,
      selectedCurrency,
      selectCurrency,
      showOnStorefront,
      loading,
    }),
    [currencies, selectedCurrency, selectCurrency, showOnStorefront, loading]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
