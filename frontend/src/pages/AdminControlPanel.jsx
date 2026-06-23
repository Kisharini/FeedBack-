import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { apiRequest } from "../lib/api";
import { navigateTo } from "../lib/navigation";
import { clearAuth, getCurrentUserFromStorage, getToken } from "../lib/auth";

const actionClassNames = {
  danger:
    "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed",
  secondary:
    "border border-[#d6e0ca] bg-white text-amber-800 hover:bg-amber-50 disabled:opacity-60 disabled:cursor-not-allowed",
  ghost:
    "border border-[#edf1e6] bg-white text-[#5f6d5b] hover:bg-[#fafdf6] disabled:opacity-60 disabled:cursor-not-allowed",
  primary:
    "bg-[#213722] text-white hover:bg-[#162617] disabled:bg-[#415041] disabled:cursor-not-allowed"
};

const initialSummary = {
  pendingApprovals: 0,
  activeListings: 0,
  deliveryWatch: 0,
  unreadNotifications: 0,
  flaggedAlerts: 0
};

const formatTimeAgo = (value) => {
  if (!value) {
    return "just now";
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
};

export default function AdminControlPanel() {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const [state, setState] = useState({
    loading: true,
    actionLoadingId: "",
    error: "",
    summary: initialSummary,
    alerts: [],
    dismissedAlerts: {}
  });

  const visibleAlerts = useMemo(
    () => state.alerts.filter((alert) => !state.dismissedAlerts[alert.id]),
    [state.alerts, state.dismissedAlerts]
  );

  const loadDashboard = async () => {
    const token = getToken();

    if (!token) {
      navigateTo("/login");
      return;
    }

    try {
      const response = await apiRequest("/admin/dashboard", { token });
      setState((current) => ({
        ...current,
        loading: false,
        error: "",
        summary: response.data.summary,
        alerts: response.data.alerts
      }));
    } catch (requestError) {
      if (/token|unauthorized|forbidden/i.test(requestError.message)) {
        clearAuth();
        navigateTo("/login");
        return;
      }

      setState((current) => ({
        ...current,
        loading: false,
        error: requestError.message || "Failed to load admin control panel."
      }));
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigateTo("/login");
      return;
    }

    if (currentUser.role !== "ADMIN") {
      navigateTo("/");
      return;
    }

    loadDashboard();
  }, [currentUser]);

  const handleAction = async (alert, action) => {
    if (action.type === "OPEN_APPROVALS") {
      navigateTo("/admin/approvals");
      return;
    }

    const token = getToken();
    const actionKey = `${alert.id}-${action.type}`;

    setState((current) => ({
      ...current,
      actionLoadingId: actionKey,
      error: ""
    }));

    try {
      await apiRequest(`/admin/alerts/${encodeURIComponent(alert.id)}/action`, {
        method: "POST",
        token,
        body: JSON.stringify({ action: action.type }),
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (action.type === "DISMISS_ALERT") {
        setState((current) => ({
          ...current,
          dismissedAlerts: {
            ...current.dismissedAlerts,
            [alert.id]: true
          }
        }));
      } else {
        await loadDashboard();
      }
    } catch (requestError) {
      setState((current) => ({
        ...current,
        error: requestError.message || "Failed to process admin action."
      }));
    } finally {
      setState((current) => ({
        ...current,
        actionLoadingId: ""
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#e6ebda] bg-[linear-gradient(135deg,#fff9ef_0%,#f5fbe9_48%,#eef7ff_100%)] p-8 shadow-level-2">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c7d69]">
              Administration Panel
            </p>
            <h1 className="mt-2 font-display text-[clamp(2rem,3vw,2.8rem)] leading-tight text-[#1d3720]">
              Platform Management
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#53604a]">
              Review automated flags, pending registrations, listing compliance issues, and delayed delivery operations from one admin workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigateTo("/admin/approvals")}
                className="rounded-xl bg-[#213722] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#162617]"
              >
                Open Approval Queue
              </button>
              <button
                type="button"
                onClick={() => navigateTo("/admin/users")}
                className="rounded-xl border border-[#d6e0ca] bg-white px-5 py-3 text-sm font-semibold text-[#264027] transition hover:bg-[#f6faef]"
              >
                View Registered Accounts
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            label="Pending Approvals"
            value={state.summary.pendingApprovals}
            description="Accounts waiting for review"
          />
          <SummaryCard
            label="Active Listings"
            value={state.summary.activeListings}
            description="Live inventory across the marketplace"
          />
          <SummaryCard
            label="Delivery Watch"
            value={state.summary.deliveryWatch}
            description="Delivery orders still in progress"
          />
          <SummaryCard
            label="Unread Notifications"
            value={state.summary.unreadNotifications}
            description="User notifications still unread"
          />
          <SummaryCard
            label="Open Alerts"
            value={visibleAlerts.length}
            description="Items shown in this admin queue"
          />
        </section>

        {state.loading && (
          <div className="mt-8 rounded-[2rem] border border-[#e9efde] bg-white px-6 py-14 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#dbe7ce] border-t-[#213722]" />
            <p className="mt-4 text-sm text-[#5b6757]">Loading live admin operations...</p>
          </div>
        )}

        {state.error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {!state.loading && visibleAlerts.length === 0 ? (
          <div className="mt-8 rounded-[2rem] border border-dashed border-[#d5dec8] bg-white px-6 py-14 text-center">
            <p className="text-h2 text-[#223623]">All clear!</p>
            <p className="mt-3 text-body-md text-[#63705f]">
              No admin alerts currently require attention.
            </p>
          </div>
        ) : null}

        {!state.loading && visibleAlerts.length > 0 ? (
          <div className="mt-8 space-y-6">
            {visibleAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex flex-col justify-between gap-6 overflow-hidden rounded-[2rem] border border-[#ebefdf] bg-white p-6 shadow-[0_12px_24px_rgba(92,103,70,0.05)] md:flex-row md:items-start"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                        alert.severity === "HIGH"
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-amber-200 bg-amber-50 text-amber-700"
                      }`}
                    >
                      {alert.severity} Priority
                    </span>
                    <span className="text-xs font-medium text-[#70816c]">
                      Reported by {alert.reporterName} - {formatTimeAgo(alert.createdAt)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-[#1d3720]">{alert.issueTitle}</h3>
                    <p className="mt-1 text-sm font-semibold text-primary">
                      Target: {alert.targetName} ({alert.targetType})
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-[#5b6757]">{alert.description}</p>
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 self-stretch md:self-start">
                  {alert.actions.map((action) => {
                    const actionKey = `${alert.id}-${action.type}`;
                    const isLoading = state.actionLoadingId === actionKey;

                    return (
                      <button
                        key={action.type}
                        type="button"
                        disabled={Boolean(state.actionLoadingId)}
                        onClick={() => handleAction(alert, action)}
                        className={`flex-1 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition md:flex-initial ${
                          actionClassNames[action.variant] || actionClassNames.ghost
                        }`}
                      >
                        {isLoading ? "Processing..." : action.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  );
}

function SummaryCard({ label, value, description }) {
  return (
    <div className="rounded-[1.75rem] border border-[#e8eddc] bg-white p-5 shadow-[0_10px_24px_rgba(92,103,70,0.05)]">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#70816c]">{label}</p>
      <p className="mt-3 text-3xl font-extrabold tracking-tight text-[#1d3720]">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#63705f]">{description}</p>
    </div>
  );
}
