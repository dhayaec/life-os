const CURRENCY_BY_LOCALE: Record<string, string> = {
  en: 'USD',
  es: 'EUR',
  fr: 'EUR',
  de: 'EUR',
  hi: 'INR',
  pt: 'BRL',
  ja: 'JPY',
  zh: 'CNY',
};

export function localeCurrency(locale: string): string {
  return CURRENCY_BY_LOCALE[locale] ?? 'USD';
}

export function formatCurrency(value: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: localeCurrency(locale),
  }).format(value);
}
