import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { apiRequest } from "../lib/api";
import { navigateTo } from "../lib/navigation";
import { getToken } from "../lib/auth";

export default function AdminControlPanel() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Seeded with realistic sample alerts as fallback data
  const [alerts, setAlerts] = useState([
    {
      id: "alert-mock-1",
      severity: "HIGH",
      targetType: "LISTING",
      targetName: "Premium Medical Supplies Bulk",
      issueTitle: "Prohibited Item Category",
      description: "This listing contains restricted prescription items violating section 4.2 of our community distribution guidelines. Distribution requires official verified NGO credentials.",
      reporterName: "System Flag (Automated Keyword)",
      timeAgo: "14 minutes ago"
    },
    {
      id: "alert-mock-2",
      severity: "MEDIUM",
      targetType: "INDIVIDUAL",
      targetName: "Marcus Vance (Driver ID: #8841)",
      issueTitle: "Spam / Recurrent Delivery Cancellations",
      description: "User has accepted and subsequently dropped 4 dispatch assignments within a 2-hour window, breaching standard delivery operator fulfillment rates.",
      reporterName: "Logistics Engine Monitor",
      timeAgo: "2 hours ago"
    }
  ]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); 

  // 1. Client-Side Guard & User Profile Synchronizer
  useEffect(() => {
    const token = getToken();

    if (!token) {
      navigateTo("/login");
      return;
    }

    let isMounted = true;

    apiRequest("/auth/me", { token })
      .then((response) => {
        if (isMounted) {
          const fetchedUser = response.data.user;
          setUser(fetchedUser);
          setAuthLoading(false);

          // If the profile returns but they aren't an admin, safely redirect them
          if (!fetchedUser || fetchedUser.role !== "ADMIN") {
            navigateTo("/me");
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setAuthLoading(false);
          navigateTo("/login");
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Violation Stream
  useEffect(() => {
    if (user?.role === "ADMIN") {
      apiRequest("/admin/alerts")
        .then((res) => {
          // If the server returns production data, use that instead of our placeholders
          if (res.data && res.data.alerts) {
            setAlerts(res.data.alerts);
          }
          setLoading(false);
        })
        .catch(() => {
          // If API fails or is not ready yet, keep sample logs so UI doesn't look blank
          setLoading(false);
        });
    }
  }, [user]);

  const handleAction = async (alertId, actionType) => {
    if (actionType === "BAN_USER" && !confirm("Are you sure you want to ban this actor?")) return;

    try {
      // Mock resolution local update for sample cards
      if (alertId.startsWith("alert-mock-")) {
        setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
        return;
      }

      await apiRequest(`/admin/alerts/${alertId}/resolve`, { action: actionType });
      setAlerts((prev) => prev.filter((alert) => alert.id !== alertId));
    } catch (err) {
      alert("Failed to execute moderation action. Please try again.");
    }
  };

  const filteredAlerts = alerts.filter(
    (alert) => filter === "ALL" || alert.targetType === filter
  );

  if (authLoading || (user && loading)) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
      </div>
    );
  }

  if (user?.role !== "ADMIN") return null;

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-12">
        
        {/* Header Breadcrumb & Title */}
        <div className="mb-8">
          <button 
            type="button"
            onClick={() => navigateTo("/me")} 
            className="text-xs font-bold uppercase tracking-wider text-[#70816c] hover:text-[#213722] inline-flex items-center gap-1.5 transition border border-[#edf1e6] hover:border-[#ccd7c7] px-3 py-1.5 rounded-xl bg-white shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span> 
            Back to Profile
          </button>
          <h1 className="text-3xl font-bold text-[#213722] tracking-tight mt-4">
            System Control & Moderation Deck
          </h1>
          <p className="text-sm text-[#5f6d5b] mt-1">
            Enforce safety compliance, review flagged actors, and resolve marketplace listing violations.
          </p>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-[#edf1e6] pb-4">
          {["ALL", "RIDER", "NGO", "INDIVIDUAL", "LISTING"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filter === type
                  ? "bg-[#213722] text-white shadow-sm"
                  : "bg-white text-[#5f6d5b] border border-[#edf1e6] hover:bg-[#fafdf6]"
              }`}
            >
              {type === "ALL" ? "All Alerts" : `${type} Flags`}
            </button>
          ))}
        </div>

        {/* Alert Queue Stream */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <p className="text-sm font-medium text-on-surface-variant">
              Loading active violation pipeline...
            </p>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-[#edf1e6] p-12 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eef7df] text-primary mb-4">
              <span className="material-symbols-outlined text-2xl">verified</span>
            </div>
            <p className="text-base font-bold text-[#213722]">Workspace Clear</p>
            <p className="text-sm text-[#5f6d5b] max-w-xs mx-auto mt-1">
              No pending flags or critical policy violations detected.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div 
                key={alert.id} 
                className="bg-white rounded-[2rem] border border-[#e7eddc] p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden"
              >
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                  alert.severity === "HIGH" ? "bg-red-500" : "bg-amber-500"
                }`} />

                {/* Left Side: Offender Details */}
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${
                      alert.severity === "HIGH" 
                        ? "bg-red-50 text-red-700 border-red-100" 
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    }`}>
                      {alert.severity} RISK
                    </span>
                    <span className="text-xs font-bold text-[#70816c] uppercase tracking-wider">
                      Target: {alert.targetType} ({alert.targetName})
                    </span>
                  </div>

                  <h3 className="font-bold text-lg text-[#213722] tracking-tight">{alert.issueTitle}</h3>
                  <p className="text-sm text-[#5f6d5b] leading-relaxed">{alert.description}</p>
                  
                  <div className="text-xs text-[#70816c] pt-1 flex items-center gap-2">
                    <span>Reported by: <strong className="text-[#3d523e]">{alert.reporterName}</strong></span>
                    <span>&bull;</span>
                    <span>Timeline: {alert.timeAgo}</span>
                  </div>
                </div>

                {/* Right Side: Adaptive Action Controls */}
                <div className="flex flex-row md:flex-col gap-2 shrink-0 justify-end w-full md:w-auto">
                  {alert.targetType === "LISTING" ? (
                    <button
                      type="button"
                      onClick={() => handleAction(alert.id, "SUSPEND_LISTING")}
                      className="flex-1 md:flex-initial px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-sm whitespace-nowrap"
                    >
                      Take Down Listing
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAction(alert.id, "BAN_USER")}
                      className="flex-1 md:flex-initial px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition shadow-sm whitespace-nowrap"
                    >
                      Restrict Account
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => handleAction(alert.id, "WARN_USER")}
                    className="flex-1 md:flex-initial px-4 py-2.5 bg-white border border-[#d6e0ca] hover:bg-amber-50 text-amber-800 text-xs font-bold rounded-xl transition whitespace-nowrap"
                  >
                    Issue Warning
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAction(alert.id, "DISMISS_ALERT")}
                    className="flex-1 md:flex-initial px-4 py-2.5 bg-white border border-[#edf1e6] hover:bg-[#fafdf6] text-[#5f6d5b] text-xs font-medium rounded-xl transition whitespace-nowrap"
                  >
                    Dismiss Flag
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