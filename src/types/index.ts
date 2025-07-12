export type Member = { id: string; name: string };

export type Payment = { 
  id: string; 
  payerId: string; 
  amount: number; 
  currency: string;
  description: string;
  exchangeRate?: number;
  originalAmount?: number;
};

export type ExchangeRate = {
  base: string;
  rates: Record<string, number>;
  timestamp: number;
  expiresAt: number;
};

export type PaymentFormData = {
  payerId: string | "";
  amount: string;
  currency: string;
  description: string;
};

export const SUPPORTED_CURRENCIES = [
  { code: 'JPY', name: '日本円', symbol: '¥' },
  { code: 'USD', name: '米ドル', symbol: '$' },
  { code: 'EUR', name: 'ユーロ', symbol: '€' },
  { code: 'GBP', name: 'ポンド', symbol: '£' },
  { code: 'CNY', name: '人民元', symbol: '¥' },
  { code: 'KRW', name: '韓国ウォン', symbol: '₩' },
  { code: 'THB', name: 'タイバーツ', symbol: '฿' },
  { code: 'SGD', name: 'シンガポールドル', symbol: 'S$' },
] as const; 