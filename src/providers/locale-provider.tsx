'use client';

import { createContext, useContext, useEffect } from 'react';

import { localeCurrency } from '@/lib/format';

const LocaleContext = createContext<{ locale: string; currency: string }>({
  locale: 'en',
  currency: 'USD',
});

export function LocaleProvider({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, currency: localeCurrency(locale) }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
