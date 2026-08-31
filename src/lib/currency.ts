export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rateToUSD: number; // 1 USD = rate units of foreign currency
}

export const SUPPORTED_CURRENCIES: Record<string, Currency> = {
  LKR: { code: 'LKR', name: 'Sri Lankan Rupee', symbol: 'Rs.', rateToUSD: 300.0 },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', rateToUSD: 1.0 },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', rateToUSD: 0.92 },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', rateToUSD: 0.79 },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rateToUSD: 154.5 },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', rateToUSD: 1.38 },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rateToUSD: 1.55 },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', rateToUSD: 86.8 },
};

let cachedRates: Record<string, number> = {
  LKR: 300.0,
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 154.5,
  CAD: 1.38,
  AUD: 1.55,
  INR: 86.8,
};

let lastFetched = 0;

/**
 * Fetch live exchange rates or fallback to cached offline rates
 */
export async function fetchLiveExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now();
  // Cache for 10 minutes
  if (now - lastFetched < 10 * 60 * 1000 && Object.keys(cachedRates).length > 1) {
    return cachedRates;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (res.ok) {
      const data = await res.json();
      if (data && data.rates) {
        cachedRates = {
          ...cachedRates,
          ...data.rates,
        };
        lastFetched = now;
      }
    }
  } catch (err) {
    console.warn('Currency API fetch failed, using reliable fallback rates:', err);
  }

  return cachedRates;
}

/**
 * Converts an amount from source currency to target group currency in integer CENTS.
 * @param amountInSourceUnits Amount in source decimal currency (e.g. 50.00 EUR)
 * @param fromCurrency Source currency code
 * @param toCurrency Target currency code
 * @returns Amount in CENTS of the target currency
 */
export function convertCurrencyToCents(
  amountInSourceUnits: number,
  fromCurrency: string,
  toCurrency: string
): { cents: number; exchangeRate: number } {
  if (fromCurrency === toCurrency) {
    return {
      cents: Math.round(amountInSourceUnits * 100),
      exchangeRate: 1.0,
    };
  }

  const fromRate = cachedRates[fromCurrency] || 1.0;
  const toRate = cachedRates[toCurrency] || 1.0;

  // Rate from source to target = toRate / fromRate
  const exchangeRate = toRate / fromRate;
  const convertedUnits = amountInSourceUnits * exchangeRate;
  const cents = Math.round(convertedUnits * 100);

  return { cents, exchangeRate };
}
