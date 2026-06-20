import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import WalletPanel from "../components/WalletPanel";
import { getCurrentUserFromStorage } from "../lib/auth";
import { apiRequest } from "../lib/api";
import { fetchWalletSummary } from "../lib/wallet";
import { navigateTo } from "../lib/navigation";

function RemoteFoodImage({ src, alt, className, fallbackClassName = "" }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`flex items-center justify-center bg-[#eef4e8] text-[#8c9b88] ${fallbackClassName}`}>
        <span className="material-symbols-outlined">lunch_dining</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
    />
  );
}

export default function VendorListingDashboard() {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const [listings, setListings] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [wallet, setWallet] = useState({
    balance: { amount: 0, formatted: "RM 0.00" },
    transactions: [],
  });
  const [listingImageFile, setListingImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [state, setState] = useState({
    submitting: false,
    loading: false,
    error: "",
    success: false,
  });

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "DISCOUNTED",
    originalPrice: "",
    unitPrice: "",
    quantity: "1",
    location: currentUser?.location || "",
    expiryHours: "4",
    imageUrl: "",
  });

  const loadVendorData = async () => {
    try {
      const [listingData, vendorOrdersResponse] = await Promise.all([
        apiRequest("/vendor/listings", { method: "GET" }),
        apiRequest("/vendor/orders", { method: "GET" }),
      ]);

      // SAFE FALLBACK EXTRACTION MATCHING YOUR BACKEND ARCHITECTURE
      const listingsArray = listingData?.listings || listingData?.data?.listings || [];
      const ordersArray = vendorOrdersResponse?.orders || vendorOrdersResponse?.data?.orders || [];

      setListings(listingsArray);
      setRecentOrders(ordersArray.slice(0, 3));
    } catch (err) {
      console.error("Data streams connection sync error:", err.message);
    }

    try {
      const walletResponse = await fetchWalletSummary();
      setWallet(walletResponse?.data || {
        balance: { amount: 0, formatted: "RM 0.00" },
        transactions: [],
      });
    } catch (walletError) {
      console.error("Failed to load vendor wallet:", walletError.message);
      setWallet({
        balance: { amount: 0, formatted: "RM 0.00" },
        transactions: [],
      });
    }
  };

  // Security Gate & Data Fetching
  useEffect(() => {
    if (!currentUser) {
      navigateTo("/login");
      return;
    }
    if (!["VENDOR", "MERCHANT", "ADMIN"].includes(currentUser.role)) {
      navigateTo("/");
      return;
    }

    loadVendorData();

    const intervalId = window.setInterval(loadVendorData, 15000);
    return () => window.clearInterval(intervalId);
  }, [currentUser]);

  useEffect(() => {
    if (!listingImageFile) {
      setImagePreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(listingImageFile);
    setImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [listingImageFile]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const buildPayload = () => {
    const payload = new FormData();
    payload.append("title", formData.title.trim());
    payload.append("description", formData.description.trim());
    payload.append("type", formData.type);
    payload.append("quantity", String(Number(formData.quantity)));
    payload.append(
      "unitPrice",
      String(formData.type === "DISCOUNTED" ? Math.round(Number(formData.unitPrice) * 100) : 0)
    );
    payload.append(
      "expiryAt",
      new Date(Date.now() + Number(formData.expiryHours) * 60 * 60 * 1000).toISOString()
    );
    payload.append("location", formData.location.trim());

    if (formData.imageUrl.trim()) {
      payload.append("imageUrl", formData.imageUrl.trim());
    }

    if (listingImageFile) {
      payload.append("listingImage", listingImageFile);
    }

    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setState((prev) => ({ ...prev, submitting: true, error: "", success: false }));

    try {
      await apiRequest("/listings", {
        method: "POST",
        body: buildPayload(),
      });

      setState((prev) => ({ ...prev, submitting: false, success: true }));
      
      // Clear data fields correctly
      setFormData({
        title: "",
        description: "",
        type: "DISCOUNTED",
        originalPrice: "",
        unitPrice: "",
        quantity: "1",
        location: currentUser?.location || "",
        expiryHours: "4",
        imageUrl: "",
      });
      setListingImageFile(null);

      // Instantly trigger re-pull so the right sidebar panel reflects items right away
      await loadVendorData();

      setTimeout(() => setState((prev) => ({ ...prev, success: false })), 4000);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        submitting: false,
        error: err.message || "Failed to publish listing. Verify the details and try again.",
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10 grid gap-8 lg:grid-cols-3">
        
        {/* LEFT & CENTER COLUMNS: Welcome & Publishing Workspace */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Welcome Dashboard Header Section */}
          <section className="overflow-hidden rounded-[2.5rem] border border-[#e6ebda] bg-[linear-gradient(135deg,#fff9ef_0%,#f5fbe9_48%,#eef7ff_100%)] p-8 shadow-level-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-1.5 font-sans text-3xl font-bold">
                  <span className="text-black">Hello</span>
                  <span className="text-[#F2994A]">
                    {currentUser?.businessName || currentUser?.name?.split(" ")[0] || "Vendor"} !
                  </span>
                </div>
                <h1 className="font-display text-[clamp(1.8rem,3vw,2.4rem)] leading-tight text-[#1d3720]">
                  Vendor Dashboard
                </h1>
                <p className="mt-2 text-sm text-[#53604a]">
                  Publish surplus stock below and manage your current listings, wallet activity, and recent orders from one place.
                </p>
              </div>
              <div className="hidden md:block">
                <span className="material-symbols-outlined text-[72px] text-[#f2994a]/20 select-none">
                  set_meal
                </span>
              </div>
            </div>
          </section>

          {/* Action Feedbacks */}
          {state.success && (
            <div className="rounded-2xl bg-green-50 border border-green-100 p-4 text-green-800 text-sm flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
              Listing published successfully.
            </div>
          )}
          {state.error && (
            <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-red-700 text-sm flex items-center gap-2 font-medium">
              <span className="material-symbols-outlined text-red-600">error</span>
              {state.error}
            </div>
          )}

          <WalletPanel
            title="Vendor Wallet"
            subtitle="Completed paid orders automatically credit your wallet. Donation-only orders will not add vendor earnings."
            wallet={wallet}
            onWalletUpdated={setWallet}
            accentClassName="bg-[#fff4df] text-[#8c5d17] border-[#f0d9b3]"
          />

          {/* Core Input Creation Form Panel */}
          <form onSubmit={handleSubmit} className="rounded-[2.5rem] border border-surface-container-high bg-white p-8 shadow-level-1 space-y-6">
            <h2 className="text-xl font-bold text-[#1d3720]">Publish New Surplus Item</h2>
            
            {/* Strategy Selectors */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className={`flex p-4 rounded-2xl border transition-all cursor-pointer items-start gap-3 ${formData.type === "DISCOUNTED" ? "border-[#f2994a] bg-[#fffbf4]" : "border-[#e7eddc] bg-[#fbfdf8]"}`}>
                <input type="radio" name="type" value="DISCOUNTED" checked={formData.type === "DISCOUNTED"} onChange={handleInputChange} className="mt-1 accent-[#f2994a]" />
                <div>
                  <span className="text-sm font-bold text-[#1d301e] block">Commercial Discount</span>
                  <span className="text-xs text-[#687664] mt-0.5">Sell fast at 50% cuts or lower to the public.</span>
                </div>
              </label>

              <label className={`flex p-4 rounded-2xl border transition-all cursor-pointer items-start gap-3 ${formData.type === "DONATION" ? "border-[#42643f] bg-[#f4fae8]" : "border-[#e7eddc] bg-[#fbfdf8]"}`}>
                <input type="radio" name="type" value="DONATION" checked={formData.type === "DONATION"} onChange={handleInputChange} className="mt-1 accent-[#42643f]" />
                <div>
                  <span className="text-sm font-bold text-[#1d301e] block">NGO Donation</span>
                  <span className="text-xs text-[#687664] mt-0.5">Completely free for registered non-profit groups.</span>
                </div>
              </label>
            </div>

            {/* Inputs Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-bold uppercase text-[#576455]">Food Batch Title</span>
                <input required name="title" value={formData.title} onChange={handleInputChange} className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-2.5 outline-none focus:border-[#f2994a]" placeholder="e.g., Assorted Pastries Box" />
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-bold uppercase text-[#576455]">Description & Allergens</span>
                <textarea required rows="2" name="description" value={formData.description} onChange={handleInputChange} className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-2.5 outline-none focus:border-[#f2994a] resize-none" placeholder="Portion details, allergens callouts..." />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase text-[#576455]">Quantity</span>
                <input required type="number" min="1" name="quantity" value={formData.quantity} onChange={handleInputChange} className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-2.5 outline-none focus:border-[#f2994a]" />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase text-[#576455]">Lifespan (Hours)</span>
                <select name="expiryHours" value={formData.expiryHours} onChange={handleInputChange} className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-2.5 outline-none focus:border-[#f2994a]">
                  <option value="2">2 Hours (Perishable)</option>
                  <option value="4">4 Hours (Standard)</option>
                  <option value="8">8 Hours (Full Shift)</option>
                  <option value="24">24 Hours (Next Day)</option>
                </select>
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase text-[#576455]">Original Price (RM)</span>
                <input type="number" min="0" step="0.01" name="originalPrice" value={formData.originalPrice} onChange={handleInputChange} placeholder="24.00" className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-2.5 outline-none focus:border-[#f2994a]" />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase text-[#576455]">Offer Price (RM)</span>
                <input required={formData.type === "DISCOUNTED"} disabled={formData.type === "DONATION"} type="number" min="0" step="0.01" name="unitPrice" value={formData.type === "DONATION" ? "" : formData.unitPrice} onChange={handleInputChange} placeholder={formData.type === "DONATION" ? "0.00 (Free)" : "12.00"} className={`rounded-xl border px-4 py-2.5 outline-none ${formData.type === "DONATION" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-[#fbfdf7] focus:border-[#f2994a]"}`} />
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-bold uppercase text-[#576455]">Pickup Location Details</span>
                <input required name="location" value={formData.location} onChange={handleInputChange} className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-2.5 outline-none focus:border-[#f2994a]" placeholder="Specific floor, room counter info..." />
              </label>

              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-xs font-bold uppercase text-[#576455]">Upload Food Image</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setListingImageFile(file);
                  }}
                  className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-2.5 text-sm outline-none file:mr-4 file:rounded-full file:border-0 file:bg-[#eef7e3] file:px-4 file:py-2 file:font-semibold file:text-primary hover:file:bg-[#e2f0cc]"
                />
              </label>

              <div className="sm:col-span-2 rounded-2xl border border-[#e7eddc] bg-[#fbfdf8] p-4">
                <p className="text-xs font-bold uppercase text-[#576455]">Image Preview</p>
                <div className="mt-3 flex items-center gap-4">
                  <div className="h-24 w-24 overflow-hidden rounded-2xl border border-[#d8e2d2] bg-white">
                    <RemoteFoodImage
                      src={imagePreviewUrl || formData.imageUrl}
                      alt={formData.title || "Food preview"}
                      className="h-full w-full object-cover"
                      fallbackClassName="h-full w-full"
                    />
                  </div>
                  <p className="max-w-md text-sm text-[#687664]">
                    Upload an image or paste an image URL to preview how your listing will look.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#edf3e4] flex justify-end">
              <button type="submit" disabled={state.submitting} className="px-6 py-3 rounded-xl bg-primary text-sm font-semibold text-white hover:bg-[#f59b27] transition shadow-sm disabled:opacity-50">
                {state.submitting ? "Publishing Item..." : "Launch Live Listing"}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT SIDEBAR COLUMN: Ongoing Tracking Panels */}
        <div className="space-y-6">
          {/* Active Inventory Monitoring Widget */}
          <div className="rounded-[2rem] border border-surface-container-high bg-white p-6 shadow-level-1">
            <h3 className="font-sans text-md font-bold text-[#1d3720] border-b border-[#edf3e4] pb-2 mb-4">
              Your Live Stock
            </h3>
            {listings.length === 0 ? (
              <p className="text-xs text-[#687664] py-4 text-center">No active listings at the moment.</p>
            ) : (
              <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                {listings.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-[#fbfdf8] border border-[#edf3e4]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-12 w-12 overflow-hidden rounded-xl border border-[#e0e8d7] bg-white flex-shrink-0">
                        <RemoteFoodImage
                          src={item.imageUrl}
                          alt={item.title}
                          className="h-full w-full object-cover"
                          fallbackClassName="h-full w-full"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-[#1d301e] truncate max-w-[140px]">{item.title}</h4>
                        <p className="text-[10px] text-gray-500">Qty: {item.quantity} Remaining</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.type === "DONATION" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                      {item.type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Requests Tracking Widget */}
          <div className="rounded-[2rem] border border-surface-container-high bg-white p-6 shadow-level-1">
            <h3 className="font-sans text-md font-bold text-[#1d3720] border-b border-[#edf3e4] pb-2 mb-4">
              Recent Orders
            </h3>
            {recentOrders.length === 0 ? (
              <p className="text-xs text-[#687664] py-4 text-center">
                No customer or NGO orders have been placed on your listings yet.
              </p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-xl border border-[#edf3e4] bg-[#fbfdf8] p-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-[#1d301e]">
                          {order.customer?.name || "Customer"}
                        </p>
                        <p className="mt-1 text-[11px] text-[#687664]">
                          {order.customer?.role || "USER"} · {order.vendorItemCount} item{order.vendorItemCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#eef7e3] px-2 py-0.5 text-[10px] font-bold text-primary">
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-2 text-[11px] text-[#4f5d4b]">
                      {order.vendorSubtotal?.formatted || "RM 0.00"} · {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
}