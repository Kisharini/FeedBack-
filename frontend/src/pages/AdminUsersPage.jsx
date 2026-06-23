import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import { apiRequest, jsonRequest } from "../lib/api";
import { clearAuth, getCurrentUserFromStorage, getToken } from "../lib/auth";
import { navigateTo } from "../lib/navigation";

const roleOptions = ["ALL", "INDIVIDUAL", "NGO", "VENDOR", "RIDER", "ADMIN"];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
      })
    : "Unknown";

const getPrimaryLabel = (user) =>
  user.vendorBusinessName || user.ngoOrganizationName || user.name;

const getSecondaryDetails = (user) => {
  if (user.role === "VENDOR") {
    return user.vendorPlaceAddress || user.vendorContactPhone || "Vendor account";
  }

  if (user.role === "NGO") {
    return user.ngoAddress || user.ngoContactPhone || "NGO account";
  }

  if (user.role === "RIDER") {
    return user.riderVehiclePlateNumber || user.riderPhoneNumber || "Rider account";
  }

  return user.email;
};

export default function AdminUsersPage() {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [search, setSearch] = useState("");
  const [searchDraft, setSearchDraft] = useState("");
  const [state, setState] = useState({
    loading: true,
    error: "",
    counts: {
      ALL: 0,
      INDIVIDUAL: 0,
      NGO: 0,
      VENDOR: 0,
      RIDER: 0,
      ADMIN: 0
    },
    users: [],
    activeAction: ""
  });

  const loadUsers = async (role, searchValue) => {
    const token = getToken();

    if (!token) {
      navigateTo("/login");
      return;
    }

    const params = new URLSearchParams();

    if (role && role !== "ALL") {
      params.set("role", role);
    }

    if (searchValue.trim()) {
      params.set("search", searchValue.trim());
    }

    const path = params.toString() ? `/admin/users?${params.toString()}` : "/admin/users";

    try {
      const response = await apiRequest(path, { token });
      setState({
        loading: false,
        error: "",
        counts: response.data.counts,
        users: response.data.users,
        activeAction: ""
      });
    } catch (requestError) {
      if (/token|unauthorized|forbidden/i.test(requestError.message)) {
        clearAuth();
        navigateTo("/login");
        return;
      }

      setState((current) => ({
        ...current,
        loading: false,
        error: requestError.message || "Failed to load registered accounts."
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

    loadUsers(selectedRole, search);
  }, [currentUser, selectedRole, search]);

  const summaryCards = useMemo(
    () => roleOptions.map((role) => ({ role, value: state.counts[role] || 0 })),
    [state.counts]
  );

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setState((current) => ({
      ...current,
      loading: true,
      error: ""
    }));
    setSearch(searchDraft);
  };

  const handleAccountStatusChange = async (userId, accountStatus) => {
    const token = getToken();
    const actionKey = `${userId}:${accountStatus}`;

    setState((current) => ({
      ...current,
      activeAction: actionKey,
      error: ""
    }));

    try {
      await jsonRequest(`/admin/users/${userId}/status`, {
        method: "PATCH",
        token,
        body: {
          accountStatus
        }
      });

      await loadUsers(selectedRole, search);
    } catch (requestError) {
      if (/token|unauthorized|forbidden/i.test(requestError.message)) {
        clearAuth();
        navigateTo("/login");
        return;
      }

      setState((current) => ({
        ...current,
        activeAction: "",
        error: requestError.message || "Failed to update account status."
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-[2.5rem] border border-[#e6ebda] bg-[linear-gradient(135deg,#fff9ef_0%,#f5fbe9_48%,#eef7ff_100%)] p-8 shadow-level-2">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c7d69]">
              Registered Accounts
            </p>
            <h1 className="mt-2 font-display text-[clamp(2rem,3vw,2.8rem)] leading-tight text-[#1d3720]">
              Account Directory
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#53604a]">
              View all registered individuals, NGOs, vendors, riders, and admins across the platform.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigateTo("/admin/dashboard")}
                className="rounded-xl border border-[#d6e0ca] bg-white px-5 py-3 text-sm font-semibold text-[#264027] transition hover:bg-[#f6faef]"
              >
                Back To Admin Panel
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {summaryCards.map((item) => (
            <button
              key={item.role}
              type="button"
              onClick={() => {
                setState((current) => ({ ...current, loading: true, error: "" }));
                setSelectedRole(item.role);
              }}
              className={`rounded-[1.5rem] border p-5 text-left shadow-[0_10px_24px_rgba(92,103,70,0.05)] transition ${
                selectedRole === item.role
                  ? "border-[#213722] bg-[#213722] text-white"
                  : "border-[#e8eddc] bg-white text-[#1d3720] hover:border-[#b9d48f]"
              }`}
            >
              <p className={`text-xs font-bold uppercase tracking-[0.18em] ${selectedRole === item.role ? "text-white/75" : "text-[#70816c]"}`}>
                {item.role === "ALL" ? "All Users" : item.role}
              </p>
              <p className="mt-3 text-3xl font-extrabold tracking-tight">{item.value}</p>
            </button>
          ))}
        </section>

        <section className="mt-8 rounded-[2rem] border border-[#e8eddc] bg-white p-6 shadow-[0_10px_24px_rgba(92,103,70,0.05)]">
          <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 md:flex-row">
            <input
              type="text"
              value={searchDraft}
              onChange={(event) => setSearchDraft(event.target.value)}
              placeholder="Search by name, email, NGO, or business name"
              className="flex-1 rounded-xl border border-[#d6e0ca] bg-[#fcfdf9] px-4 py-3 text-sm outline-none transition focus:border-[#213722]"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#213722] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#162617]"
            >
              Search Accounts
            </button>
          </form>
        </section>

        {state.loading && (
          <div className="mt-8 rounded-[2rem] border border-[#e9efde] bg-white px-6 py-14 text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#dbe7ce] border-t-[#213722]" />
            <p className="mt-4 text-sm text-[#5b6757]">Loading registered accounts...</p>
          </div>
        )}

        {state.error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {!state.loading && !state.error && state.users.length === 0 && (
          <div className="mt-8 rounded-[2rem] border border-dashed border-[#d5dec8] bg-white px-6 py-14 text-center">
            <p className="text-h2 text-[#223623]">No accounts found</p>
            <p className="mt-3 text-body-md text-[#63705f]">
              Try a different role filter or a broader search term.
            </p>
          </div>
        )}

        {!state.loading && state.users.length > 0 && (
          <section className="mt-8 grid gap-5">
            {state.users.map((user) => (
              <article
                key={user.id}
                className="rounded-[2rem] border border-[#ebefdf] bg-white p-6 shadow-[0_12px_24px_rgba(92,103,70,0.05)]"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-bold text-[#1d3720]">{getPrimaryLabel(user)}</h2>
                      <span className="rounded-full border border-[#dce6d1] bg-[#f5f9ee] px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#496046]">
                        {user.role}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                          user.approvalStatus === "APPROVED"
                            ? "bg-green-50 text-green-700"
                            : user.approvalStatus === "REJECTED"
                              ? "bg-red-50 text-red-700"
                              : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {user.approvalStatus}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                          user.accountStatus === "BANNED"
                            ? "bg-red-100 text-red-800"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {user.accountStatus || "ACTIVE"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#5f6d5b]">{user.email}</p>
                    <p className="mt-1 text-sm text-[#63705f]">{getSecondaryDetails(user)}</p>
                  </div>

                  <div className="text-sm text-[#63705f] md:text-right">
                    <p>Joined {formatDate(user.createdAt)}</p>
                    <p className="mt-1">Updated {formatDate(user.updatedAt)}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 rounded-[1.5rem] border border-[#edf1e6] bg-[#fcfdf9] p-5 md:grid-cols-2 xl:grid-cols-4">
                  <DetailItem label="Full Name" value={user.name} />
                  <DetailItem label="Account Status" value={user.accountStatus || "ACTIVE"} />
                  <DetailItem label="Approval Notes" value={user.approvalNotes || "None"} />
                  <DetailItem
                    label="Organization / Business"
                    value={user.ngoOrganizationName || user.vendorBusinessName || "Not applicable"}
                  />
                  <DetailItem
                    label="Phone"
                    value={
                      user.ngoContactPhone ||
                      user.vendorContactPhone ||
                      user.riderPhoneNumber ||
                      "Not provided"
                    }
                  />
                  <DetailItem
                    label="Address"
                    value={
                      user.ngoAddress ||
                      user.vendorPlaceAddress ||
                      user.riderAddress ||
                      "Not provided"
                    }
                    fullWidth
                  />
                  {user.role === "RIDER" && (
                    <DetailItem
                      label="Vehicle"
                      value={[
                        user.riderVehicleType,
                        user.riderVehicleName,
                        user.riderVehiclePlateNumber
                      ]
                        .filter(Boolean)
                        .join(" - ") || "Not provided"}
                    />
                  )}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {user.accountStatus === "BANNED" ? (
                    <button
                      type="button"
                      disabled={Boolean(state.activeAction)}
                      onClick={() => handleAccountStatusChange(user.id, "ACTIVE")}
                      className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {state.activeAction === `${user.id}:ACTIVE` ? "Restoring..." : "Unban Account"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={Boolean(state.activeAction) || user.id === currentUser?.id}
                      onClick={() => handleAccountStatusChange(user.id, "BANNED")}
                      className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {state.activeAction === `${user.id}:BANNED` ? "Banning..." : user.id === currentUser?.id ? "Cannot Ban Self" : "Ban Account"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function DetailItem({ label, value, fullWidth = false }) {
  return (
    <div className={fullWidth ? "md:col-span-2 xl:col-span-4" : ""}>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#70816c]">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-[#223623]">{value}</p>
    </div>
  );
}
