import { useState, useEffect } from 'react';
import { ExchangeRate } from '../types';
import { getFallbackExchangeRates } from '../utils/exchangeRate';

export const useExchangeRates = () => {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  const fetchExchangeRates = async () => {
    const storedRates = localStorage.getItem('exchangeRates');
    if (storedRates) {
      const rates: ExchangeRate = JSON.parse(storedRates);
      if (rates.expiresAt > Date.now()) {
        console.log('ローカルストレージから為替レートを取得:', rates);
        setExchangeRates(rates);
        return;
      }
    }

    setIsLoadingRates(true);
    try {
      console.log('為替レートAPIを呼び出し中...');
      const apiKey = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;
      if (!apiKey) {
        console.error('APIキーが設定されていません');
        throw new Error('APIキーが設定されていません');
      }
      
      const response = await fetch(
        `https://api.exchangerate.host/live?access_key=${apiKey}&base=USD`
      );
      const data = await response.json();
      console.log('APIレスポンス:', data);
      
      if (data.success) {
        const exchangeRate: ExchangeRate = {
          base: data.source,
          rates: data.quotes,
          timestamp: data.timestamp * 1000,
          expiresAt: Date.now() + 60 * 60 * 1000
        };
        
        console.log('為替レートを設定:', exchangeRate);
        setExchangeRates(exchangeRate);
        localStorage.setItem('exchangeRates', JSON.stringify(exchangeRate));
      } else {
        console.error('為替レート取得エラー:', data.error);
        setExchangeRates(getFallbackExchangeRates());
      }
    } catch (error) {
      console.error('為替レート取得エラー:', error);
      setExchangeRates(getFallbackExchangeRates());
    } finally {
      setIsLoadingRates(false);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  return { exchangeRates, isLoadingRates, fetchExchangeRates };
}; 