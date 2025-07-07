"use client"
import { useState } from "react";

type Member = { id: number; name: string };
type Payment = { id: number; payerId: number; amount: number; description: string };

export default function Home() {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberName, setMemberName] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payment, setPayment] = useState<{ payerId: number | ""; amount: string; description: string }>({ payerId: "", amount: "", description: "" });

  // 参加者追加
  const addMember = () => {
    if (!memberName.trim()) return;
    setMembers((prev) => [...prev, { id: Date.now(), name: memberName.trim() }]);
    setMemberName("");
  };

  // 支払い追加
  const addPayment = () => {
    if (payment.payerId === "" || !payment.amount || Number(payment.amount) <= 0) return;
    setPayments((prev) => [
      ...prev,
      { id: Date.now(), payerId: Number(payment.payerId), amount: Number(payment.amount), description: payment.description }
    ]);
    setPayment({ payerId: "", amount: "", description: "" });
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
    return members.map((m) => ({ name: m.name, diff: Math.round((paidMap[m.id] - avg) * 100) / 100 }));
  };

  const settlement = calcSettlement();

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">旅行費用割り勘アプリ</h1>

      {/* 参加者追加 */}
      <section className="mb-8">
        <h2 className="font-semibold mb-2">参加者</h2>
        <div className="flex gap-2 mb-2">
          <input
            className="border rounded px-2 py-1"
            value={memberName}
            onChange={(e) => setMemberName(e.target.value)}
            placeholder="名前を入力"
          />
          <button className="bg-blue-500 text-white rounded px-3 py-1" onClick={addMember}>追加</button>
        </div>
        <ul className="flex gap-2 flex-wrap">
          {members.map((m) => (
            <li key={m.id} className="bg-gray-100 rounded px-2 py-1">{m.name}</li>
          ))}
        </ul>
      </section>

      {/* 支払い追加 */}
      <section className="mb-8">
        <h2 className="font-semibold mb-2">支払い記録</h2>
        <div className="flex flex-col sm:flex-row gap-2 mb-2">
          <select
            className="border rounded px-2 py-1"
            value={payment.payerId}
            onChange={(e) => {
              const val = e.target.value;
              setPayment((p) => ({ ...p, payerId: val === "" ? "" : Number(val) }));
            }}
          >
            <option value="">支払者</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <input
            className="border rounded px-2 py-1"
            type="number"
            min="0"
            value={payment.amount}
            onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))}
            placeholder="金額"
          />
          <input
            className="border rounded px-2 py-1"
            value={payment.description}
            onChange={(e) => setPayment((p) => ({ ...p, description: e.target.value }))}
            placeholder="用途 (例: ホテル)"
          />
          <button className="bg-green-500 text-white rounded px-3 py-1" onClick={addPayment}>追加</button>
        </div>
        <ul>
          {payments.map((p) => {
            const payer = members.find((m) => m.id === p.payerId)?.name || "";
            return (
              <li key={p.id} className="text-sm mb-1">{payer} が {p.amount} 円 ({p.description}) を支払い</li>
            );
          })}
        </ul>
      </section>

      {/* 精算結果 */}
      <section>
        <h2 className="font-semibold mb-2">精算結果</h2>
        <ul>
          {settlement.map((s) => (
            <li key={s.name} className="text-sm">
              {s.name}：{s.diff > 0 ? `+${s.diff}円 受け取り` : s.diff < 0 ? `${s.diff}円 支払い` : "±0円"}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
