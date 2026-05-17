import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { clearAuth, getToken } from "../lib/auth";
import { apiRequest } from "../lib/api";
import { navigateTo } from "../lib/navigation";

export default function CurrentUserPage() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    user: null,
  });

  useEffect(() => {
    const token = getToken();

    if (!token) {
      navigateTo("/login");
      return;
    }

    apiRequest("/auth/me", { token })
      .then((response) => {
        setState({
          loading: false,
          error: "",
          user: response.data.user,
        });
      })
      .catch((error) => {
        clearAuth();
        setState({
          loading: false,
          error: error.message,
          user: null,
        });
      });
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-white rounded-[2rem] shadow-lg p-8 border border-surface-container-high">
          <h1 className="font-h1 text-h1 text-on-surface mb-4">My Account</h1>

          {state.loading && (
            <p className="font-body-md text-body-md text-on-surface-variant">
              Loading your account details...
            </p>
          )}
          {state.error && (
            <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3">
              {state.error}
            </div>
          )}

          {state.user && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <InfoCard label="Name" value={state.user.name} />
                <InfoCard label="Email" value={state.user.email} />
                <InfoCard label="Role" value={state.user.role} />
                <InfoCard
                  label="Approval Status"
                  value={state.user.approvalStatus || "APPROVED"}
                />
                <InfoCard
                  label="Created At"
                  value={new Date(state.user.createdAt).toLocaleString()}
                />
                <InfoCard
                  label="Approved At"
                  value={
                    state.user.approvedAt
                      ? new Date(state.user.approvedAt).toLocaleString()
                      : "Not approved yet"
                  }
                />
              </div>

              {["INDIVIDUAL", "NGO"].includes(state.user.role) && (
                <div className="mt-8 rounded-[1.8rem] border border-[#e7eddc] bg-[linear-gradient(135deg,#fff9ef_0%,#f5fbe8_50%,#eef7ff_100%)] p-6">
                  <p className="font-label-md text-label-md uppercase tracking-[0.18em] text-[#6f7f6c]">
                    Recipient Marketplace
                  </p>
                  <h2 className="mt-3 font-h2 text-h2 text-[#213722]">
                    Ready to browse and order food listings
                  </h2>
                  <p className="mt-3 max-w-2xl text-body-md text-[#5f6d5b]">
                    Individuals can access discounted food. NGOs can access donation food and only pay delivery when delivery is selected.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigateTo("/marketplace")}
                      className="rounded-full bg-primary px-5 py-3 font-label-md text-label-md text-white transition hover:bg-[#f59b27]"
                    >
                      Open Marketplace
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo("/marketplace/orders")}
                      className="rounded-full border border-[#d6e0ca] bg-white px-5 py-3 font-label-md text-label-md text-[#264027] transition hover:bg-[#f6faef]"
                    >
                      Track Order Status
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-surface p-5 border border-surface-container-high">
      <p className="font-label-md text-label-md uppercase text-on-surface-variant mb-2">
        {label}
      </p>
      <p className="font-body-md text-body-lg text-on-surface break-words">
        {value || "-"}
      </p>
    </div>
  );
}
