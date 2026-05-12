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
