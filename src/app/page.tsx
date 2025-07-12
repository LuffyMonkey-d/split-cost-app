"use client";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Member, Payment, PaymentFormData } from "../types";
import { convertToJPY } from "../utils/exchangeRate";
import { useExchangeRates } from "../hooks/useExchangeRates";
import { MemberManagement } from "../components/MemberManagement";
import { ExchangeRateManager } from "../components/ExchangeRateManager";
import { PaymentForm } from "../components/PaymentForm";
import { PaymentList } from "../components/PaymentList";
import { SettlementResult } from "../components/SettlementResult";

export default function Home() {
  const [members, setMembers] = useState<Member[]>([]);
  const [memberName, setMemberName] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payment, setPayment] = useState<PaymentFormData>({
    payerId: "",
    amount: "",
    currency: "JPY",
    description: "",
  });
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingPayment, setEditingPayment] = useState<PaymentFormData>({
    payerId: "",
    amount: "",
    currency: "JPY",
    description: "",
  });

  const { exchangeRates, isLoadingRates, fetchExchangeRates } =
    useExchangeRates();

  // 参加者追加
  const addMember = () => {
    if (!memberName.trim()) return false;
    setMembers((prev) => [...prev, { id: uuidv4(), name: memberName.trim() }]);
    setMemberName("");
    return true;
  };

  // 支払い追加
  const addPayment = () => {
    if (
      payment.payerId === "" ||
      !payment.amount ||
      Number(payment.amount) <= 0
    )
      return;

    const originalAmount = Number(payment.amount);
    const jpyConvertedAmount = convertToJPY(
      originalAmount,
      payment.currency,
      exchangeRates
    );

    setPayments((prev) => [
      ...prev,
      {
        id: uuidv4(),
        payerId: payment.payerId as string,
        amount: jpyConvertedAmount,
        currency: payment.currency,
        description: payment.description,
        originalAmount: originalAmount,
        exchangeRate: jpyConvertedAmount / originalAmount,
      },
    ]);
    setPayment({ payerId: "", amount: "", currency: "JPY", description: "" });
  };

  // 支払い削除
  const deletePayment = (paymentId: string) => {
    setPayments((prev) => prev.filter((payment) => payment.id !== paymentId));
  };

  // 支払い編集
  const editPayment = (paymentId: string) => {
    const paymentToEdit = payments.find((payment) => payment.id === paymentId);
    if (paymentToEdit) {
      setEditingPaymentId(paymentId);
      setEditingPayment({
        payerId: paymentToEdit.payerId,
        amount: paymentToEdit.amount.toString(),
        currency: paymentToEdit.currency,
        description: paymentToEdit.description,
      });
    }
  };

  // 編集を保存
  const saveEdit = () => {
    if (
      !editingPaymentId ||
      !editingPayment.amount ||
      Number(editingPayment.amount) <= 0
    )
      return;

    const originalAmount = Number(editingPayment.amount);
    const jpyConvertedAmount = convertToJPY(
      originalAmount,
      editingPayment.currency,
      exchangeRates
    );

    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === editingPaymentId
          ? {
              ...payment,
              payerId: editingPayment.payerId,
              amount: jpyConvertedAmount,
              currency: editingPayment.currency,
              description: editingPayment.description,
              originalAmount: originalAmount,
              exchangeRate: jpyConvertedAmount / originalAmount,
            }
          : payment
      )
    );

    setEditingPaymentId(null);
    setEditingPayment({
      payerId: "",
      amount: "",
      currency: "JPY",
      description: "",
    });
  };

  // 編集をキャンセル
  const cancelEdit = () => {
    setEditingPaymentId(null);
    setEditingPayment({
      payerId: "",
      amount: "",
      currency: "JPY",
      description: "",
    });
  };

  // 割り勘計算
  const calcSettlement = () => {
    if (members.length === 0) return [];

    const totalJPYAmount = payments.reduce(
      (sum, payment) => sum + payment.amount,
      0
    );
    const averageJPYAmount = totalJPYAmount / members.length;

    const memberPaidAmounts = Object.fromEntries(
      members.map((member) => [member.id, 0])
    );
    payments.forEach((payment) => {
      memberPaidAmounts[payment.payerId] += payment.amount;
    });

    return members.map((member) => ({
      id: member.id,
      name: member.name,
      diff:
        Math.round((memberPaidAmounts[member.id] - averageJPYAmount) * 100) /
        100,
    }));
  };

  const settlement = calcSettlement();

  // 金額バリデーション
  const isAmountInvalid = payment.amount === "" || Number(payment.amount) <= 0;

  // 参加者削除
  const deleteMember = (memberId: string) => {
    setMembers((prev) => prev.filter((member) => member.id !== memberId));
  };

  // 支払い詳細を取得する関数
  const getPaymentDetails = (memberId: string) => {
    return payments
      .filter((payment) => payment.payerId === memberId)
      .map((payment) => ({
        amount: payment.originalAmount || payment.amount,
        currency: payment.currency,
        jpyAmount: payment.amount,
        description: payment.description,
      }));
  };

  // 通貨別の支払い合計を取得する関数
  const getCurrencyTotals = () => {
    const currencyTotals: Record<
      string,
      { amount: number; jpyAmount: number }
    > = {};

    payments.forEach((payment) => {
      const currencyCode = payment.currency;
      if (!currencyTotals[currencyCode]) {
        currencyTotals[currencyCode] = { amount: 0, jpyAmount: 0 };
      }
      currencyTotals[currencyCode].amount +=
        payment.originalAmount || payment.amount;
      currencyTotals[currencyCode].jpyAmount += payment.amount || 0;
    });

    return currencyTotals;
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center tracking-wide">
        旅行費用割り勘アプリ
      </h1>

      <MemberManagement
        members={members}
        memberName={memberName}
        setMemberName={setMemberName}
        addMember={addMember}
        deleteMember={deleteMember}
      />

      {/* 支払い記録セクション */}
      <section className="mb-8 bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="font-semibold text-lg">支払い記録</h2>
          <ExchangeRateManager
            exchangeRates={exchangeRates}
            isLoadingRates={isLoadingRates}
            fetchExchangeRates={fetchExchangeRates}
          />
        </div>
        <PaymentForm
          payment={payment}
          setPayment={setPayment}
          members={members}
          addPayment={addPayment}
          isAmountInvalid={isAmountInvalid}
        />
        <PaymentList
          payments={payments}
          members={members}
          editingPaymentId={editingPaymentId}
          editingPayment={editingPayment}
          setEditingPayment={setEditingPayment}
          deletePayment={deletePayment}
          editPayment={editPayment}
          saveEdit={saveEdit}
          cancelEdit={cancelEdit}
        />
      </section>

      <SettlementResult
        settlement={settlement}
        getPaymentDetails={getPaymentDetails}
        getCurrencyTotals={getCurrencyTotals}
        payments={payments}
        members={members}
        exchangeRates={exchangeRates}
      />
    </div>
  );
}
