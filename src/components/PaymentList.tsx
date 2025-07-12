import { Member, Payment, PaymentFormData, SUPPORTED_CURRENCIES } from '../types';

type Props = {
  payments: Payment[];
  members: Member[];
  editingPaymentId: string | null;
  editingPayment: PaymentFormData;
  setEditingPayment: (payment: PaymentFormData) => void;
  deletePayment: (id: string) => void;
  editPayment: (id: string) => void;
  saveEdit: () => void;
  cancelEdit: () => void;
};

export const PaymentList = ({ 
  payments, 
  members, 
  editingPaymentId, 
  editingPayment, 
  setEditingPayment, 
  deletePayment, 
  editPayment, 
  saveEdit, 
  cancelEdit 
}: Props) => {
  return (
    <ul className="divide-y divide-gray-200 bg-gray-50 rounded-lg border border-gray-200">
      {payments.map((payment) => {
        const payer = members.find((member) => member.id === payment.payerId)?.name || "";
        const isEditing = editingPaymentId === payment.id;
        
        if (isEditing) {
          return (
            <li key={payment.id} className="px-4 py-4 bg-blue-50 border-l-4 border-blue-400">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  saveEdit();
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                  <div className="flex flex-col">
                    <label className="block text-xs font-medium mb-1 text-gray-600">支払者</label>
                    <select
                      name="payer"
                      className="border rounded h-10 w-full px-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300"
                      value={editingPayment.payerId}
                      onChange={(e) => setEditingPayment({ ...editingPayment, payerId: e.target.value })}
                      required
                    >
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>{member.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-xs font-medium mb-1 text-gray-600">金額</label>
                    <input
                      name="amount"
                      type="number"
                      min="1"
                      step="0.01"
                      className="border rounded h-10 w-full px-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300"
                      value={editingPayment.amount}
                      onChange={(e) => {
                        setEditingPayment({ ...editingPayment, amount: e.target.value });
                      }}
                      placeholder="金額"
                      required
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-xs font-medium mb-1 text-gray-600">通貨</label>
                    <select
                      name="currency"
                      className="border rounded h-10 w-full px-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300"
                      value={editingPayment.currency}
                      onChange={(e) => setEditingPayment({ ...editingPayment, currency: e.target.value })}
                      required
                    >
                      {SUPPORTED_CURRENCIES.map((currency) => (
                        <option key={currency.code} value={currency.code}>
                          {currency.symbol} {currency.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col">
                    <label className="block text-xs font-medium mb-1 text-gray-600">用途</label>
                    <input
                      name="description"
                      type="text"
                      className="border rounded h-10 w-full px-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-300"
                      value={editingPayment.description}
                      onChange={(e) => setEditingPayment({ ...editingPayment, description: e.target.value })}
                      placeholder="用途"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button 
                    type="submit"
                    className="text-sm bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded transition shadow-sm"
                  >
                    保存
                  </button>
                  <button 
                    type="button"
                    className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
                    onClick={cancelEdit}
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </li>
          );
        }
        
        return (
          <li key={payment.id} className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-3 text-sm">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1">
                <span className="font-medium text-gray-900">{payer}</span>
                <span className="text-gray-600">が</span>
                <span className="font-semibold text-gray-900">
                  {payment.originalAmount || payment.amount} {payment.currency}
                </span>
                {payment.currency !== 'JPY' && payment.exchangeRate && (
                  <span className="text-gray-500 text-xs">(≈ ¥{payment.amount.toFixed(2)})</span>
                )}
              </div>
              {payment.description && (
                <div className="mt-1">
                  <span className="text-gray-500 text-xs">用途: {payment.description}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button 
                className="text-xs text-red-500 hover:text-red-700 hover:underline px-2 py-1 rounded transition" 
                onClick={() => deletePayment(payment.id)}
              >
                削除
              </button>
              <button 
                className="text-xs text-amber-600 hover:text-amber-700 hover:underline px-2 py-1 rounded transition" 
                onClick={() => editPayment(payment.id)}
              >
                編集
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}; 