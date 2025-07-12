import { ExchangeRate } from '../types';

type Props = {
  exchangeRates: ExchangeRate | null;
  isLoadingRates: boolean;
  fetchExchangeRates: () => void;
};

export const ExchangeRateManager = ({ 
  exchangeRates, 
  isLoadingRates, 
  fetchExchangeRates 
}: Props) => {
  return (
    <div className="flex items-center gap-2">
      {isLoadingRates && (
        <span className="text-xs text-gray-500">為替レート更新中...</span>
      )}
      <button 
        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded transition shadow-sm"
        onClick={fetchExchangeRates}
        disabled={isLoadingRates}
      >
        為替レート更新
      </button>
    </div>
  );
}; 