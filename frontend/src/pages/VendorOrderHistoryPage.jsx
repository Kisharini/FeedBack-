import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getCurrentUserFromStorage } from "../lib/auth";
import { apiRequest, jsonRequest } from "../lib/api";
import { navigateTo } from "../lib/navigation";

const statusCopy = {
  PAYMENT_CONFIRMED: "Payment Confirmed",
  READY_FOR_PICKUP: "Ready for Pickup",
  FINDING_RIDER: "Finding Rider",
  RIDER_ASSIGNED: "Rider Assigned",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  COMPLETED: "Completed",
};

const roleCopy = {
  INDIVIDUAL: "Customer",
  NGO: "NGO",
  VENDOR: "Vendor",
  ADMIN: "Admin",
};

const statusTone = {
  PAYMENT_CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  READY_FOR_PICKUP: "bg-amber-50 text-amber-700 border-amber-200",
  FINDING_RIDER: "bg-sky-50 text-sky-700 border-sky-200",
  RIDER_ASSIGNED: "bg-blue-50 text-blue-700 border-blue-200",
  OUT_FOR_DELIVERY: "bg-indigo-50 text-indigo-700 border-indigo-200",
  DELIVERED: "bg-violet-50 text-violet-700 border-violet-200",
  COMPLETED: "bg-slate-100 text-slate-700 border-slate-200",
};

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

export default function VendorOrderHistoryPage() {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const [state, setState] = useState({
    loading: true,
    error: "",
    orders: [],
    updatingOrderId: "",
  });

  useEffect(() => {
    if (!currentUser) {
      navigateTo("/login");
      return;
    }

    if (!["VENDOR", "ADMIN"].includes(currentUser.role)) {
      navigateTo("/");
      return;
    }

    const loadOrders = async () => {
      setState((current) => ({ ...current, loading: true, error: "" }));

      try {
        const response = await apiRequest("/vendor/orders", { method: "GET" });
        setState({
          loading: false,
          error: "",
          orders: response.data.orders || [],
          updatingOrderId: "",
        });
      } catch (error) {
        setState({
          loading: false,
          error: error.message || "Failed to load vendor order history.",
          orders: [],
          updatingOrderId: "",
        });
      }
    };

    loadOrders();
  }, [currentUser]);

  const handleConfirmPickup = async (orderId) => {
    try {
      setState((current) => ({
        ...current,
        error: "",
        updatingOrderId: orderId,
      }));

      await jsonRequest(`/vendor/orders/${orderId}/confirm-pickup`, {
        method: "POST",
        body: {},
      });

      const response = await apiRequest("/vendor/orders", { method: "GET" });
      setState((current) => ({
        ...current,
        orders: response.data.orders || [],
        updatingOrderId: "",
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error.message || "Failed to confirm pickup for this order.",
        updatingOrderId: "",
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#e6ebda] bg-[linear-gradient(135deg,#fff9ef_0%,#f5fbe9_48%,#eef7ff_100%)] p-8 shadow-level-2">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c7d69]">
                Vendor Overview
              </p>
              <h1 className="mt-2 font-display text-[clamp(2rem,3vw,2.8rem)] leading-tight text-[#1d3720]">
                Recent Orders on Your Listings
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#53604a]">
                Review the most recent customer and NGO orders placed against your live inventory,
                including who ordered, what they claimed, and the current fulfillment status.
              </p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/60 px-5 py-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-[#70816c]">Total Recent Orders</p>
              <p className="mt-1 text-3xl font-bold text-[#1d3720]">{state.orders.length}</p>
            </div>
          </div>
        </section>

        <section className="mt-8">
          {state.loading ? (
            <div className="rounded-[2rem] border border-[#e7eddc] bg-white p-10 text-center shadow-level-1">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
              <p className="mt-4 text-sm font-medium text-[#53604a]">Loading recent order activity...</p>
            </div>
          ) : state.error ? (
            <div className="rounded-[2rem] border border-red-100 bg-red-50 p-6 text-sm text-red-700 shadow-level-1">
              {state.error}
            </div>
          ) : state.orders.length === 0 ? (
            <div className="rounded-[2rem] border border-[#e7eddc] bg-white p-10 text-center shadow-level-1">
              <p className="text-lg font-bold text-[#1d3720]">No vendor orders yet</p>
              <p className="mt-2 text-sm text-[#657260]">
                Orders will appear here once customers or NGOs place claims on your listings.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {state.orders.map((order) => (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-[2rem] border border-[#e7eddc] bg-white shadow-level-1"
                >
                  <div className="border-b border-[#edf3e4] bg-[#fbfdf8] px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-lg font-bold text-[#1d3720]">Order #{order.id.slice(-8).toUpperCase()}</h2>
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone[order.status] || "bg-slate-100 text-slate-700 border-slate-200"}`}
                          >
                            {statusCopy[order.status] || order.status}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-[#5d6b58]">
                          Placed {formatDateTime(order.createdAt)} by {order.customer.name} ({roleCopy[order.customer.role] || order.customer.role})
                        </p>
                      </div>

                      <div className="grid gap-3 text-sm lg:min-w-[360px] lg:grid-cols-2">
                        <div className="rounded-2xl border border-[#e6edda] bg-white px-4 py-3 text-left shadow-sm">
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#73826e]">
                            Vendor Earnings Slice
                          </p>
                          <p className="mt-2 text-xl font-bold text-[#1d3720]">
                            {order.vendorSubtotal.formatted}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-[#e6edda] bg-white px-4 py-3 text-left shadow-sm">
                          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#73826e]">
                            Order Type
                          </p>
                          <p className="mt-2 text-xl font-bold text-[#1d3720]">
                            {order.deliveryOption === "DELIVERY" ? "Delivery" : "Self Pickup"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 px-6 py-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <div>
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-[#60705d]">Ordered Items</h3>
                        <span className="rounded-full bg-[#eef7e3] px-3 py-1 text-xs font-bold text-primary">
                          {order.vendorItemCount} item{order.vendorItemCount === 1 ? "" : "s"}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex gap-4 rounded-2xl border border-[#edf3e4] bg-[#fcfdf9] p-4"
                          >
                            <div className="h-20 w-20 overflow-hidden rounded-2xl bg-[#eef4e8]">
                              {item.listing?.imageUrl ? (
                                <img
                                  src={item.listing.imageUrl}
                                  alt={item.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-[#8c9b88]">
                                  <span className="material-symbols-outlined">inventory_2</span>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-bold text-[#1d3720]">{item.title}</p>
                                  <p className="mt-1 text-xs text-[#62705f]">{item.type} listing</p>
                                </div>
                                <p className="text-sm font-semibold text-[#1d3720]">{item.lineTotal.formatted}</p>
                              </div>
                              <div className="mt-3 grid gap-2 text-xs text-[#5f6d5b] sm:grid-cols-3">
                                <p>Quantity: {item.quantity}</p>
                                <p>Unit Price: {item.unitPrice.formatted}</p>
                                <p className="truncate">Pickup: {item.listing?.location || "--"}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-2xl border border-[#edf3e4] bg-[#fbfdf8] p-5">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-[#60705d]">Customer Details</h3>
                        <div className="mt-4 space-y-3 text-sm text-[#425040]">
                          <p className="font-semibold text-[#1d3720]">{order.customer.name}</p>
                          <p>{order.customer.email}</p>
                          <p>{roleCopy[order.customer.role] || order.customer.role}</p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[#edf3e4] bg-[#fbfdf8] p-5">
                        <h3 className="text-sm font-bold uppercase tracking-wide text-[#60705d]">Fulfillment</h3>
                        <div className="mt-4 space-y-3 text-sm text-[#425040]">
                          <p>Payment Method: <span className="font-semibold text-[#1d3720]">{order.paymentMethod}</span></p>
                          <p>Total Order Value: <span className="font-semibold text-[#1d3720]">{order.totalAmount.formatted}</span></p>
                          <p>Paid At: <span className="font-semibold text-[#1d3720]">{formatDateTime(order.paidAt)}</span></p>
                          {order.rider ? (
                            <>
                              <p>Assigned Rider: <span className="font-semibold text-[#1d3720]">{order.rider.name}</span></p>
                              <p>Rider Contact: <span className="font-semibold text-[#1d3720]">{order.rider.phoneNumber || "--"}</span></p>
                            </>
                          ) : (
                            <p>Assigned Rider: <span className="font-semibold text-[#1d3720]">Waiting for rider acceptance</span></p>
                          )}
                          {order.deliveryAddress ? (
                            <p>Delivery Address: <span className="font-semibold text-[#1d3720]">{order.deliveryAddress}</span></p>
                          ) : (
                            <p>Pickup Notes: <span className="font-semibold text-[#1d3720]">{order.pickupInstructions || "--"}</span></p>
                          )}
                          {order.tracking?.message && (
                            <p>Tracking Update: <span className="font-semibold text-[#1d3720]">{order.tracking.message}</span></p>
                          )}
                        </div>
                        {order.deliveryOption === "SELF_PICKUP" && order.status !== "COMPLETED" && (
                          <button
                            type="button"
                            onClick={() => handleConfirmPickup(order.id)}
                            disabled={state.updatingOrderId === order.id}
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#f59b27] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            <span className="material-symbols-outlined text-[18px]">task_alt</span>
                            {state.updatingOrderId === order.id ? "Marking Picked Up..." : "Mark As Picked Up"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
