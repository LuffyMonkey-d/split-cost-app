"use client"
import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";

type Member = { id: string; name: string };
type Payment = { 
  id: string; 
  payerId: string; 
  amount: number; 
  currency: string; // 通貨コード（USD, EUR, JPY等）
  description: string;
  exchangeRate?: number; // 支払い時の為替レート（JPY基準）
  originalAmount?: number; // 元の金額（為替レート適用前）
};

// 為替レート関連の型定義
type ExchangeRate = {
  base: string; // 基準通貨（USD）
  rates: Record<string, number>; // 各通貨のレート
  timestamp: number; // 取得時刻
  expiresAt: number; // 有効期限（1時間後）
};

// サポートする通貨の定義
const SUPPORTED_CURRENCIES = [
  { code: 'JPY', name: '日本円', symbol: '¥' },
  { code: 'USD', name: '米ドル', symbol: '$' },
  { code: 'EUR', name: 'ユーロ', symbol: '€' },
  { code: 'GBP', name: 'ポンド', symbol: '£' },
  { code: 'CNY', name: '人民元', symbol: '¥' },
  { code: 'KRW', name: '韓国ウォン', symbol: '₩' },
  { code: 'THB', name: 'タイバーツ', symbol: '฿' },
  { code: 'SGD', name: 'シンガポールドル', symbol: 'S$' },
] as const;

export default function Home() {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberName, setMemberName] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payment, setPayment] = useState<{ payerId: string | ""; amount: string; currency: string; description: string }>({ 
    payerId: "", 
    amount: "", 
    currency: "JPY", // デフォルトは日本円
    description: "" 
  });
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<{ payerId: string; amount: string; currency: string; description: string }>({ 
    payerId: "", 
    amount: "", 
    currency: "JPY",
    description: "" 
  });
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate | null>(null);
  const [isLoadingRates, setIsLoadingRates] = useState(false);

  // 全角数字を半角に変換する関数
  const toHalfWidth = (inputString: string) => inputString.replace(/[０-９]/g, fullWidthChar => String.fromCharCode(fullWidthChar.charCodeAt(0) - 0xFEE0));

  // 為替レート取得関数
  const fetchExchangeRates = async () => {
    // ローカルストレージから為替レートを確認
    const storedRates = localStorage.getItem('exchangeRates');
    if (storedRates) {
      const rates: ExchangeRate = JSON.parse(storedRates);
      // 1時間以内のデータなら使用
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
          timestamp: data.timestamp * 1000, // 秒からミリ秒に変換
          expiresAt: Date.now() + 60 * 60 * 1000 // 1時間後
        };
        
        console.log('為替レートを設定:', exchangeRate);
        setExchangeRates(exchangeRate);
        localStorage.setItem('exchangeRates', JSON.stringify(exchangeRate));
      } else {
        console.error('為替レート取得エラー:', data.error);
        // フォールバック: 固定レートを使用
        setExchangeRates({
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
      }
    } catch (error) {
      console.error('為替レート取得エラー:', error);
      // フォールバック: 固定レートを使用
      setExchangeRates({
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
    } finally {
      setIsLoadingRates(false);
    }
  };

  // 通貨を日本円に換算する関数
  const convertToJPY = (originalAmount: number, currencyCode: string): number => {
    if (currencyCode === 'JPY') return originalAmount;
    
    if (!exchangeRates) {
      console.log('為替レートが取得されていません');
      return originalAmount; // レートがない場合は元の金額を返す
    }
    
    let jpyConvertedAmount: number;
    
    if (currencyCode === 'USD') {
      // USDの場合は直接USDJPYレートを使用
      const usdToJpyRate = exchangeRates.rates['USDJPY'];
      if (usdToJpyRate) {
        jpyConvertedAmount = originalAmount * usdToJpyRate;
        console.log('USD換算結果:', { originalAmount, usdToJpyRate, jpyConvertedAmount });
        return Math.round(jpyConvertedAmount * 100) / 100; // 小数点以下2桁で四捨五入
      }
    } else {
      // その他の通貨は USD基準で換算
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
        // 通貨 → USD → JPY の順で換算
        const usdEquivalentAmount = originalAmount / usdToCurrencyRate;
        jpyConvertedAmount = usdEquivalentAmount * usdToJpyRate;
        console.log('換算結果:', { usdEquivalentAmount, jpyConvertedAmount });
        return Math.round(jpyConvertedAmount * 100) / 100; // 小数点以下2桁で四捨五入
      }
    }
    
    console.log('為替レートが見つかりません');
    return originalAmount; // 換算できない場合は元の金額を返す
  };

  // 参加者追加
  const addMember = () => {
    if (!memberName.trim()) return false;
    setMembers((prev) => [...prev, { id: uuidv4(), name: memberName.trim() }]);
    setMemberName("");
    return true;
  };

  // 支払い追加
  const addPayment = () => {
    if (payment.payerId === "" || !payment.amount || Number(payment.amount) <= 0) return;
    
    const originalAmount = Number(payment.amount);
    const jpyConvertedAmount = convertToJPY(originalAmount, payment.currency);
    
    setPayments((previousPayments) => [
      ...previousPayments,
      { 
        id: uuidv4(), 
        payerId: payment.payerId as string, 
        amount: jpyConvertedAmount, // 日本円換算額を保存
        currency: payment.currency,
        description: payment.description,
        originalAmount: originalAmount, // 元の金額を保存
        exchangeRate: jpyConvertedAmount / originalAmount // 為替レートを保存
      }
    ]);
    setPayment({ payerId: "", amount: "", currency: "JPY", description: "" });
  };

  // 支払い削除
  const deletePayment = (paymentId: string) => {
    setPayments((previousPayments) => previousPayments.filter((payment) => payment.id !== paymentId));
  };

  // 支払い編集（編集フォームは保留、ロジックのみ）
  const editPayment = (paymentId: string) => {
    const paymentToEdit = payments.find(payment => payment.id === paymentId);
    if (paymentToEdit) {
      setEditingPaymentId(paymentId);
      setEditingPayment({
        payerId: paymentToEdit.payerId,
        amount: paymentToEdit.amount.toString(),
        currency: paymentToEdit.currency,
        description: paymentToEdit.description
      });
    }
  };

  // 編集を保存
  const saveEdit = () => {
    if (!editingPaymentId || !editingPayment.amount || Number(editingPayment.amount) <= 0) return;
    
    const originalAmount = Number(editingPayment.amount);
    const jpyConvertedAmount = convertToJPY(originalAmount, editingPayment.currency);
    
    setPayments(previousPayments => previousPayments.map(payment => 
      payment.id === editingPaymentId 
        ? { 
            ...payment, 
            payerId: editingPayment.payerId, 
            amount: jpyConvertedAmount, // 日本円換算額を保存
            currency: editingPayment.currency,
            description: editingPayment.description,
            originalAmount: originalAmount, // 元の金額を保存
            exchangeRate: jpyConvertedAmount / originalAmount // 為替レートを保存
          }
        : payment
    ));
    
    setEditingPaymentId(null);
    setEditingPayment({ payerId: "", amount: "", currency: "JPY", description: "" });
  };

  // 編集をキャンセル
  const cancelEdit = () => {
    setEditingPaymentId(null);
    setEditingPayment({ payerId: "", amount: "", currency: "JPY", description: "" });
  };

  // 割り勘計算
  const calcSettlement = () => {
    if (members.length === 0) return [];
    
    // すべての支払いを日本円に換算して合計を計算
    const totalJPYAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const averageJPYAmount = totalJPYAmount / members.length;
    
    // 各自の支払い合計（日本円換算）
    const memberPaidAmounts = Object.fromEntries(members.map((member) => [member.id, 0]));
    payments.forEach((payment) => { 
      memberPaidAmounts[payment.payerId] += payment.amount; // payment.amountは既に日本円換算済み
    });
    
    // 各自の精算額
    return members.map((member) => ({ 
      id: member.id, 
      name: member.name, 
      diff: Math.round((memberPaidAmounts[member.id] - averageJPYAmount) * 100) / 100 
    }));
  };

  const settlement = calcSettlement();

  // 金額バリデーション
  const isAmountInvalid = payment.amount === "" || Number(payment.amount) <= 0;

  // 参加者削除
  const deleteMember = (memberId: string) => {
    setMembers((previousMembers) => previousMembers.filter((member) => member.id !== memberId));
  };

  // 支払い詳細を取得する関数
  const getPaymentDetails = (memberId: string) => {
    return payments
      .filter(payment => payment.payerId === memberId)
      .map(payment => ({
        amount: payment.originalAmount || payment.amount,
        currency: payment.currency,
        jpyAmount: payment.amount,
        description: payment.description
      }));
  };

  // 通貨別の支払い合計を取得する関数
  const getCurrencyTotals = () => {
    const currencyTotals: Record<string, { amount: number; jpyAmount: number }> = {};
    
    payments.forEach(payment => {
      const currencyCode = payment.currency;
      if (!currencyTotals[currencyCode]) {
        currencyTotals[currencyCode] = { amount: 0, jpyAmount: 0 };
      }
      currencyTotals[currencyCode].amount += payment.originalAmount || payment.amount;
      currencyTotals[currencyCode].jpyAmount += payment.amount || 0;
    });
    
    return currencyTotals;
  };

  useEffect(() => {
    fetchExchangeRates();
  }, []);

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center tracking-wide">旅行費用割り勘アプリ</h1>

      {/* 参加者追加 */}
      <section className="mb-8 bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="font-semibold mb-4 text-lg border-b pb-2">参加者</h2>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            addMember();
          }}
          className="flex flex-col sm:flex-row gap-2 mb-4 items-end"
        >
          <div className="flex-1 flex items-center gap-2">
            <label className="hidden sm:block text-sm font-medium w-14" htmlFor="memberName">名前</label>
            <input
              id="memberName"
              name="memberName"
              type="text"
              className="border rounded px-3 h-10 w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="名前を入力"
              required
            />
          </div>
          <button 
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 h-10 font-semibold transition"
          >
            追加
          </button>
        </form>
        <ul className="flex gap-2 flex-wrap">
          {members.map((member) => (
            <li key={member.id} className="bg-gray-100 rounded px-3 py-1 text-sm border border-gray-300 flex items-center gap-1">
              {member.name}
              <button className="ml-1 text-red-500 hover:text-red-700 text-xs" onClick={() => deleteMember(member.id)} title="削除">×</button>
            </li>
          ))}
        </ul>
      </section>

      {/* 支払い追加 */}
      <section className="mb-8 bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="font-semibold text-lg">支払い記録</h2>
          <div className="flex items-center gap-2">
            {isLoadingRates && (
              <span className="text-xs text-gray-500">為替レート更新中...</span>
            )}
            <button 
              className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded transition"
              onClick={fetchExchangeRates}
              disabled={isLoadingRates}
            >
              為替レート更新
            </button>
          </div>
        </div>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            addPayment();
          }}
          className="flex flex-col sm:flex-row gap-2 mb-4"
        >
          <div className="flex-1 flex flex-col justify-end">
            <label className="block text-sm font-medium mb-1" htmlFor="payer">支払者</label>
            <select
              id="payer"
              name="payer"
              className="border rounded h-12 w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={payment.payerId}
              onChange={(e) => {
                const val = e.target.value;
                setPayment((p) => ({ ...p, payerId: val === "" ? "" : val }));
              }}
              required
            >
              <option value="">支払者を選択</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.name}</option>
              ))}
            </select>
            <div className="min-h-[14px]"></div>
          </div>
          <div className="flex-1 flex flex-col justify-end relative">
            <label className="block text-sm font-medium mb-1" htmlFor="amount">金額</label>
            <input
              id="amount"
              name="amount"
              type="number"
              min="1"
              step="0.01"
              className={`border rounded h-12 w-full focus:outline-none focus:ring-2 focus:ring-blue-300 ${isAmountInvalid ? "border-red-500" : ""}`}
              value={payment.amount}
              onChange={(e) => {
                // 全角数字を半角に変換
                const half = toHalfWidth(e.target.value);
                setPayment((p) => ({ ...p, amount: half }));
              }}
              placeholder="金額"
              required
            />
            {/* バリデーション文をabsoluteでinput下に重ねて表示 */}
            {isAmountInvalid && (
              <span className="absolute left-0 top-full text-[10px] leading-none text-red-500">金額は1円以上を入力してください</span>
            )}
            <div className="min-h-[14px]"></div>
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <label className="block text-sm font-medium mb-1" htmlFor="currency">通貨</label>
            <select
              id="currency"
              name="currency"
              className="border rounded h-12 w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={payment.currency}
              onChange={(e) => setPayment((p) => ({ ...p, currency: e.target.value }))}
              required
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name} ({currency.code})
                </option>
              ))}
            </select>
            <div className="min-h-[14px]"></div>
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <label className="block text-sm font-medium mb-1" htmlFor="desc">用途</label>
            <input
              id="desc"
              name="description"
              type="text"
              className="border rounded h-12 w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={payment.description}
              onChange={(e) => setPayment((p) => ({ ...p, description: e.target.value }))}
              placeholder="用途 (例: ホテル)"
              required
            />
            <div className="min-h-[14px]"></div>
          </div>
          <div className="flex flex-col justify-end items-end">
            <button 
              type="submit"
              className="bg-green-500 hover:bg-green-600 text-white rounded px-6 h-12 min-w-[100px] font-semibold transition self-end" 
              style={{ width: "auto" }}
            >
              追加
            </button>
            <div className="min-h-[14px]"></div>
          </div>
        </form>
        <ul className="divide-y divide-gray-200 bg-gray-50 rounded-lg border border-gray-200">
          {payments.map((payment) => {
            const payer = members.find((member) => member.id === payment.payerId)?.name || "";
            const isEditing = editingPaymentId === payment.id;
            
            if (isEditing) {
              return (
                <li key={payment.id} className="px-3 py-3 bg-blue-50 border-l-4 border-blue-400">
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveEdit();
                    }}
                  >
                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-gray-600">支払者</label>
                        <select
                          name="payer"
                          className="border rounded h-8 w-full text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                          value={editingPayment.payerId}
                          onChange={(e) => setEditingPayment(prev => ({ ...prev, payerId: e.target.value }))}
                          required
                        >
                          {members.map((member) => (
                            <option key={member.id} value={member.id}>{member.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-gray-600">金額</label>
                        <input
                          name="amount"
                          type="number"
                          min="1"
                          step="0.01"
                          className="border rounded h-8 w-full text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                          value={editingPayment.amount}
                          onChange={(e) => {
                            const half = toHalfWidth(e.target.value);
                            setEditingPayment(prev => ({ ...prev, amount: half }));
                          }}
                          placeholder="金額"
                          required
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-gray-600">通貨</label>
                        <select
                          name="currency"
                          className="border rounded h-8 w-full text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                          value={editingPayment.currency}
                          onChange={(e) => setEditingPayment(prev => ({ ...prev, currency: e.target.value }))}
                          required
                        >
                          {SUPPORTED_CURRENCIES.map((currency) => (
                            <option key={currency.code} value={currency.code}>
                              {currency.symbol} {currency.code}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium mb-1 text-gray-600">用途</label>
                        <input
                          name="description"
                          type="text"
                          className="border rounded h-8 w-full text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                          value={editingPayment.description}
                          onChange={(e) => setEditingPayment(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="用途"
                          required
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <button 
                        type="submit"
                        className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition"
                      >
                        保存
                      </button>
                      <button 
                        type="button"
                        className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded transition"
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
              <li key={payment.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="flex-1">
                  {payer} が {payment.originalAmount || payment.amount} {payment.currency} 
                  {payment.currency !== 'JPY' && payment.exchangeRate && (
                    <span className="text-gray-500"> (≈ ¥{payment.amount.toFixed(2)})</span>
                  )}
                  <span className="text-gray-500"> ({payment.description})</span>
                </span>
                <button className="text-xs text-red-500 hover:underline" onClick={() => deletePayment(payment.id)}>削除</button>
                <button className="text-xs text-blue-500 hover:underline" onClick={() => editPayment(payment.id)}>編集</button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 精算結果 */}
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
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-medium text-sm mb-2 text-blue-800">通貨別支払い合計</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {Object.entries(getCurrencyTotals()).map(([currency, total]) => {
                const currencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === currency);
                return (
                  <div key={currency} className="flex justify-between items-center p-2 bg-white rounded border">
                    <span className="font-medium">
                      {currencyInfo?.symbol || currency} {currency}
                    </span>
                    <span className="text-right">
                      <div>{total.amount.toFixed(2)}</div>
                      {currency !== 'JPY' && (
                        <div className="text-gray-500 text-xs">≈ ¥{total.jpyAmount.toFixed(2)}</div>
                      )}
                    </span>
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
              <li key={settlementItem.id} className="p-3">
                <div className={`text-sm flex items-center gap-2 mb-2 ${settlementItem.diff > 0 ? "text-green-600" : settlementItem.diff < 0 ? "text-red-500" : "text-gray-500"}`}>
                  <span className="flex-1 font-medium">{settlementItem.name}</span>
                  <span>
                    {settlementItem.diff > 0
                      ? `+${settlementItem.diff}円 受け取り`
                      : settlementItem.diff < 0
                      ? `${settlementItem.diff}円 支払い`
                      : "±0円"}
                  </span>
                </div>
                {/* 支払い詳細 */}
                {paymentDetails.length > 0 && (
                  <div className="ml-4 text-xs text-gray-600">
                    <div className="font-medium mb-1">支払い内訳:</div>
                    {paymentDetails.map((detail, index) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <span>{detail.description}</span>
                        <span>
                          {detail.amount} {detail.currency}
                          {detail.currency !== 'JPY' && (
                            <span className="text-gray-400 ml-1">(≈ ¥{detail.jpyAmount.toFixed(2)})</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}