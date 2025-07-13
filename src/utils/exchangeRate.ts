import { ExchangeRate } from '../types';

export const convertToJPY = (originalAmount: number, currencyCode: string, exchangeRates: ExchangeRate | null): number => {
  if (currencyCode === 'JPY') return originalAmount;
  
  if (!exchangeRates) {
    return originalAmount;
  }
  
  if (currencyCode === 'USD') {
    const usdToJpyRate = exchangeRates.rates['USDJPY'];
    if (usdToJpyRate) {
      const jpyConvertedAmount = originalAmount * usdToJpyRate;
      return Math.round(jpyConvertedAmount * 100) / 100;
    }
  } else {
    const usdToCurrencyRate = exchangeRates.rates[`USD${currencyCode}`];
    const usdToJpyRate = exchangeRates.rates['USDJPY'];
    
    if (usdToCurrencyRate && usdToJpyRate) {
      const usdEquivalentAmount = originalAmount / usdToCurrencyRate;
      const jpyConvertedAmount = usdEquivalentAmount * usdToJpyRate;
      return Math.round(jpyConvertedAmount * 100) / 100;
    }
  }
  
  return originalAmount;
};

export const getFallbackExchangeRates = (): ExchangeRate => ({
  base: 'USD',
  rates: {
    'USDJPY': 146.55,
    'EURJPY': 171.50,
    'GBPJPY': 198.00,
    'CNYJPY': 20.50,
    'KRWJPY': 0.11,
    'THBJPY': 4.20,
    'SGDJPY': 108.80
  },
  timestamp: Date.now(),
  expiresAt: Date.now() + 60 * 60 * 1000
}); 