import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import WalletPanel from "../components/WalletPanel";
import { clearAuth, getCurrentUserFromStorage } from "../lib/auth";
import { fetchWalletSummary } from "../lib/wallet";
import { navigateTo } from "../lib/navigation";

export default function RiderWalletPage() {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const [state, setState] = useState({
    loading: true,
    error: "",
    wallet: {
      balance: { amount: 0, formatted: "RM 0.00" },
      transactions: [],
    },
  });

  useEffect(() => {
    if (!currentUser) {
      navigateTo("/login");
      return;
    }

    if (currentUser.role !== "RIDER") {
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
          error: error.message || "Failed to load rider wallet.",
        }));
      }
    };

    loadWallet();
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#e6ebda] bg-[linear-gradient(135deg,#eef7ff_0%,#f5fbff_48%,#fff9ef_100%)] p-8 shadow-level-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c7d69]">
                Rider Wallet
              </p>
              <h1 className="mt-2 font-display text-[clamp(2rem,3vw,2.8rem)] leading-tight text-[#1d3720]">
                Delivery earnings and bank withdrawals
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#53604a]">
                Every completed delivery adds the delivery fee into your wallet, and you can send your balance to your bank account from this page.
              </p>
            </div>
          </div>
        </section>

        {state.error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {state.loading ? (
          <div className="mt-8 rounded-[2rem] border border-[#e7eddc] bg-white p-10 text-center shadow-level-1">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
            <p className="mt-4 text-sm font-medium text-[#53604a]">Loading wallet balance...</p>
          </div>
        ) : (
          <div className="mt-8">
            <WalletPanel
              title="Rider Wallet"
              subtitle="Completed deliveries add to this balance automatically, and you can transfer your earnings to your bank account from this page."
              wallet={state.wallet}
              onWalletUpdated={(wallet) =>
                setState((current) => ({
                  ...current,
                  wallet,
                }))
              }
              accentClassName="bg-[#eef7ff] text-[#1d77d4] border-[#d9e8f3]"
            />
          </div>
        )}
      </main>
    </div>
  );
}
