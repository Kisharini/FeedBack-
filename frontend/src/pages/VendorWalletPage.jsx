import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import WalletPanel from "../components/WalletPanel";
import { clearAuth, getCurrentUserFromStorage } from "../lib/auth";
import { fetchWalletSummary } from "../lib/wallet";
import { navigateTo } from "../lib/navigation";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "--";

export default function VendorWalletPage() {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const [state, setState] = useState({
    loading: true,
    error: "",
    wallet: {
      balance: { amount: 0, formatted: "RM 0.00" },
      transactions: [],
    },
  });
  const [filterType, setFilterType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedTxId, setExpandedTxId] = useState(null);

  useEffect(() => {
    if (!currentUser || !["VENDOR", "MERCHANT", "ADMIN"].includes(currentUser.role)) {
      navigateTo("/login");
      return;
    }

    const loadWallet = async () => {
      setState((current) => ({ ...current, loading: true, error: "" }));

      try {
        const response = await fetchWalletSummary();
        setState({
          loading: false,
          error: "",
          wallet: response.data,
        });
      } catch (error) {
        if (error.message === "You do not have permission to access this resource") {
          clearAuth();
          navigateTo("/login");
          return;
        }

        setState((current) => ({
          ...current,
          loading: false,
          error: error.message || "Failed to load vendor wallet.",
        }));
      }
    };

    loadWallet();
  }, [currentUser]);

  const filteredTransactions = useMemo(() => {
    const txs = state.wallet?.transactions || [];
    return txs.filter((tx) => {
      const isWithdrawal = tx.type === "WITHDRAWAL" || tx.amount < 0;
      if (filterType === "EARNING" && isWithdrawal) return false;
      if (filterType === "WITHDRAWAL" && !isWithdrawal) return false;

      const query = searchQuery.toLowerCase();
      const idMatch = (tx.id || "").toLowerCase().includes(query);
      const descMatch = (tx.description || "").toLowerCase().includes(query);
      const referenceMatch = (tx.reference || "").toLowerCase().includes(query);

      return idMatch || descMatch || referenceMatch;
    });
  }, [filterType, searchQuery, state.wallet?.transactions]);

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#e6ebda] bg-[linear-gradient(135deg,#fff9ef_0%,#f5fbe9_48%,#eef7ff_100%)] p-8 shadow-level-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f0d9b3] bg-[#fff4df] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#8c5d17]">
                <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
                Vendor Wallet
              </div>
              <h1 className="mt-2 font-display text-[clamp(2rem,3vw,2.8rem)] leading-tight font-extrabold text-[#1d3720]">
                Vendor Earnings
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#53604a]">
                Review completed order payouts, inspect transaction history, and transfer available earnings to your bank from this dedicated wallet page.
              </p>
            </div>
          </div>
        </section>

        {state.error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-md">error</span>
            {state.error}
          </div>
        )}

        {state.loading ? (
          <div className="mt-8 rounded-[2rem] border border-[#e7eddc] bg-white p-12 text-center shadow-level-1">
            <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
            <p className="mt-4 text-sm font-medium text-[#53604a]">Loading wallet balance metadata...</p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            <WalletPanel
              title="Vendor Wallet Balance"
              subtitle="Completed paid orders automatically credit your wallet. Donation-only orders do not add vendor earnings."
              wallet={state.wallet}
              onWalletUpdated={(wallet) =>
                setState((current) => ({
                  ...current,
                  wallet,
                }))
              }
              accentClassName="bg-[#fff4df] text-[#8c5d17] border-[#f0d9b3]"
            />

            <section className="rounded-[2rem] border border-[#e7eddc] bg-white overflow-hidden shadow-level-1">
              <div className="flex flex-col gap-4 border-b border-[#edf3e4] bg-[#fbfdf8] px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#1d3720]">Wallet Statement</h2>
                  <p className="text-xs text-[#71806c]">Filter incoming sales payouts and outgoing bank withdrawals.</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="inline-flex rounded-xl bg-gray-100/80 p-1 text-xs font-semibold">
                    {["ALL", "EARNING", "WITHDRAWAL"].map((type) => (
                      <button
                        key={type}
                        onClick={() => setFilterType(type)}
                        className={`rounded-lg px-3 py-1.5 transition capitalize ${
                          filterType === type
                            ? "bg-white text-[#1d3720] shadow-sm"
                            : "text-gray-500 hover:text-gray-900"
                        }`}
                      >
                        {type.toLowerCase()}s
                      </button>
                    ))}
                  </div>

                  <div className="relative w-full sm:w-64">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">search</span>
                    <input
                      type="text"
                      placeholder="Search description, reference..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      className="w-full rounded-xl border border-[#dce3d5] bg-white py-1.5 pl-9 pr-4 text-xs outline-none transition focus:border-[#a3b899] focus:ring-2 focus:ring-[#eef7df]"
                    />
                  </div>
                </div>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="p-12 text-center text-sm text-[#5f6d5b]">
                  <span className="material-symbols-outlined text-4xl text-[#a0af9b] mb-2 block font-light">receipt_long</span>
                  No matching wallet transactions found.
                </div>
              ) : (
                <div className="divide-y divide-[#edf3e4]">
                  {filteredTransactions.map((tx) => {
                    const isExpanded = expandedTxId === tx.id;
                    const isEarning = tx.type !== "WITHDRAWAL" && tx.amount >= 0;

                    return (
                      <article
                        key={tx.id}
                        onClick={() => setExpandedTxId((current) => (current === tx.id ? null : tx.id))}
                        className={`transition duration-150 cursor-pointer ${isExpanded ? "bg-[#f8fbf4]" : "hover:bg-gray-50/60"}`}
                      >
                        <div className="flex items-center justify-between px-6 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-md font-bold ${
                              isEarning ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}>
                              <span className="material-symbols-outlined">
                                {isEarning ? "south_west" : "north_east"}
                              </span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#1d3720] truncate">{tx.description || (isEarning ? "Order payout credit" : "Bank transfer withdrawal")}</p>
                              <p className="text-[11px] text-[#72806b] mt-0.5">{formatDateTime(tx.createdAt)}</p>
                            </div>
                          </div>

                          <div className="text-right pl-4">
                            <p className={`text-sm font-bold ${isEarning ? "text-emerald-700" : "text-gray-900"}`}>
                              {isEarning ? "+" : ""}{tx.formatted || `RM ${(tx.amount / 100).toFixed(2)}`}
                            </p>
                            <span className="text-[10px] font-medium text-gray-400 block tracking-tight">
                              ID: #{String(tx.id).slice(-6).toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {isExpanded && (
                          <div
                            className="px-6 pb-4 pt-1 border-t border-dashed border-gray-100 bg-[#fbfdf9]/50"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="rounded-xl border border-gray-200/60 bg-white p-4 shadow-inner text-xs text-[#425040] space-y-2">
                              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                <div>
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Reference</span>
                                  <p className="font-mono text-gray-700 font-medium mt-0.5">{tx.reference || tx.id || "--"}</p>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Ledger Event</span>
                                  <p className="font-semibold text-gray-700 mt-0.5">{isEarning ? "Vendor Order Payout" : "Bank Withdrawal"}</p>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Settlement Status</span>
                                  <p className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 mt-0.5">
                                    <span className="h-1 w-1 rounded-full bg-emerald-500" /> Reconciled
                                  </p>
                                </div>
                                <div>
                                  <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide">Method</span>
                                  <p className="font-medium text-gray-700 mt-0.5">{isEarning ? "Marketplace settlement" : "Instant bank payout"}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
