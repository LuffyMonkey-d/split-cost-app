import { ExchangeRate } from '../types';

type Props = {
  isLoadingRates: boolean;
  error: string | null;
  fetchExchangeRates: () => void;
};

export const ExchangeRateManager = ({ 
  isLoadingRates,
  error,
  fetchExchangeRates 
}: Props) => {
  return (
    <div className="flex items-center gap-2">
      {isLoadingRates && (
        <span className="text-xs text-gray-500">為替レート更新中...</span>
      )}
      {error && (
        <span className="text-xs text-red-500">為替レート取得エラー</span>
      )}
      <button 
        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={fetchExchangeRates}
        disabled={isLoadingRates}
      >
        為替レート更新
      </button>
    </div>
  );
}; 