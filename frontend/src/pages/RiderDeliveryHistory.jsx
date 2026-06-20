import { useEffect, useState, useMemo } from "react";
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
  
  // Client-side interactive states (No backend changes needed)
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedJobId, setExpandedJobId] = useState(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "RIDER") {
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

  // Client-side instant filter engine
  const filteredJobs = useMemo(() => {
    return state.jobs.filter((job) => {
      const orderIdMatch = job.id.toLowerCase().includes(searchQuery.toLowerCase());
      const vendorMatch = (job.vendor?.businessName || job.vendor?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const customerMatch = (job.customer?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      const addressMatch = (job.deliveryAddress || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      return orderIdMatch || vendorMatch || customerMatch || addressMatch;
    });
  }, [state.jobs, searchQuery]);

  const toggleExpandJob = (jobId) => {
    setExpandedJobId((prev) => (prev === jobId ? null : jobId));
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        
        {/* Original Rider History Banner */}
        <section className="overflow-hidden rounded-[2.5rem] border border-[#e6ebda] bg-[linear-gradient(135deg,#fff9ef_0%,#f5fbe9_48%,#eef7ff_100%)] p-8 shadow-level-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d8e6cf] bg-[#f4faea] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#2d5b2f]">
                <span className="material-symbols-outlined text-[14px]">history</span>
                Rider Account
              </div>
              <h1 className="mt-2 font-display text-[clamp(2rem,3vw,2.6rem)] font-extrabold leading-tight text-[#1d3720]">
                Rider History
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#53604a]">
                Review the deliveries you have already completed, including the vendor pickup, customer drop-off, and fulfillment time.
              </p>
            </div>
          </div>
        </section>

        {/* Summary Statistics */}
        <section className="mt-8 grid gap-6 sm:grid-cols-2">
          <SummaryCard label="Completed Trips" value={`${completedTrips}`} icon="task_alt" colorClass="bg-[#eef7df] text-[#2d5b2f]" />
          <SummaryCard label="Items Delivered" value={`${deliveredItems}`} icon="inventory_2" colorClass="bg-[#eef2ff] text-[#1d77d4]" />
        </section>

        {/* Main Log panel with searchable filter */}
        <section className="mt-8 rounded-[2rem] border border-[#e7eddc] bg-white overflow-hidden shadow-level-1">
          <div className="flex flex-col gap-4 border-b border-[#edf3e4] bg-[#fbfdf8] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-[#1d3720]">Delivery Log</h2>
            
            {/* Live Client Search bar */}
            <div className="relative max-w-sm w-full">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-lg">search</span>
              <input
                type="text"
                placeholder="Search order ID, vendor, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-[#dce3d5] bg-white py-2 pl-10 pr-4 text-sm outline-none transition focus:border-[#a3b899] focus:ring-2 focus:ring-[#eef7df]"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-md"
                >
                  close
                </button>
              )}
            </div>
          </div>

          {state.loading ? (
            <div className="p-12 text-center text-sm font-medium text-[#5f6d5b]">
              <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-primary/35 border-t-primary mb-3" />
              Loading completed deliveries...
            </div>
          ) : state.error ? (
            <div className="p-6 text-sm text-red-700 bg-red-50/50 m-6 rounded-xl border border-red-100">{state.error}</div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 text-center text-sm text-[#5f6d5b]">
              <span className="material-symbols-outlined text-4xl text-[#a0af9b] mb-2 block">local_shipping</span>
              {searchQuery ? "No matched delivery results for your search query." : "No completed deliveries on this profile yet."}
            </div>
          ) : (
            <div className="divide-y divide-[#edf3e4]">
              {filteredJobs.map((job) => {
                const isExpanded = expandedJobId === job.id;
                return (
                  <article 
                    key={job.id} 
                    className={`transition duration-200 cursor-pointer ${isExpanded ? 'bg-[#f7faf3]/60' : 'hover:bg-[#fafdf6]/40'}`}
                    onClick={() => toggleExpandJob(job.id)}
                  >
                    {/* Collapsed view row summary */}
                    <div className="p-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="font-display text-base font-bold text-[#1d3720]">
                            Order #{job.id.slice(-8).toUpperCase()}
                          </h3>
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Completed
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-[#5f6d5b]">
                            <span className="material-symbols-outlined text-[16px] text-emerald-600 font-bold">storefront</span>
                            <p className="truncate">
                              Pickup from <span className="font-semibold text-[#1d3720]">{job.vendor?.businessName || job.vendor?.name || "Vendor"}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#5f6d5b]">
                            <span className="material-symbols-outlined text-[16px] text-red-500 font-bold">location_on</span>
                            <p className="truncate">
                              Delivered to <span className="font-semibold text-[#1d3720]">{job.customer?.name || "Customer"}</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-medium text-[#72806b] pt-1">
                          <span className="material-symbols-outlined text-[14px] text-[#8ea087]">calendar_month</span>
                          <p>Completed {formatDateTime(job.completedAt || job.updatedAt)}</p>
                        </div>
                      </div>

                      {/* Summary indicator tokens */}
                      <div className="flex items-center gap-4 justify-between lg:justify-end min-w-[240px]">
                        <div className="text-right hidden sm:block">
                          <p className="text-xs font-bold text-[#71806c] uppercase tracking-wider">Total Volume</p>
                          <p className="text-sm font-semibold text-[#1d3720] mt-0.5">
                            {job.items.reduce((sum, item) => sum + item.quantity, 0)} Units Assigned
                          </p>
                        </div>
                        
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full border border-[#dce3d5] bg-white text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180 bg-[#eef7df]' : ''}`}>
                          <span className="material-symbols-outlined text-md">keyboard_arrow_down</span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive breakdown expansion drawer */}
                    {isExpanded && (
                      <div 
                        className="px-6 pb-6 pt-2 border-t border-dashed border-[#e6edda]"
                        onClick={(e) => e.stopPropagation()} 
                      >
                        <div className="grid gap-6 md:grid-cols-3 bg-white border border-[#edf3e4] rounded-2xl p-5 shadow-inner">
                          
                          {/* Route Point logs */}
                          <div className="space-y-2 md:col-span-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#71806c]">Delivery Route Points</h4>
                            <div className="relative border-l-2 border-gray-200 pl-4 ml-2 space-y-4 py-1">
                              <div className="relative">
                                <span className="absolute -left-[23px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white ring-4 ring-white">
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                </span>
                                <p className="text-xs font-bold text-[#1d3720]">Vendor Origin</p>
                                <p className="text-xs text-[#5f6d5b] mt-0.5">{job.vendor?.businessName || job.vendor?.name || "Vendor Hub Operations"}</p>
                              </div>
                              <div className="relative">
                                <span className="absolute -left-[23px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-white ring-4 ring-white">
                                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                                </span>
                                <p className="text-xs font-bold text-[#1d3720]">Drop-off Destination Address</p>
                                <p className="text-xs text-[#5f6d5b] mt-0.5">{job.deliveryAddress || "--"}</p>
                              </div>
                            </div>
                          </div>

                          {/* Order manifest item map list */}
                          <div className="space-y-3 pt-3 md:pt-0 md:border-l border-gray-100 md:pl-6">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-[#71806c]">Manifest Items</h4>
                            <div className="max-h-[140px] overflow-y-auto space-y-2 pr-1">
                              {job.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-xs border-b border-gray-50 pb-1.5">
                                  <span className="font-medium text-[#1d3720] max-w-[150px] truncate">{item.title}</span>
                                  <span className="font-bold text-[#476846] bg-[#f0f6e9] px-2 py-0.5 rounded-md">x{item.quantity}</span>
                                </div>
                              ))}
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
      </main>
    </div>
  );
}

function SummaryCard({ icon, label, value, colorClass }) {
  return (
    <div className="rounded-2xl border border-[#e6ebda] bg-white p-5 shadow-sm hover:shadow-md transition duration-300">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl ${colorClass}`}>
          <span className="material-symbols-outlined">{icon}</span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-[#71806c]">{label}</p>
          <p className="mt-1 text-2xl font-black text-[#1d3720] leading-none">{value}</p>
        </div>
      </div>
    </div>
  );
}