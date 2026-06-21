import { useState } from "react";
import { withdrawWalletBalance } from "../lib/wallet";

const formatMoney = (money) => money?.formatted || "RM 0.00";

const initialForm = {
  bankName: "",
  accountName: "",
  accountNumber: "",
  amount: "",
};

export default function WalletPanel({
  title,
  subtitle,
  wallet,
  onWalletUpdated,
  accentClassName = "bg-[#eef7df] text-primary border-[#d8e6cf]",
}) {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formData, setFormData] = useState(initialForm);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const resetModal = () => {
    setShowWithdrawModal(false);
    setSubmitting(false);
    setError("");
    setSuccess("");
    setFormData(initialForm);
  };

  const handleWithdraw = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await withdrawWalletBalance({
        bankName: formData.bankName.trim(),
        accountName: formData.accountName.trim(),
        accountNumber: formData.accountNumber.trim(),
        amount: Math.round(Number(formData.amount || 0) * 100),
      });

      onWalletUpdated?.({
        balance: response.data.balance,
        transactions: response.data.transactions,
      });

      setSuccess(response.message || "Withdrawal submitted successfully.");
      window.setTimeout(() => {
        resetModal();
      }, 1200);
    } catch (requestError) {
      setError(requestError.message || "Withdrawal failed.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="rounded-[2rem] border border-[#e7eddc] bg-white p-6 shadow-level-1">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#71806c]">{title}</p>
            <h3 className="mt-1 text-3xl font-bold text-[#1d3720]">{formatMoney(wallet?.balance)}</h3>
            <p className="mt-2 max-w-md text-sm text-[#5f6d5b]">{subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowWithdrawModal(true);
            }}
            className={`rounded-xl border px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:brightness-[0.98] ${accentClassName}`}
          >
            Withdraw To Bank
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#edf3e4] bg-[#fbfdf8] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#71806c]">Recent Transactions</p>
            <p className="mt-2 text-sm font-bold text-[#1d3720]">{wallet?.transactions?.length || 0} records</p>
          </div>
          <div className="rounded-2xl border border-[#edf3e4] bg-[#fbfdf8] p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#71806c]">Latest Activity</p>
            <p className="mt-2 text-sm font-bold text-[#1d3720]">
              {wallet?.transactions?.[0]?.description || "No wallet activity yet"}
            </p>
          </div>
        </div>

        <div className="mt-5 max-h-60 space-y-3 overflow-y-auto pr-1">
          {(wallet?.transactions || []).length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#d7dfcb] bg-[#fcfdf9] px-4 py-8 text-center text-sm text-[#5f6d5b]">
              Wallet activity will appear here once payouts or withdrawals happen.
            </div>
          ) : (
            wallet.transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-[#edf3e4] bg-[#fbfdf8] p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#1d3720]">{transaction.description}</p>
                  <p className="mt-1 text-xs text-[#71806c]">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                  transaction.amount?.amount < 0
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}>
                  {formatMoney(transaction.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#182114]/35 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] border border-[#e7eddc] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#71806c]">Bank Withdrawal</p>
                <h3 className="mt-1 text-2xl font-bold text-[#1d3720]">Send wallet funds to bank</h3>
              </div>
              <button
                type="button"
                onClick={resetModal}
                className="rounded-full bg-[#f4f7ef] p-2 text-[#5f6d5b] transition hover:bg-[#ebf2df]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleWithdraw} className="mt-5 space-y-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#576455]">Bank Name</span>
                <input
                  required
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-3 outline-none focus:border-[#f2994a]"
                  placeholder="Maybank"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#576455]">Account Holder</span>
                <input
                  required
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleChange}
                  className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-3 outline-none focus:border-[#f2994a]"
                  placeholder="Account holder name"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#576455]">Account Number</span>
                  <input
                    required
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-3 outline-none focus:border-[#f2994a]"
                    placeholder="1234567890"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#576455]">Amount (RM)</span>
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-3 outline-none focus:border-[#f2994a]"
                    placeholder="25.00"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-[#edf3e4] bg-[#fbfdf8] p-4 text-sm text-[#5f6d5b]">
                Available balance: <span className="font-bold text-[#1d3720]">{formatMoney(wallet?.balance)}</span>
              </div>

              {error && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {success}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetModal}
                  className="rounded-xl border border-[#d7e4cd] bg-white px-4 py-2.5 text-sm font-semibold text-[#476846]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#f59b27] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? "Submitting..." : "Confirm Withdrawal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
