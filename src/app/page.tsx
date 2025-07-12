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
  const toHalfWidth = (str: string) => str.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));

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
  const convertToJPY = (amount: number, currency: string): number => {
    if (currency === 'JPY') return amount;
    
    if (!exchangeRates) {
      console.log('為替レートが取得されていません');
      return amount; // レートがない場合は元の金額を返す
    }
    
    let jpyAmount: number;
    
    if (currency === 'USD') {
      // USDの場合は直接USDJPYレートを使用
      const usdJpyRate = exchangeRates.rates['USDJPY'];
      if (usdJpyRate) {
        jpyAmount = amount * usdJpyRate;
        console.log('USD換算結果:', { amount, usdJpyRate, jpyAmount });
        return Math.round(jpyAmount * 100) / 100; // 小数点以下2桁で四捨五入
      }
    } else {
      // その他の通貨は USD基準で換算
      const usdRate = exchangeRates.rates[`USD${currency}`];
      const jpyRate = exchangeRates.rates['USDJPY'];
      
      console.log('為替レート情報:', {
        currency,
        amount,
        usdRate,
        jpyRate,
        availableRates: Object.keys(exchangeRates.rates).filter(key => key.startsWith('USD'))
      });
      
      if (usdRate && jpyRate) {
        // 通貨 → USD → JPY の順で換算
        const usdAmount = amount / usdRate;
        jpyAmount = usdAmount * jpyRate;
        console.log('換算結果:', { usdAmount, jpyAmount });
        return Math.round(jpyAmount * 100) / 100; // 小数点以下2桁で四捨五入
      }
    }
    
    console.log('為替レートが見つかりません');
    return amount; // 換算できない場合は元の金額を返す
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
    const jpyAmount = convertToJPY(originalAmount, payment.currency);
    
    setPayments((prev) => [
      ...prev,
      { 
        id: uuidv4(), 
        payerId: payment.payerId as string, 
        amount: jpyAmount, // 日本円換算額を保存
        currency: payment.currency,
        description: payment.description,
        originalAmount: originalAmount, // 元の金額を保存
        exchangeRate: jpyAmount / originalAmount // 為替レートを保存
      }
    ]);
    setPayment({ payerId: "", amount: "", currency: "JPY", description: "" });
  };

  // 支払い削除
  const deletePayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  // 支払い編集（編集フォームは保留、ロジックのみ）
  const editPayment = (id: string) => {
    const paymentToEdit = payments.find(p => p.id === id);
    if (paymentToEdit) {
      setEditingPaymentId(id);
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
    const jpyAmount = convertToJPY(originalAmount, editingPayment.currency);
    
    setPayments(prev => prev.map(p => 
      p.id === editingPaymentId 
        ? { 
            ...p, 
            payerId: editingPayment.payerId, 
            amount: jpyAmount, // 日本円換算額を保存
            currency: editingPayment.currency,
            description: editingPayment.description,
            originalAmount: originalAmount, // 元の金額を保存
            exchangeRate: jpyAmount / originalAmount // 為替レートを保存
          }
        : p
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
    const totalJPY = payments.reduce((sum, p) => sum + p.amount, 0);
    const avgJPY = totalJPY / members.length;
    
    // 各自の支払い合計（日本円換算）
    const paidMap = Object.fromEntries(members.map((m) => [m.id, 0]));
    payments.forEach((p) => { 
      paidMap[p.payerId] += p.amount; // p.amountは既に日本円換算済み
    });
    
    // 各自の精算額
    return members.map((m) => ({ 
      id: m.id, 
      name: m.name, 
      diff: Math.round((paidMap[m.id] - avgJPY) * 100) / 100 
    }));
  };

  const settlement = calcSettlement();

  // 金額バリデーション
  const isAmountInvalid = payment.amount === "" || Number(payment.amount) <= 0;

  // 参加者削除
  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

  // 支払い詳細を取得する関数
  const getPaymentDetails = (memberId: string) => {
    return payments
      .filter(p => p.payerId === memberId)
      .map(p => ({
        amount: p.originalAmount || p.amount,
        currency: p.currency,
        jpyAmount: p.amount,
        description: p.description
      }));
  };

  // 通貨別の支払い合計を取得する関数
  const getCurrencyTotals = () => {
    const totals: Record<string, { amount: number; jpyAmount: number }> = {};
    
    payments.forEach(p => {
      const currency = p.currency;
      if (!totals[currency]) {
        totals[currency] = { amount: 0, jpyAmount: 0 };
      }
      totals[currency].amount += p.originalAmount || p.amount;
      totals[currency].jpyAmount += p.amount || 0;
    });
    
    return totals;
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
        <div className="flex flex-col sm:flex-row gap-2 mb-4 items-end">
          <div className="flex-1 flex items-center gap-2">
            <label className="hidden sm:block text-sm font-medium w-14" htmlFor="memberName">名前</label>
            <input
              id="memberName"
              className="border rounded px-3 h-10 w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={memberName}
              onChange={(e) => setMemberName(e.target.value)}
              placeholder="名前を入力"
              onKeyDown={(e) => {
                if ((e.nativeEvent as any).isComposing) return;
                if (e.key === "Enter") {
                  addMember();
                }
              }}
              onCompositionEnd={() => {
                if (memberName.trim()) {
                  addMember();
                }
              }}
            />
          </div>
          <button className="bg-blue-500 hover:bg-blue-600 text-white rounded px-4 h-10 font-semibold transition" onClick={addMember}>追加</button>
        </div>
        <ul className="flex gap-2 flex-wrap">
          {members.map((m) => (
            <li key={m.id} className="bg-gray-100 rounded px-3 py-1 text-sm border border-gray-300 flex items-center gap-1">
              {m.name}
              <button className="ml-1 text-red-500 hover:text-red-700 text-xs" onClick={() => deleteMember(m.id)} title="削除">×</button>
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
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex-1 flex flex-col justify-end">
            <label className="block text-sm font-medium mb-1" htmlFor="payer">支払者</label>
            <select
              id="payer"
              className="border rounded h-12 w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={payment.payerId}
              onChange={(e) => {
                const val = e.target.value;
                setPayment((p) => ({ ...p, payerId: val === "" ? "" : val }));
              }}
            >
              <option value="">支払者を選択</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            <div className="min-h-[14px]"></div>
          </div>
          <div className="flex-1 flex flex-col justify-end relative">
            <label className="block text-sm font-medium mb-1" htmlFor="amount">金額</label>
            <input
              id="amount"
              className={`border rounded h-12 w-full focus:outline-none focus:ring-2 focus:ring-blue-300 ${isAmountInvalid ? "border-red-500" : ""}`}
              type="text"
              min="0"
              value={payment.amount}
              onChange={(e) => {
                // 全角数字を半角に変換
                const half = toHalfWidth(e.target.value);
                setPayment((p) => ({ ...p, amount: half }));
              }}
              placeholder="金額"
              onKeyDown={(e) => {
                if ((e.nativeEvent as any).isComposing) return;
                if (e.key === "Enter") {
                  addPayment();
                }
              }}
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
              className="border rounded h-12 w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={payment.currency}
              onChange={(e) => setPayment((p) => ({ ...p, currency: e.target.value }))}
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
              className="border rounded h-12 w-full focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={payment.description}
              onChange={(e) => setPayment((p) => ({ ...p, description: e.target.value }))}
              placeholder="用途 (例: ホテル)"
              onKeyDown={(e) => {
                if ((e.nativeEvent as any).isComposing) return;
                if (e.key === "Enter") {
                  addPayment();
                }
              }}
            />
            <div className="min-h-[14px]"></div>
          </div>
          <div className="flex flex-col justify-end items-end">
            <button className="bg-green-500 hover:bg-green-600 text-white rounded px-6 h-12 min-w-[100px] font-semibold transition self-end" style={{ width: "auto" }} onClick={addPayment}>追加</button>
            <div className="min-h-[14px]"></div>
          </div>
        </div>
        <ul className="divide-y divide-gray-200 bg-gray-50 rounded-lg border border-gray-200">
          {payments.map((p) => {
            const payer = members.find((m) => m.id === p.payerId)?.name || "";
            const isEditing = editingPaymentId === p.id;
            
            if (isEditing) {
              return (
                <li key={p.id} className="px-3 py-3 bg-blue-50 border-l-4 border-blue-400">
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1 text-gray-600">支払者</label>
                      <select
                        className="border rounded h-8 w-full text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                        value={editingPayment.payerId}
                        onChange={(e) => setEditingPayment(prev => ({ ...prev, payerId: e.target.value }))}
                      >
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1 text-gray-600">金額</label>
                      <input
                        className="border rounded h-8 w-full text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                        type="text"
                        value={editingPayment.amount}
                        onChange={(e) => {
                          const half = toHalfWidth(e.target.value);
                          setEditingPayment(prev => ({ ...prev, amount: half }));
                        }}
                        placeholder="金額"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1 text-gray-600">通貨</label>
                      <select
                        className="border rounded h-8 w-full text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                        value={editingPayment.currency}
                        onChange={(e) => setEditingPayment(prev => ({ ...prev, currency: e.target.value }))}
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
                        className="border rounded h-8 w-full text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
                        value={editingPayment.description}
                        onChange={(e) => setEditingPayment(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="用途"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button 
                      className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition"
                      onClick={saveEdit}
                    >
                      保存
                    </button>
                    <button 
                      className="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded transition"
                      onClick={cancelEdit}
                    >
                      キャンセル
                    </button>
                  </div>
                </li>
              );
            }
            
            return (
              <li key={p.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="flex-1">
                  {payer} が {p.originalAmount || p.amount} {p.currency} 
                  {p.currency !== 'JPY' && p.exchangeRate && (
                    <span className="text-gray-500"> (≈ ¥{p.amount.toFixed(2)})</span>
                  )}
                  <span className="text-gray-500"> ({p.description})</span>
                </span>
                <button className="text-xs text-red-500 hover:underline" onClick={() => deletePayment(p.id)}>削除</button>
                <button className="text-xs text-blue-500 hover:underline" onClick={() => editPayment(p.id)}>編集</button>
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
          {settlement.map((s) => {
            const paymentDetails = getPaymentDetails(s.id);
            return (
              <li key={s.id} className="p-3">
                <div className={`text-sm flex items-center gap-2 mb-2 ${s.diff > 0 ? "text-green-600" : s.diff < 0 ? "text-red-500" : "text-gray-500"}`}>
                  <span className="flex-1 font-medium">{s.name}</span>
                  <span>
                    {s.diff > 0
                      ? `+${s.diff}円 受け取り`
                      : s.diff < 0
                      ? `${s.diff}円 支払い`
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