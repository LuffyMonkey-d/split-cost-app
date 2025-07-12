import { Member, PaymentFormData, SUPPORTED_CURRENCIES } from '../types';

type Props = {
  payment: PaymentFormData;
  setPayment: (payment: PaymentFormData) => void;
  members: Member[];
  addPayment: () => void;
  isAmountInvalid: boolean;
};

export const PaymentForm = ({ 
  payment, 
  setPayment, 
  members, 
  addPayment, 
  isAmountInvalid 
}: Props) => {
  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        addPayment();
      }}
      className="space-y-4 mb-4"
    >
      {/* 1行目: 支払者と金額 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="block text-sm font-medium mb-1" htmlFor="payer">支払者</label>
          <select
            id="payer"
            name="payer"
            className="border rounded h-12 w-full px-4 focus:outline-none focus:ring-2 focus:ring-amber-300"
            value={payment.payerId}
            onChange={(e) => {
              const val = e.target.value;
              setPayment({ ...payment, payerId: val === "" ? "" : val });
            }}
            required
          >
            <option value="">支払者を選択</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="block text-sm font-medium mb-1" htmlFor="amount">金額</label>
          <input
            id="amount"
            name="amount"
            type="number"
            min="1"
            step="0.01"
            className={`border rounded h-12 w-full px-4 focus:outline-none focus:ring-2 focus:ring-amber-300 ${isAmountInvalid ? "border-red-500" : ""}`}
            value={payment.amount}
            onChange={(e) => {
              setPayment({ ...payment, amount: e.target.value });
            }}
            placeholder="金額"
            required
          />
          {/* バリデーション文用の専用スペース */}
          <div className="min-h-[20px] flex items-center">
            {isAmountInvalid && (
              <span className="text-xs text-red-500 leading-tight">金額は1円以上を入力してください</span>
            )}
          </div>
        </div>
      </div>
      
      {/* 2行目: 通貨と用途 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col">
          <label className="block text-sm font-medium mb-1" htmlFor="currency">通貨</label>
          <select
            id="currency"
            name="currency"
            className="border rounded h-12 w-full px-4 focus:outline-none focus:ring-2 focus:ring-amber-300"
            value={payment.currency}
            onChange={(e) => setPayment({ ...payment, currency: e.target.value })}
            required
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.symbol} {currency.name} ({currency.code})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="block text-sm font-medium mb-1" htmlFor="desc">用途</label>
          <input
            id="desc"
            name="description"
            type="text"
            className="border rounded h-12 w-full px-4 focus:outline-none focus:ring-2 focus:ring-amber-300"
            value={payment.description}
            onChange={(e) => setPayment({ ...payment, description: e.target.value })}
            placeholder="用途 (例: ホテル)"
            required
          />
        </div>
      </div>
      
      {/* 3行目: 追加ボタン */}
      <div className="flex justify-end">
        <button 
          type="submit"
          className="bg-amber-500 hover:bg-amber-600 text-white rounded px-8 h-12 min-w-[120px] font-semibold transition shadow-md" 
        >
          追加
        </button>
      </div>
    </form>
  );
}; 