import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getCurrentUserFromStorage } from "../lib/auth";
import { apiRequest } from "../lib/api";
import { navigateTo } from "../lib/navigation";

export default function RiderDashboardPage() {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const [availableJobs, setAvailableJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [state, setState] = useState({ loading: true, error: "" });

  useEffect(() => {
    if (!currentUser || currentUser.role !== "RIDER") {
      navigateTo("/login");
      return;
    }

    fetchJobs();
  }, [currentUser]);

  const fetchJobs = async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      // 1. Fetch available pool jobs
      const availableData = await apiRequest("/rider/jobs/available", { method: "GET" });
      setAvailableJobs(Array.isArray(availableData) ? availableData : []);

      // 2. Fetch current active assigned job if any
      const activeData = await apiRequest("/rider/jobs/active", { method: "GET" });
      setActiveJob(activeData && activeData.id ? activeData : null);

      setState((prev) => ({ ...prev, loading: false }));
    } catch (err) {
      setState({ loading: false, error: err.message || "Failed to sync delivery feeds." });
    }
  };

  const handleAcceptJob = async (orderId) => {
    // Structural safety fallback protection 
    if (activeJob) return;

    try {
      await apiRequest(`/rider/jobs/${orderId}/accept`, { method: "POST" });
      fetchJobs(); // Refresh dashboard layout
    } catch (err) {
      alert(err.message || "Could not claim this delivery job.");
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!activeJob) return;
    try {
      // Status lifecycle transitions: 'PICKED_UP' or 'DELIVERED'
      await apiRequest(`/rider/jobs/${activeJob.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      fetchJobs();
    } catch (err) {
      alert(err.message || "Failed to advance order lifecycle status.");
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10 space-y-8">
        
        {/* Header Widget Layout */}
        <section className="overflow-hidden rounded-[2.5rem] border border-[#e6ebda] bg-[linear-gradient(135deg,#fff9ef_0%,#f5fbe9_48%,#eef7ff_100%)] p-8 shadow-level-2">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-display text-[clamp(1.8rem,3vw,2.4rem)] font-bold text-[#1d3720]">
                Rider Delivery Command Space
              </h1>
              <p className="mt-2 text-sm text-[#53604a]">
                Welcome back, <span className="font-bold text-[#f2994a]">{currentUser?.name}</span>. Manage your current active dispatch route or claim live local rescue packages awaiting transit.
              </p>
            </div>
            <span className="material-symbols-outlined text-[64px] text-[#4c6b84]/20 select-none hidden md:block">
              two_wheeler
            </span>
          </div>
        </section>

        {state.error && (
          <div className="rounded-2xl bg-red-50 p-4 text-red-700 text-sm">{state.error}</div>
        )}

        {state.loading ? (
          <div className="h-40 animate-pulse bg-white border border-[#edf0e6] rounded-[2rem]" />
        ) : (
          <div className="grid gap-8 lg:grid-cols-3">
            
            {/* LEFT / CENTER: ACTIVE JOB / CURRENT DISPATCH ROUTE */}
            <div className="lg:col-span-2 space-y-6">
              <h2 className="text-xl font-bold text-[#1d3720] flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-400 animate-ping" />
                Your Ongoing Mission
              </h2>

              {activeJob ? (
                <div className="rounded-[2.5rem] border border-[#f2994a]/30 bg-white p-6 shadow-level-1 space-y-6">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#f2994a] bg-[#fff6e9] px-2.5 py-1 rounded-full">
                        Status: {activeJob.status.replace("_", " ")}
                      </span>
                      <h3 className="mt-3 font-bold text-lg text-gray-900">{activeJob.listingTitle || "Surplus Rescue Batch"}</h3>
                    </div>
                    <p className="text-sm font-semibold text-gray-500">Order #{activeJob.id.slice(-6)}</p>
                  </div>

                  {/* Route Mapping Milestones */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="bg-[#fbfdf8] p-4 rounded-xl border border-[#edf3e4]">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Step 1: Merchant Pickup</p>
                      <p className="mt-1 text-sm font-bold text-[#1d301e]">{activeJob.vendorName}</p>
                      <p className="text-xs text-gray-600 mt-1">{activeJob.pickupLocation}</p>
                    </div>

                    <div className="bg-[#fbfdf8] p-4 rounded-xl border border-[#edf3e4]">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Step 2: Recipient Drop-Off</p>
                      <p className="mt-1 text-sm font-bold text-[#1d301e]">{activeJob.recipientName}</p>
                      <p className="text-xs text-gray-600 mt-1">{activeJob.deliveryLocation}</p>
                    </div>
                  </div>

                  {/* Action Workflow Button Controls */}
                  <div className="pt-4 flex justify-end">
                    {activeJob.status === "ASSIGNED" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("PICKED_UP")}
                        className="px-6 py-3 bg-primary hover:bg-[#f59b27] text-white font-semibold text-sm rounded-xl transition shadow-sm"
                      >
                        Confirm Package Picked Up
                      </button>
                    )}
                    {activeJob.status === "PICKED_UP" && (
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus("DELIVERED")}
                        className="px-6 py-3 bg-green-700 hover:bg-green-800 text-white font-semibold text-sm rounded-xl transition shadow-sm"
                      >
                        Complete Rescue Delivery
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-[2.5rem] border border-dashed border-[#d5dec8] bg-white p-10 text-center">
                  <span className="material-symbols-outlined text-gray-300 text-4xl">bedtime</span>
                  <p className="mt-2 text-sm text-[#5a6752]">No active trips currently assigned onto your roster.</p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: AVAILABLE OPEN JOB POOL */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-[#1d3720]">Open Deliveries Near You</h2>
              
              {availableJobs.length === 0 ? (
                <div className="rounded-2xl bg-white border border-gray-100 p-6 text-center text-xs text-gray-400">
                  All regional packages cleared! Check back shortly for newly published live store listings.
                </div>
              ) : (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {availableJobs.map((job) => (
                    <div key={job.id} className="rounded-2xl border border-[#ebefdf] bg-white p-4 shadow-sm hover:shadow-md transition space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-bold text-gray-900 truncate max-w-[160px]">{job.vendorName}</h4>
                          <p className="text-[11px] text-gray-500">Est. Distance: {job.distance || "Mock ~2.4km"}</p>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-800">
                          {job.listingType}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 bg-[#fafcf6] p-2.5 rounded-lg border border-gray-50">
                        <p><span className="font-semibold text-[#1d3720]">To:</span> {job.deliveryLocation}</p>
                      </div>
                      <button
                        type="button"
                        disabled={!!activeJob}
                        onClick={() => !activeJob && handleAcceptJob(job.id)}
                        className="w-full py-2 bg-white border border-[#4c6b84]/40 hover:border-[#4c6b84] text-[#4c6b84] font-semibold text-xs rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {activeJob ? "Clear Active Task First" : "Claim Delivery Run"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </main>
    </div>
  );
}