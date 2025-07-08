"use client"
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

type Member = { id: string; name: string };
type Payment = { id: string; payerId: string; amount: number; description: string };

export default function Home() {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberName, setMemberName] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payment, setPayment] = useState<{ payerId: string | ""; amount: string; description: string }>({ payerId: "", amount: "", description: "" });

  // 全角数字を半角に変換する関数
  const toHalfWidth = (str: string) => str.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));

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
    setPayments((prev) => [
      ...prev,
      { id: uuidv4(), payerId: payment.payerId as string, amount: Number(payment.amount), description: payment.description }
    ]);
    setPayment({ payerId: "", amount: "", description: "" });
  };

  // 支払い削除
  const deletePayment = (id: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== id));
  };

  // 支払い編集（編集フォームは保留、ロジックのみ）
  const editPayment = (id: string) => {
    alert("編集機能は今後実装予定です");
  };

  // 割り勘計算
  const calcSettlement = () => {
    if (members.length === 0) return [];
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const avg = total / members.length;
    // 各自の支払い合計
    const paidMap = Object.fromEntries(members.map((m) => [m.id, 0]));
    payments.forEach((p) => { paidMap[p.payerId] += p.amount; });
    // 各自の精算額
    return members.map((m) => ({ id: m.id, name: m.name, diff: Math.round((paidMap[m.id] - avg) * 100) / 100 }));
  };

  const settlement = calcSettlement();

  // 金額バリデーション
  const isAmountInvalid = payment.amount === "" || Number(payment.amount) <= 0;

  // 参加者削除
  const deleteMember = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
  };

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
        <h2 className="font-semibold mb-4 text-lg border-b pb-2">支払い記録</h2>
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
            return (
              <li key={p.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                <span className="flex-1">{payer} が {p.amount} 円 <span className="text-gray-500">({p.description})</span> を支払い</span>
                <button className="text-xs text-red-500 hover:underline" onClick={() => deletePayment(p.id)}>削除</button>
                <button className="text-xs text-blue-500 hover:underline" onClick={() => editPayment(p.id)}>編集</button>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 精算結果 */}
      <section className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h2 className="font-semibold mb-4 text-lg border-b pb-2">精算結果</h2>
        {/* バリデーションUI */}
        {members.length === 0 ? (
          <div className="text-red-500 text-sm mb-2">参加者を追加してください</div>
        ) : payments.length === 0 ? (
          <div className="text-yellow-600 text-sm mb-2">支払い記録がありません</div>
        ) : null}
        <ul className="divide-y divide-gray-200 bg-gray-50 rounded-lg border border-gray-200">
          {settlement.map((s) => (
            <li
              key={s.id}
              className={`text-sm px-3 py-2 flex items-center gap-2 ${s.diff > 0 ? "text-green-600" : s.diff < 0 ? "text-red-500" : "text-gray-500"}`}
            >
              <span className="flex-1 font-medium">{s.name}</span>
              <span>
                {s.diff > 0
                  ? `+${s.diff}円 受け取り`
                  : s.diff < 0
                  ? `${s.diff}円 支払い`
                  : "±0円"}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}