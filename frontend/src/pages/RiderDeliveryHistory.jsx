import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { clearAuth, getCurrentUserFromStorage } from "../lib/auth";
import { fetchRiderJobHistory } from "../lib/rider";
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

export default function RiderDeliveryHistory() {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const [state, setState] = useState({
    loading: true,
    error: "",
    jobs: [],
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

    const loadHistory = async () => {
      try {
        const response = await fetchRiderJobHistory();
        setState({
          loading: false,
          error: "",
          jobs: response.data.jobs || [],
        });
      } catch (error) {
        if (error.message === "You do not have permission to access this resource") {
          clearAuth();
          navigateTo("/login");
          return;
        }

        setState({
          loading: false,
          error: error.message || "Failed to load rider delivery history.",
          jobs: [],
        });
      }
    };

    loadHistory();
  }, [currentUser]);

  const completedTrips = state.jobs.length;
  const deliveredItems = state.jobs.reduce(
    (total, job) => total + job.items.reduce((sum, item) => sum + item.quantity, 0),
    0
  );

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#e6ebda] bg-[linear-gradient(135deg,#fff9ef_0%,#f5fbe9_48%,#eef7ff_100%)] p-8 shadow-level-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c7d69]">
                Rider History
              </p>
              <h1 className="mt-2 font-display text-[clamp(2rem,3vw,2.8rem)] leading-tight text-[#1d3720]">
                Completed deliveries on your account
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-[#53604a]">
                Review the deliveries you have already completed, including the vendor pickup, customer drop-off, and fulfillment time.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2">
          <SummaryCard label="Completed Trips" value={`${completedTrips}`} icon="task_alt" />
          <SummaryCard label="Items Delivered" value={`${deliveredItems}`} icon="inventory_2" />
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#e7eddc] bg-white shadow-level-1">
          <div className="border-b border-[#edf3e4] px-6 py-5">
            <h2 className="text-lg font-bold text-[#1d3720]">Delivery Log</h2>
          </div>

          {state.loading ? (
            <div className="p-10 text-center text-sm text-[#5f6d5b]">Loading completed deliveries...</div>
          ) : state.error ? (
            <div className="p-6 text-sm text-red-700">{state.error}</div>
          ) : state.jobs.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#5f6d5b]">
              No completed deliveries yet.
            </div>
          ) : (
            <div className="divide-y divide-[#edf3e4]">
              {state.jobs.map((job) => (
                <article key={job.id} className="px-6 py-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-bold text-[#1d3720]">
                          Order #{job.id.slice(-8).toUpperCase()}
                        </h3>
                        <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                          Completed
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-[#5f6d5b]">
                        Pickup from {job.vendor?.businessName || job.vendor?.name || "Vendor"} and delivered to {job.customer?.name || "Customer"}
                      </p>
                      <p className="mt-1 text-xs text-[#72806b]">
                        Completed {formatDateTime(job.completedAt || job.updatedAt)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-[#e6edda] bg-[#fbfdf8] px-4 py-3 text-sm text-[#425040]">
                      <p>Drop-off: <span className="font-semibold text-[#1d3720]">{job.deliveryAddress || "--"}</span></p>
                      <p className="mt-1">Items: <span className="font-semibold text-[#1d3720]">{job.items.map((item) => `${item.title} x${item.quantity}`).join(", ")}</span></p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function SummaryCard({ icon, label, value }) {
  return (
    <div className="rounded-2xl border border-[#e6ebda] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-[#eef7df] p-3 text-primary">
          <span className="material-symbols-outlined text-3xl">{icon}</span>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#71806c]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[#1d3720]">{value}</p>
        </div>
      </div>
    </div>
  );
}
