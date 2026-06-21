import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { apiRequest } from "../lib/api";
import { navigateTo } from "../lib/navigation";
import { getCurrentUserFromStorage } from "../lib/auth";

export default function AdminControlPanel() {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [error, setError] = useState("");
  
  const [alerts, setAlerts] = useState([
    {
      id: "alert-mock-1",
      severity: "HIGH",
      targetType: "LISTING",
      targetName: "Premium Medical Supplies Bulk",
      issueTitle: "Prohibited Item Category",
      description: "This listing contains restricted prescription items violating section 4.2 of our community distribution guidelines.",
      reporterName: "System Flag (Automated Keyword)",
      timeAgo: "14 minutes ago"
    },
    {
      id: "alert-mock-2",
      severity: "MEDIUM",
      targetType: "INDIVIDUAL",
      targetName: "Marcus Vance (Driver ID: #8841)",
      issueTitle: "Spam / Recurrent Delivery Cancellations",
      description: "User has accepted and subsequently dropped 4 dispatch assignments within a 2-hour window.",
      reporterName: "Logistics Engine Monitor",
      timeAgo: "2 hours ago"
    }
  ]);

  useEffect(() => {
    if (!currentUser) {
      navigateTo("/login");
      return;
    }

    if (currentUser.role !== "ADMIN") {
      navigateTo("/");
      return;
    }
  }, [currentUser]);

  const handleAction = async (alertId, actionType) => {
    setActionLoadingId(`${alertId}-${actionType}`);
    setError("");

    try {
      await apiRequest(`/admin/alerts/${alertId}/action`, {
        method: "POST",
        body: JSON.stringify({ action: actionType }),
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.id !== alertId));
    } catch (requestError) {
      setError(requestError.message || "Failed to process moderation action.");
    } finally {
      setActionLoadingId("");
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#e6ebda] bg-[linear-gradient(135deg,#fff9ef_0%,#f5fbe9_48%,#eef7ff_100%)] p-8 shadow-level-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c7d69]">
              Administration Panel
            </p>
            <h1 className="mt-2 font-display text-[clamp(2rem,3vw,2.8rem)] leading-tight text-[#1d3720]">
              System Flags & Audit Queue
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#53604a]">
              Review automated flags, community infraction notices, and target exceptions. Enforce platform compliance across drivers, customers, and active vendor inventory.
            </p>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {alerts.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-[#d5dec8] bg-white px-6 py-14 text-center">
            <p className="text-h2 text-[#223623]">All clear!</p>
            <p className="mt-3 text-body-md text-[#63705f]">
              No pending moderation flags or system warnings require your attention.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className="overflow-hidden rounded-[2rem] border border-[#ebefdf] bg-white p-6 shadow-[0_12px_24px_rgba(92,103,70,0.05)] flex flex-col md:flex-row md:items-start justify-between gap-6"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full border ${
                      alert.severity === "HIGH" 
                        ? "bg-red-50 text-red-700 border-red-200" 
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {alert.severity} Priority
                    </span>
                    <span className="text-xs font-medium text-[#70816c]">
                      Reported by {alert.reporterName} • {alert.timeAgo}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-bold text-[#1d3720]">{alert.issueTitle}</h3>
                    <p className="text-sm font-semibold text-primary mt-1">Target: {alert.targetName} ({alert.targetType})</p>
                    <p className="mt-2 text-sm leading-relaxed text-[#5b6757]">{alert.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap md:flex-col lg:flex-row gap-2 self-stretch md:self-start justify-end">
                  {alert.targetType === "LISTING" ? (
                    <button
                      type="button"
                      disabled={actionLoadingId === `${alert.id}-TAKE_DOWN_LISTING`}
                      onClick={() => handleAction(alert.id, "TAKE_DOWN_LISTING")}
                      className="flex-1 md:flex-initial px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-bold rounded-xl transition shadow-sm whitespace-nowrap disabled:cursor-not-allowed"
                    >
                      {actionLoadingId === `${alert.id}-TAKE_DOWN_LISTING` ? "Processing..." : "Take Down Listing"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={actionLoadingId === `${alert.id}-BAN_USER`}
                      onClick={() => handleAction(alert.id, "BAN_USER")}
                      className="flex-1 md:flex-initial px-4 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-bold rounded-xl transition shadow-sm whitespace-nowrap disabled:cursor-not-allowed"
                    >
                      {actionLoadingId === `${alert.id}-BAN_USER` ? "Processing..." : "Restrict Account"}
                    </button>
                  )}
                  
                  <button
                    type="button"
                    disabled={actionLoadingId === `${alert.id}-WARN_USER`}
                    onClick={() => handleAction(alert.id, "WARN_USER")}
                    className="flex-1 md:flex-initial px-4 py-2.5 bg-white border border-[#d6e0ca] hover:bg-amber-50 text-amber-800 text-xs font-bold rounded-xl transition whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {actionLoadingId === `${alert.id}-WARN_USER` ? "Sending..." : "Issue Warning"}
                  </button>
                  <button
                    type="button"
                    disabled={actionLoadingId === `${alert.id}-DISMISS_ALERT`}
                    onClick={() => handleAction(alert.id, "DISMISS_ALERT")}
                    className="flex-1 md:flex-initial px-4 py-2.5 bg-white border border-[#edf1e6] hover:bg-[#fafdf6] text-[#5f6d5b] text-xs font-medium rounded-xl transition whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {actionLoadingId === `${alert.id}-DISMISS_ALERT` ? "Dismissing..." : "Dismiss Flag"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}