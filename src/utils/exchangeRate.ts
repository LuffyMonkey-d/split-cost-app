import { ExchangeRate } from '../types';

export const convertToJPY = (originalAmount: number, currencyCode: string, exchangeRates: ExchangeRate | null): number => {
  if (currencyCode === 'JPY') return originalAmount;
  
  if (!exchangeRates) {
    console.log('為替レートが取得されていません');
    return originalAmount;
  }
  
  if (currencyCode === 'USD') {
    const usdToJpyRate = exchangeRates.rates['USDJPY'];
    if (usdToJpyRate) {
      const jpyConvertedAmount = originalAmount * usdToJpyRate;
      console.log('USD換算結果:', { originalAmount, usdToJpyRate, jpyConvertedAmount });
      return Math.round(jpyConvertedAmount * 100) / 100;
    }
  } else {
    const usdToCurrencyRate = exchangeRates.rates[`USD${currencyCode}`];
    const usdToJpyRate = exchangeRates.rates['USDJPY'];
    
    console.log('為替レート情報:', {
      currencyCode,
      originalAmount,
      usdToCurrencyRate,
      usdToJpyRate,
      availableRates: Object.keys(exchangeRates.rates).filter(rateKey => rateKey.startsWith('USD'))
    });
    
    if (usdToCurrencyRate && usdToJpyRate) {
      const usdEquivalentAmount = originalAmount / usdToCurrencyRate;
      const jpyConvertedAmount = usdEquivalentAmount * usdToJpyRate;
      console.log('換算結果:', { usdEquivalentAmount, jpyConvertedAmount });
      return Math.round(jpyConvertedAmount * 100) / 100;
    }
  }
  
  console.log('為替レートが見つかりません');
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