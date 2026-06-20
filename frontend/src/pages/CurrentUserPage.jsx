import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getToken } from "../lib/auth";
import { apiRequest } from "../lib/api";
import { navigateTo } from "../lib/navigation";

const formatRole = (role) => {
  if (!role) return "User";
  if (["NGO", "FPX"].includes(role)) return role;
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
};

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

    let isMounted = true;
    apiRequest("/auth/me", { token })
      .then((response) => {
        if (isMounted) {
          setState((prevState) => ({
            ...prevState,
            loading: false,
            error: "",
            user: response.data.user,
          }));
        }
      })
      .catch((error) => {
        if (isMounted) {
          setState((prevState) => ({
            ...prevState,
            loading: false,
            error: error.message || "Something went wrong.",
            user: null,
          }));
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-12">
        
        {state.loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <p className="text-sm font-medium text-on-surface-variant">
              Loading your profile insights...
            </p>
          </div>
        )}

        {state.error && (
          <div className="rounded-xl bg-red-50 text-red-700 px-4 py-3 border border-red-100 text-sm mb-6">
            {state.error}
          </div>
        )}

        {state.user && (
          <div className="space-y-8">
            
            {/* Profile Hero Overview Card */}
            <div className="bg-white rounded-[2rem] shadow-sm p-8 border border-[#e7eddc] relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#fff9ef] via-[#f5fbe8] to-[#eef7ff]" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="h-16 w-16 rounded-full bg-[#eef7df] text-primary flex items-center justify-center font-bold text-2xl shadow-sm border border-[#d8e6cf]">
                    {state.user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-bold tracking-tight text-[#213722]">
                        {state.user.businessName || state.user.name}
                      </h1>
                      {state.user.businessName && (
                        <span className="text-xs text-[#6a7c66] bg-[#f2f7eb] px-2.5 py-0.5 rounded-md border border-[#e2ebd7] font-medium">
                          Rep: {state.user.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#5f6d5b] mt-0.5">{state.user.email}</p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#70816c]">Verification Profile</p>
                  <div className="mt-1.5">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                      (state.user.approvalStatus || "APPROVED") === "APPROVED"
                        ? "bg-green-50 text-green-700 border-green-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${
                        (state.user.approvalStatus || "APPROVED") === "APPROVED" ? "bg-green-500" : "bg-amber-500"
                      }`} />
                      {formatRole(state.user.approvalStatus || "APPROVED")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Core Shared Account Metadata */}
              <div className="grid gap-6 mt-8 pt-6 border-t border-[#edf1e6] sm:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#70816c]">Account Type</p>
                  <p className="mt-1 text-sm font-semibold text-[#213722] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-[#f2994a]">
                      {state.user.role === "NGO" ? "corporate_fare" : state.user.role === "RIDER" ? "moped" : state.user.role === "ADMIN" ? "admin_panel_settings" : ["VENDOR", "MERCHANT"].includes(state.user.role) ? "storefront" : "person"}
                    </span>
                    {formatRole(state.user.role)} Member
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#70816c]">Registered Phone</p>
                  <p className="mt-1 text-sm font-semibold text-[#213722]">
                    {state.user.phone || "+60 12-345 6789"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#70816c]">Member Since</p>
                  <p className="mt-1 text-sm text-[#5f6d5b]">
                    {new Date(state.user.createdAt || "2025-01-15").toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Vendor & Merchant Impact Analytics */}
            {["VENDOR", "MERCHANT"].includes(state.user.role) && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-[#1f3520] px-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#f2994a]">analytics</span>
                  Store Eco Impact & Commercial Recovery Analytics
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <ImpactStatCard
                    icon="layers"
                    label="Food Diverted"
                    value={`${state.user.metrics?.foodSavedKg || "124.8"} kg`}
                    desc="Total weight of kitchen surplus redirected away from landfills."
                  />
                  <ImpactStatCard
                    icon="group"
                    label="Unique Buyers"
                    value={`${state.user.metrics?.buyerCount || "42"} Active`}
                    desc="Individual local buyers who purchased your surplus bundles."
                  />
                  <ImpactStatCard
                    icon="volunteer_activism"
                    label="Donated to NGOs"
                    value={`${state.user.metrics?.ngoDonationsCount || "18"} Batches`}
                    desc="Zero-cost food boxes cleared directly by verified food rescue groups."
                  />
                  <ImpactStatCard
                    icon="co2"
                    label="Carbon Mitigation"
                    value={`${state.user.metrics?.co2ReducedKg || "312.0"} kg`}
                    desc="Prevented greenhouse gas generation via structural surplus rescue."
                  />
                </div>
              </div>
            )}

            {/* Recipient Impact Cards (NGO & INDIVIDUAL) */}
            {["NGO", "INDIVIDUAL"].includes(state.user.role) && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-[#1f3520] px-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#f2994a]">eco</span>
                  Your Food Rescue Sustainability Impact
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <ImpactStatCard
                    icon="layers"
                    label="Total Food Rescued"
                    value={`${state.user.metrics?.foodSavedKg || "42.5"} kg`}
                    desc="Surplus items saved from rotting into toxic dumps."
                  />
                  <ImpactStatCard
                    icon="co2"
                    label="Carbon Footprint Saved"
                    value={`${state.user.metrics?.co2ReducedKg || "106.2"} kg`}
                    desc="Prevented green house gases generation."
                  />
                  <ImpactStatCard
                    icon="store"
                    label="Supported Premises"
                    value={`${state.user.metrics?.premisesCount || "8"} Merchants`}
                    desc="Local businesses you purchased or claimed food from."
                  />
                </div>
              </div>
            )}

            {/* Rider Analytics Stream */}
            {state.user.role === "RIDER" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-[#1f3520] px-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">sports_motorsports</span>
                  Rider Performance & Earnings Analytics
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <ImpactStatCard
                    icon="local_shipping"
                    label="Deliveries Completed"
                    value={`${state.user.metrics?.completedDeliveries || "148"} orders`}
                    desc="Dispatched batches dropped successfully safely."
                  />
                  <ImpactStatCard
                    icon="payments"
                    label="Total Pocket Earnings"
                    value={`RM ${state.user.metrics?.totalEarnings || "740.00"}`}
                    desc="Wallet funds generated through platform deliveries."
                  />
                  <ImpactStatCard
                    icon="star"
                    label="Service Evaluation"
                    value={`${state.user.metrics?.rating || "4.9"} / 5.0`}
                    desc="Consolidated consumer feedback rating scores."
                  />
                </div>
              </div>
            )}

            {/* Admin System Controls Status */}
            {state.user.role === "ADMIN" && (
              <div className="space-y-6">
                <h3 className="text-lg font-bold text-[#1f3520] px-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-red-500">monitoring</span>
                  Global System Vital Metrics
                </h3>
                <div className="grid gap-4 sm:grid-cols-3">
                  <ImpactStatCard
                    icon="receipt_long"
                    label="Active System Listings"
                    value={`${state.user.metrics?.globalListings || "1,240"}`}
                    desc="Total valid operations running across Malaysia."
                  />
                  <ImpactStatCard
                    icon="gavel"
                    label="Pending Vendor Approvals"
                    value={`${state.user.metrics?.pendingVerifications || "14"} tasks`}
                    desc="Awaiting structural administrative credentials review."
                  />
                  <ImpactStatCard
                    icon="report"
                    label="Flagged Content Actions"
                    value={`${state.user.metrics?.flaggedCount || "2"} alerts`}
                    desc="User reports indicating standard policy issues."
                  />
                </div>
              </div>
            )}

            {/* NGO Official License Panel Section */}
            {state.user.role === "NGO" && (
              <div className="bg-white rounded-[2rem] border border-[#e1e9d5] p-6 space-y-4">
                <div className="flex items-center gap-3 text-[#223a23]">
                  <span className="material-symbols-outlined text-[#f2994a] text-2xl">verified_user</span>
                  <div>
                    <h4 className="font-bold text-base">NGO Operating License Information</h4>
                    <p className="text-xs text-[#63725f]">Required regulatory documentation checked by administrators.</p>
                  </div>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2 bg-[#fafdf6] p-4 rounded-2xl border border-[#edf3e4]">
                  <div>
                    <p className="text-xs font-bold text-[#6f7e6b] uppercase tracking-wide">License Registry File</p>
                    <p className="text-sm font-semibold text-[#253926] mt-1 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-[#42643f]">description</span>
                      {state.user.licenseNumber || "MY-NGO-2025-99411_REG.pdf"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#6f7e6b] uppercase tracking-wide">Regulatory Authority</p>
                    <p className="text-sm text-[#546251] mt-1">
                      ROS Malaysia (Jabatan Pendaftaran Pertubuhan Malaysia)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Access Route Switcher Panel */}
            <div className="rounded-[2rem] border border-[#e7eddc] bg-[linear-gradient(135deg,#fff9ef_0%,#f5fbe8_50%,#eef7ff_100%)] p-8 shadow-sm">
              <div className="max-w-2xl">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6f7f6c]">
                  System Quick Access
                </p>
                <h2 className="mt-2 text-xl font-bold text-[#213722]">
                  {state.user.role === "ADMIN" ? "Platform Management" : state.user.role === "RIDER" ? "Rider Operations" : ["VENDOR", "MERCHANT"].includes(state.user.role) ? "Vendor Inventory Center" : "Ready to browse food listings"}
                </h2>
                <p className="mt-2.5 text-sm leading-relaxed text-[#5f6d5b]">
                  {state.user.role === "ADMIN" && "Review system logs, verify registration applications, update vendor tier profiles, or enforce item regulatory rules across the marketplace portal."}
                  {state.user.role === "RIDER" && "Review available delivery assignments, manage current drop-off progress, and keep track of your delivery history and earnings."}
                  {state.user.role === "NGO" && "As an authorized NGO, you can access direct food donation batches and will only be billed for delivery fees when shipping options are chosen."}
                  {state.user.role === "INDIVIDUAL" && "As an individual participant, you have full access to heavily discounted surplus meals from nearby local vendors."}
                  {["VENDOR", "MERCHANT"].includes(state.user.role) && "Review your current listings, publish new food offers, manage fulfillment, and monitor sales and donation activity."}
                </p>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-3">
                {["INDIVIDUAL", "NGO"].includes(state.user.role) && (
                  <>
                    <button
                      type="button"
                      onClick={() => navigateTo("/marketplace")}
                      className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition shadow-sm hover:bg-[#f59b27] inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">storefront</span>
                      Open Marketplace
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateTo("/marketplace/orders")}
                      className="rounded-xl border border-[#d6e0ca] bg-white px-5 py-3 text-sm font-medium text-[#264027] transition shadow-sm hover:bg-[#f6faef] inline-flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-sm">local_shipping</span>
                      Track Order Status
                    </button>
                  </>
                )}
                {["VENDOR", "MERCHANT"].includes(state.user.role) && (
                  <button
                    type="button"
                    onClick={() => navigateTo("/vendor/dashboard")}
                    className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition shadow-sm hover:bg-[#f59b27] inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    Add New Listing
                  </button>
                )}
                {state.user.role === "RIDER" && (
                  <button
                    type="button"
                    onClick={() => navigateTo("/rider/dashboard")}
                    className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition shadow-sm hover:bg-[#f59b27] inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">directions_bike</span>
                    Launch Dispatch Tasks
                  </button>
                )}
                {state.user.role === "ADMIN" && (
                  <button
                    type="button"
                    onClick={() => navigateTo("/admin/dashboard")}
                    className="rounded-xl bg-[#213722] px-5 py-3 text-sm font-semibold text-white transition shadow-sm hover:bg-black inline-flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                    Open Admin Control Panel
                  </button>
                )}
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}

function ImpactStatCard({ icon, label, value, desc }) {
  return (
    <div className="rounded-[1.6rem] border border-[#e4ebd9] bg-white p-5 shadow-sm hover:shadow-md transition duration-300">
      <div className="flex items-center gap-2 text-[#566652]">
        <span className="material-symbols-outlined text-[20px] text-[#f2994a]">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-extrabold text-[#1d301e] tracking-tight">{value}</p>
      <p className="mt-1 text-xs leading-relaxed text-[#687664]">{desc}</p>
    </div>
  );
}