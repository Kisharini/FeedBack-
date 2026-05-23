import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getCurrentUserFromStorage } from "../lib/auth";
import { apiRequest } from "../lib/api";
import { navigateTo } from "../lib/navigation";

export default function RiderHistoryPage() {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const [pastDeliveries, setPastDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "RIDER") {
      navigateTo("/login");
      return;
    }

    const fetchHistory = async () => {
      try {
        const data = await apiRequest("/rider/jobs/history", { method: "GET" });
        if (Array.isArray(data)) setPastDeliveries(data);
      } catch (err) {
        console.error("Could not load past rider run histories:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentUser]);

  // Derived Summary Metric Aggregations
  const totalDeliveries = pastDeliveries.length;
  const foodRescuedCount = pastDeliveries.reduce((acc, current) => acc + (current.quantity || 1), 0);

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10 space-y-8">
        
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1d3720]">Your Delivery Achievements</h1>
          <p className="text-sm text-gray-500 mt-1">Review your legacy footprint of tracking and distributing regional surplus items.</p>
        </div>

        {/* Impact Cards Row Layout */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="p-6 rounded-2xl border border-[#e6ebda] bg-gradient-to-br from-white to-[#f5fbe9] shadow-sm flex items-center gap-4">
            <span className="material-symbols-outlined text-[36px] text-green-600 bg-green-50 p-3 rounded-xl">task_alt</span>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completed Trips</p>
              <p className="text-2xl font-black text-gray-900 mt-0.5">{totalDeliveries} Success Runs</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-[#e6ebda] bg-gradient-to-br from-white to-[#fff9ef] shadow-sm flex items-center gap-4">
            <span className="material-symbols-outlined text-[36px] text-[#f2994a] bg-orange-50 p-3 rounded-xl">local_mall</span>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Servings Guided</p>
              <p className="text-2xl font-black text-gray-900 mt-0.5">{foodRescuedCount} Batches Safely Saved</p>
            </div>
          </div>
        </div>

        {/* History Table Container */}
        <section className="bg-white rounded-[2rem] border border-[#edf0e6] shadow-level-1 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60">
            <h3 className="font-bold text-sm text-gray-800">Historical Dropoff Logs</h3>
          </div>

          {loading ? (
            <div className="p-12 text-center text-sm text-gray-400 animate-pulse">Syncing archived ledger records...</div>
          ) : pastDeliveries.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <span className="material-symbols-outlined text-gray-300 text-3xl">history_toggle_off</span>
              <p className="text-xs text-gray-400">No historically logged runs found in this driver statement account.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pastDeliveries.map((log) => {
                // Safeguard against missing or malformed data formats safely
                const rawTimestamp = log.updatedAt || log.deliveryTime;
                const formattedDate = rawTimestamp 
                  ? new Date(rawTimestamp).toLocaleString() 
                  : "Recently Delivered";

                return (
                  <div key={log.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-900">{log.listingTitle || "Rescue Run"}</h4>
                        <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                          #{log.id ? log.id.slice(-6) : "000000"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        <span className="font-semibold text-gray-700">{log.vendorName || "Unknown Merchant"}</span> ➔ <span className="font-semibold text-gray-700">{log.recipientName || "Recipient"}</span>
                      </p>
                      <p className="text-[11px] text-gray-400">Completed: {formattedDate}</p>
                    </div>

                    <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2">
                      <span className="text-xs font-bold px-3 py-1 bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">verified</span> Delivered
                      </span>
                      <p className="text-xs text-gray-500">Qty: {log.quantity || 1} package(s)</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}