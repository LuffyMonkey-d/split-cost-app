import { Member, Payment, ExchangeRate, SUPPORTED_CURRENCIES } from '../types';

type SettlementItem = {
  id: string;
  name: string;
  diff: number;
};

type PaymentDetail = {
  amount: number;
  currency: string;
  jpyAmount: number;
  description: string;
};

type Props = {
  settlement: SettlementItem[];
  getPaymentDetails: (memberId: string) => PaymentDetail[];
  getCurrencyTotals: () => Record<string, { amount: number; jpyAmount: number }>;
  payments: Payment[];
  members: Member[];
  exchangeRates: ExchangeRate | null;
};

export const SettlementResult = ({ 
  settlement, 
  getPaymentDetails, 
  getCurrencyTotals, 
  payments, 
  members, 
  exchangeRates 
}: Props) => {
  return (
    <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="font-semibold text-lg">精算結果</h2>
        {exchangeRates && (
          <div className="text-xs text-gray-500">
            為替レート更新: {new Date(exchangeRates.timestamp).toLocaleString('ja-JP')}
          </div>
        )}
      </div>
      {/* バリデーションUI */}
      {members.length === 0 ? (
        <div className="text-red-500 text-sm mb-2">参加者を追加してください</div>
      ) : payments.length === 0 ? (
        <div className="text-yellow-600 text-sm mb-2">支払い記録がありません</div>
      ) : null}
      
      {/* 通貨別支払い合計 */}
      {payments.length > 0 && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-sm mb-3 text-blue-800">通貨別支払い合計</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(getCurrencyTotals()).map(([currency, total]) => {
              const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency);
              return (
                <div key={currency} className="flex justify-between items-center p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                  <span className="font-medium text-sm">
                    {currencyInfo?.symbol || currency} {currency}
                  </span>
                  <div className="text-right">
                    <div className="font-semibold text-sm">{total.amount.toFixed(2)}</div>
                    {currency !== 'JPY' && (
                      <div className="text-gray-500 text-xs">≈ ¥{total.jpyAmount.toFixed(2)}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <ul className="divide-y divide-gray-200 bg-gray-50 rounded-lg border border-gray-200">
        {settlement.map((settlementItem) => {
          const paymentDetails = getPaymentDetails(settlementItem.id);
          return (
            <li key={settlementItem.id} className="p-4">
              <div className={`text-sm flex flex-col sm:flex-row sm:items-center gap-2 mb-3 ${settlementItem.diff > 0 ? "text-green-600" : settlementItem.diff < 0 ? "text-red-500" : "text-gray-500"}`}>
                <span className="flex-1 font-medium">{settlementItem.name}</span>
                <span className="font-semibold">
                  {settlementItem.diff > 0
                    ? `+${settlementItem.diff}円 受け取り`
                    : settlementItem.diff < 0
                    ? `${settlementItem.diff}円 支払い`
                    : "±0円"}
                </span>
              </div>
              {/* 支払い詳細 */}
              {paymentDetails.length > 0 && (
                <div className="ml-2 sm:ml-4 text-xs text-gray-600">
                  <div className="font-medium mb-2">支払い内訳:</div>
                  <div className="space-y-1">
                    {paymentDetails.map((detail, index) => (
                      <div key={index} className="flex justify-between items-center py-1 px-2 bg-gray-100 rounded">
                        <span className="truncate">{detail.description}</span>
                        <span className="flex-shrink-0 ml-2">
                          {detail.amount} {detail.currency}
                          {detail.currency !== 'JPY' && (
                            <span className="text-gray-400 ml-1">(≈ ¥{detail.jpyAmount.toFixed(2)})</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}; 