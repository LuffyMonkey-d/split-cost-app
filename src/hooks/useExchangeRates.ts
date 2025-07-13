import { useState, useEffect } from 'react';
import { ExchangeRate } from '../types';
import { getFallbackExchangeRates } from '../utils/exchangeRate';

export const useExchangeRates = () => {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExchangeRates = async () => {
    // ローカルストレージからの取得を試行
    try {
      const storedRates = localStorage.getItem('exchangeRates');
      if (storedRates) {
        const rates: ExchangeRate = JSON.parse(storedRates);
        if (rates.expiresAt > Date.now()) {
          setExchangeRates(rates);
          setError(null);
          return;
        }
      }
    } catch (error) {
      // ローカルストレージの読み取りエラーは無視
    }

    setIsLoadingRates(true);
    setError(null);
    
    try {
      const apiKey = process.env.NEXT_PUBLIC_EXCHANGE_RATE_API_KEY;
      if (!apiKey) {
        throw new Error('APIキーが設定されていません');
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
      
      const response = await fetch(
        `https://api.exchangerate.host/live?access_key=${apiKey}&base=USD`,
        { signal: controller.signal }
      );
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const exchangeRate: ExchangeRate = {
          base: data.source,
          rates: data.quotes,
          timestamp: data.timestamp * 1000,
          expiresAt: Date.now() + 60 * 60 * 1000
        };
        
        setExchangeRates(exchangeRate);
        setError(null);
        
        // ローカルストレージへの保存を試行
        try {
          localStorage.setItem('exchangeRates', JSON.stringify(exchangeRate));
        } catch (error) {
          // ローカルストレージの書き込みエラーは無視
        }
      } else {
        throw new Error(data.error?.info || '為替レート取得に失敗しました');
      }
    } catch (error) {
      const fallbackRates = getFallbackExchangeRates();
      setExchangeRates(fallbackRates);
      setError(error instanceof Error ? error.message : '為替レート取得に失敗しました');
    } finally {
      setIsLoadingRates(false);
    }
  };

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  return { exchangeRates, isLoadingRates, error, fetchExchangeRates };
}; 