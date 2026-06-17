import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import Navbar from "../components/Navbar";
import { getCurrentUserFromStorage } from "../lib/auth";
import { confirmPickupOrder, fetchOrderById, fetchOrders } from "../lib/marketplace";
import { fetchDrivingRoute, geocodeAddress } from "../lib/location";
import { navigateTo } from "../lib/navigation";

const formatMoney = (moneyValue) => moneyValue?.formatted || "RM 0.00";

const statusCopy = {
  PAYMENT_CONFIRMED: "Payment Confirmed",
  READY_FOR_PICKUP: "Ready For Pickup",
  FINDING_RIDER: "Finding Rider",
  RIDER_ASSIGNED: "Rider Heading To Pickup",
  OUT_FOR_DELIVERY: "Out For Delivery",
  DELIVERED: "Rider Arrived",
  COMPLETED: "Completed",
};

const orderedStatuses = [
  "PAYMENT_CONFIRMED",
  "READY_FOR_PICKUP",
  "FINDING_RIDER",
  "RIDER_ASSIGNED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "COMPLETED",
];

const vendorIcon = L.divIcon({
  className: "delivery-map-marker-shell",
  html: '<div class="delivery-map-marker delivery-map-marker-vendor" style="border-color: #16a34a;"><span class="material-symbols-outlined" style="color: #16a34a;">storefront</span></div>',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const riderIcon = L.divIcon({
  className: "delivery-map-marker-shell",
  html: '<div class="delivery-map-marker delivery-map-marker-rider" style="border-color: #1d77d4;"><span class="material-symbols-outlined" style="color: #1d77d4;">two_wheeler</span></div>',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const destinationIcon = L.divIcon({
  className: "delivery-map-marker-shell",
  html: '<div class="delivery-map-marker delivery-map-marker-destination" style="border-color: #dc2626;"><span class="material-symbols-outlined" style="color: #dc2626;">location_on</span></div>',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const getPickupAddress = (order) => order?.items?.[0]?.listing?.location || "Pickup location unavailable";
const getDropoffAddress = (order) => order?.deliveryAddress || "Drop-off location unavailable";

const getEtaLabel = (order) => {
  if (!order) return "--";
  if (order.status === "FINDING_RIDER") return "Awaiting rider";
  if (order.status === "RIDER_ASSIGNED") return "Heading to vendor";
  if (order.status === "OUT_FOR_DELIVERY") return "On the way";
  if (order.status === "DELIVERED") return "Rider arrived";
  if (order.status === "COMPLETED") return "Completed";
  if (order.status === "READY_FOR_PICKUP") return "Preparing";
  return "--";
};

const getStatusRouteHeadline = (order) => {
  if (!order) return "";
  if (order.deliveryOption === "SELF_PICKUP") return "Self pickup route";
  if (order.status === "FINDING_RIDER") return "Searching for an available rider";
  if (order.status === "RIDER_ASSIGNED") return "Rider is heading to the pickup point";
  if (order.status === "OUT_FOR_DELIVERY") return "Rider is carrying your order";
  if (order.status === "DELIVERED") return "Rider has arrived at your drop-off point";
  if (order.status === "COMPLETED") return "Order completed";
  return "Delivery route";
};

export default function OrderTrackingPage({ orderId = null }) {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const [state, setState] = useState({
    loading: true,
    error: "",
    orders: [],
    selectedOrder: null,
    updating: false,
  });
  const [pickupCoordinates, setPickupCoordinates] = useState(null);
  const [dropoffCoordinates, setDropoffCoordinates] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);

  const applyUpdatedOrder = (updatedOrder) => {
    setState((current) => ({
      ...current,
      updating: false,
      error: "",
      selectedOrder: updatedOrder,
      orders: current.orders.map((order) => (order.id === updatedOrder.id ? updatedOrder : order)),
    }));
  };

  useEffect(() => {
    if (!currentUser) {
      navigateTo("/login");
      return;
    }

    if (!["INDIVIDUAL", "NGO"].includes(currentUser.role)) {
      setState({
        loading: false,
        error: "Only individual and NGO accounts can track marketplace orders.",
        orders: [],
        selectedOrder: null,
        updating: false,
      });
      return;
    }

    const loadOrders = async () => {
      setState((current) => ({ ...current, loading: true, error: "" }));

      try {
        const [ordersResponse, selectedOrderResponse] = await Promise.all([
          fetchOrders(),
          orderId ? fetchOrderById(orderId) : Promise.resolve(null),
        ]);

        setState({
          loading: false,
          error: "",
          orders: ordersResponse.data.orders,
          selectedOrder:
            selectedOrderResponse?.data.order || ordersResponse.data.orders[0] || null,
          updating: false,
        });
      } catch (error) {
        setState({
          loading: false,
          error: error.message,
          orders: [],
          selectedOrder: null,
          updating: false,
        });
      }
    };

    loadOrders();
  }, [currentUser, orderId]);

  useEffect(() => {
    if (!state.selectedOrder || state.selectedOrder.status === "COMPLETED") {
      return undefined;
    }

    const pollInterval = window.setInterval(async () => {
      try {
        const response = await fetchOrderById(state.selectedOrder.id);
        const refreshedOrder = response.data.order;

        setState((current) => ({
          ...current,
          selectedOrder: refreshedOrder,
          orders: current.orders.map((order) => (order.id === refreshedOrder.id ? refreshedOrder : order)),
        }));
      } catch (pollError) {
        console.error("Failed to refresh order tracking:", pollError.message);
      }
    }, 5000);

    return () => window.clearInterval(pollInterval);
  }, [state.selectedOrder?.id, state.selectedOrder?.status]);

  useEffect(() => {
    let cancelled = false;

    if (!state.selectedOrder || state.selectedOrder.deliveryOption !== "DELIVERY") {
      setPickupCoordinates(null);
      setDropoffCoordinates(null);
      return undefined;
    }

    const loadStops = async () => {
      const [pickup, dropoff] = await Promise.all([
        geocodeAddress(getPickupAddress(state.selectedOrder)),
        geocodeAddress(getDropoffAddress(state.selectedOrder)),
      ]);

      if (!cancelled) {
        setPickupCoordinates(pickup);
        setDropoffCoordinates(dropoff);
      }
    };

    loadStops();
    return () => {
      cancelled = true;
    };
  }, [state.selectedOrder]);

  useEffect(() => {
    let cancelled = false;

    const loadRoute = async () => {
      if (
        !state.selectedOrder ||
        state.selectedOrder.deliveryOption !== "DELIVERY" ||
        !pickupCoordinates ||
        !dropoffCoordinates
      ) {
        setRoutePoints([]);
        return;
      }

      if (state.selectedOrder.status === "FINDING_RIDER") {
        setRoutePoints([]);
        return;
      }

      const riderCoordinates =
        state.selectedOrder.tracking?.latitude && state.selectedOrder.tracking?.longitude
          ? {
              latitude: state.selectedOrder.tracking.latitude,
              longitude: state.selectedOrder.tracking.longitude,
            }
          : null;

      if (!riderCoordinates) {
        setRoutePoints([]);
        return;
      }

      const destination =
        state.selectedOrder.status === "RIDER_ASSIGNED" ? pickupCoordinates : dropoffCoordinates;
      const route = await fetchDrivingRoute(riderCoordinates, destination);

      if (!cancelled) {
        setRoutePoints(route);
      }
    };

    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [dropoffCoordinates, pickupCoordinates, state.selectedOrder]);

  const isCompletedOrder = state.selectedOrder?.status === "COMPLETED";
  const canConfirmPickup =
    state.selectedOrder?.deliveryOption === "SELF_PICKUP" &&
    state.selectedOrder?.status !== "COMPLETED";
  const canConfirmDelivery =
    state.selectedOrder?.deliveryOption === "DELIVERY" &&
    state.selectedOrder?.status === "DELIVERED";

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigateTo("/marketplace")}
            className="group flex items-center gap-2 rounded-full border border-[#dde6cf] bg-white px-5 py-2.5 text-sm font-medium text-[#445441] shadow-sm transition-all hover:border-[#cbdbb7] hover:bg-[#f4f8ee]"
          >
            <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-0.5">arrow_back</span>
            Browse more food
          </button>
          <button
            type="button"
            onClick={() => navigateTo("/marketplace/checkout")}
            className="flex items-center gap-2 rounded-full bg-[#eef7df] px-5 py-2.5 text-sm font-semibold text-primary shadow-sm transition-all hover:bg-[#e2f0cc]"
          >
            <span className="material-symbols-outlined text-lg">shopping_cart</span>
            Checkout cart
          </button>
        </div>

        <section className="grid items-stretch gap-8 lg:grid-cols-[22rem_1fr] xl:grid-cols-[24rem_1fr]">
          <div className="flex h-full flex-col rounded-3xl border border-[#e7eddc] bg-white p-5 shadow-sm">
            <div className="border-b border-[#edf1e6] pb-4">
              <p className="font-label-md text-xs font-bold uppercase tracking-[0.14em] text-[#70816c]">
                Track Order Status
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-[#213722]">Your Order Summary</h1>
            </div>

            {state.error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-3.5 text-sm font-medium text-red-700">
                <span className="material-symbols-outlined text-lg">error</span>
                <p>{state.error}</p>
              </div>
            )}

            {state.loading ? (
              <div className="mt-4 space-y-3 overflow-y-auto pr-1">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-[104px] animate-pulse rounded-2xl border border-[#edf0e6] bg-[#fafcf8]" />
                ))}
              </div>
            ) : state.orders.length === 0 ? (
              <div className="mt-6 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#d7dfcb] bg-[#fcfdf9] px-4 py-12 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef7df] text-primary">
                  <span className="material-symbols-outlined text-2xl">receipt</span>
                </div>
                <p className="mt-4 text-base font-bold text-[#243523]">No orders yet</p>
                <p className="mt-1 max-w-[200px] text-sm text-[#5f6d5b]">
                  Once you complete payment, your orders will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-4 max-h-[65vh] flex-1 space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                {state.orders.map((order) => {
                  const isSelected = state.selectedOrder?.id === order.id;
                  return (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => {
                        setState((current) => ({ ...current, error: "", selectedOrder: order }));
                        navigateTo(`/marketplace/orders/${order.id}`);
                      }}
                      className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 ${
                        isSelected
                          ? "border-primary bg-[#f4faea] shadow-sm ring-1 ring-primary/20"
                          : "border-[#ebefdf] bg-[#fbfdf8] hover:border-[#d2dbbf] hover:bg-white hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-[#253824]">Order #{order.id.slice(-6)}</p>
                          <p className="mt-0.5 text-xs text-[#5c6b59]">
                            {order.items.length} item{order.items.length > 1 ? "s" : ""} •{" "}
                            {order.deliveryOption === "DELIVERY" ? "Delivery" : "Self pickup"}
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full border border-[#ebefdf] bg-white px-2.5 py-0.5 text-xs font-semibold text-[#476846]">
                          {statusCopy[order.status]}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-[#ebefdf]/60 pt-2">
                        <span className="text-xs text-[#70816c]">Total Amount</span>
                        <p className="text-sm font-bold text-[#344634]">{formatMoney(order.totalAmount)}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex h-full flex-col justify-between rounded-3xl border border-[#dfe7d4] bg-[linear-gradient(180deg,#ffffff_0%,#f8fcf2_100%)] p-5 shadow-sm sm:p-6">
            {!state.selectedOrder ? (
              <div className="flex min-h-[400px] flex-1 flex-col items-center justify-center text-center text-[#60705d]">
                <span className="material-symbols-outlined animate-bounce text-4xl text-[#70816c]/60">map</span>
                <p className="mt-3 font-medium">Select an order to view detailed tracking information.</p>
              </div>
            ) : (
              <div className="flex flex-1 flex-col space-y-6">
                <div className="flex flex-col gap-4 rounded-2xl border border-[#edf1e4] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#72806b]">Selected Order</p>
                    <h2 className="mt-0.5 text-xl font-bold text-[#213722]">Order #{state.selectedOrder.id.slice(-6)}</h2>
                    <p className="text-sm text-[#5e6f5b]">
                      {getStatusRouteHeadline(state.selectedOrder)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start rounded-xl border border-[#d8e6cf] bg-[#f4faea] px-3.5 py-2 text-xs font-bold text-[#2d5b2f] sm:self-center">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2d5b2f] opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[#2d5b2f]" />
                    </span>
                    {state.selectedOrder.tracking?.message || statusCopy[state.selectedOrder.status]}
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-[#edf1e4] bg-white p-5 shadow-sm">
                  <p className="mb-6 text-xs font-bold uppercase tracking-[0.12em] text-[#72806b]">Delivery Milestone</p>
                  <div className="relative flex w-full items-start justify-between px-2">
                    <div className="absolute left-6 right-6 top-[14px] -z-10 h-1 rounded-full bg-[#edf1e6]" />
                    <div
                      className="absolute left-6 top-[14px] -z-10 h-1 rounded-full bg-[#476846] transition-all duration-500 ease-out"
                      style={{
                        width: `calc(${(orderedStatuses.indexOf(state.selectedOrder.status) / (orderedStatuses.length - 1)) * 100}% - 12px)`,
                      }}
                    />
                    {orderedStatuses.map((statusKey, index) => {
                      const currentActiveIndex = orderedStatuses.indexOf(state.selectedOrder.status);
                      const isPast = index < currentActiveIndex;
                      const isCurrent = index === currentActiveIndex;
                      return (
                        <div key={statusKey} className="relative flex flex-1 flex-col items-center">
                          <div
                            className={`z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                              isPast
                                ? "border-[#476846] bg-[#476846] text-white"
                                : isCurrent
                                  ? "scale-110 border-[#476846] bg-white text-[#476846] shadow-md ring-4 ring-[#f4faea]"
                                  : "border-[#edf1e6] bg-white text-[#b2beb0]"
                            }`}
                          >
                            {isPast ? (
                              <span className="material-symbols-outlined text-sm font-bold">check</span>
                            ) : (
                              <span className="text-xs font-bold">{index + 1}</span>
                            )}
                          </div>
                          <span
                            className={`mx-auto mt-3 hidden max-w-[84px] text-center text-[11px] font-bold tracking-tight transition-colors duration-200 sm:block ${
                              isCurrent ? "font-extrabold text-[#213722]" : isPast ? "text-[#4b5749]" : "text-[#9cb098]"
                            }`}
                          >
                            {statusCopy[statusKey]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 block text-center text-xs font-semibold text-[#476846] sm:hidden">
                    Current Step: {statusCopy[state.selectedOrder.status]}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <StatusCard icon="payments" label="Payment Method" value={state.selectedOrder.paymentMethod} />
                  <StatusCard icon="receipt_long" label="Order Total" value={formatMoney(state.selectedOrder.totalAmount)} />
                  <StatusCard icon="schedule" label="Status" value={getEtaLabel(state.selectedOrder)} />
                </div>

                {state.selectedOrder.deliveryOption === "SELF_PICKUP" ? (
                  <div className="rounded-2xl border border-[#f0d9b3] bg-[linear-gradient(135deg,#fff9ef_0%,#fff4df_100%)] p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-[#8c5d17]">
                      <span className="material-symbols-outlined text-xl">info</span>
                      <p className="text-sm font-bold">Pickup Instructions</p>
                    </div>
                    <p className="mt-2.5 text-sm leading-relaxed text-[#6e542c]">{state.selectedOrder.pickupInstructions}</p>
                    <div className="mt-4 border-t border-[#e6d0a8]/60 pt-3 text-xs text-[#7e612e]/80">
                      {isCompletedOrder
                        ? "This pickup order has already been completed successfully."
                        : "Once collection happens, either you or the vendor can mark this order as picked up."}
                    </div>
                    {canConfirmPickup && (
                      <button
                        type="button"
                        disabled={state.updating}
                        onClick={async () => {
                          try {
                            setState((current) => ({ ...current, updating: true, error: "" }));
                            const response = await confirmPickupOrder(state.selectedOrder.id);
                            applyUpdatedOrder(response.data.order);
                          } catch (error) {
                            setState((current) => ({
                              ...current,
                              updating: false,
                              error: error.message,
                            }));
                          }
                        }}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#8c5d17] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#744a11] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[18px]">task_alt</span>
                        {state.updating ? "Confirming Pickup..." : "Mark As Picked Up"}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-5 lg:grid-cols-[20rem_1fr] xl:grid-cols-[22rem_1fr]">
                    <div className="flex flex-col justify-between rounded-2xl border border-[#e8eedc] bg-white p-5 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2 border-b border-[#edf1e6] pb-2 text-[#214021]">
                          <span className="material-symbols-outlined text-lg">motorcycle</span>
                          <p className="text-sm font-bold">Rider Details</p>
                        </div>
                        {state.selectedOrder.rider ? (
                          <div className="mt-3.5 space-y-2.5 text-sm text-[#5d6c59]">
                            <div className="flex justify-between">
                              <span className="text-[#70816c]">Name</span>
                              <span className="font-semibold text-[#243824]">{state.selectedOrder.rider.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#70816c]">Phone</span>
                              <span className="font-semibold text-[#243824]">{state.selectedOrder.rider.phoneNumber || "--"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#70816c]">Vehicle</span>
                              <span className="font-semibold text-[#243824]">{state.selectedOrder.rider.vehicle || "--"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#70816c]">Plate</span>
                              <span className="rounded border border-[#d8e6cf] bg-[#f4faea] px-2 py-0.5 text-xs font-semibold tracking-wider text-[#243824]">
                                {state.selectedOrder.rider.plateNumber || "--"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-4 text-sm leading-relaxed text-[#5f6d5b]">No rider has accepted this order yet.</p>
                        )}
                      </div>
                      <div className="mt-6 grid grid-cols-3 gap-2">
                        <MiniStat label="ETA" value={getEtaLabel(state.selectedOrder)} />
                        <MiniStat label="Mode" value="Live" />
                        <MiniStat label="Route" value="Leaflet" />
                      </div>
                    </div>

                    <DeliveryMap
                      order={state.selectedOrder}
                      pickupCoordinates={pickupCoordinates}
                      dropoffCoordinates={dropoffCoordinates}
                      routePoints={routePoints}
                    />
                  </div>
                )}

                {canConfirmDelivery && (
                  <div className="rounded-2xl border border-[#d7e4cd] bg-[#f7fbf1] p-5 shadow-sm">
                    <p className="text-sm font-bold text-[#1d3720]">Confirm delivery receipt</p>
                    <p className="mt-2 text-sm text-[#5f6d5b]">
                      Your rider has arrived. Once you have received the food, mark the order as completed.
                    </p>
                    <button
                      type="button"
                      disabled={state.updating}
                      onClick={async () => {
                        try {
                          setState((current) => ({ ...current, updating: true, error: "" }));
                          const response = await confirmPickupOrder(state.selectedOrder.id);
                          applyUpdatedOrder(response.data.order);
                        } catch (error) {
                          setState((current) => ({
                            ...current,
                            updating: false,
                            error: error.message,
                          }));
                        }
                      }}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#f59b27] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      {state.updating ? "Confirming..." : "Mark As Received"}
                    </button>
                  </div>
                )}

                <div className="mt-2 rounded-2xl border border-[#e8eedc] bg-white p-5 shadow-sm">
                  <p className="mb-3.5 flex items-center gap-2 text-sm font-bold text-[#214021]">
                    <span className="material-symbols-outlined text-lg text-[#5f6d5b]">restaurant_menu</span>
                    Items Ordered ({state.selectedOrder.items.length})
                  </p>
                  <div className="max-h-40 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                    {state.selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#edf1e4] bg-[#fbfdf8] p-3.5 transition-colors hover:bg-white">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-[#213822]">{item.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#5f6d5b]">
                            <span className={`rounded px-1.5 py-0.5 font-semibold ${item.type === "DISCOUNTED" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                              {item.type === "DISCOUNTED" ? "Discounted Surplus" : "Donation Batch"}
                            </span>
                            <span>•</span>
                            <span className="font-medium">Qty {item.quantity}</span>
                            {item.listing?.location && (
                              <>
                                <span>•</span>
                                <span className="truncate max-w-[140px] sm:max-w-none">{item.listing.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <p className="flex-shrink-0 text-sm font-bold text-[#213822]">{formatMoney(item.lineTotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function DeliveryMap({ order, pickupCoordinates, dropoffCoordinates, routePoints }) {
  const riderCoordinates =
    order?.tracking?.latitude && order?.tracking?.longitude
      ? [order.tracking.latitude, order.tracking.longitude]
      : null;
  const points = [
    riderCoordinates,
    pickupCoordinates ? [pickupCoordinates.latitude, pickupCoordinates.longitude] : null,
    dropoffCoordinates ? [dropoffCoordinates.latitude, dropoffCoordinates.longitude] : null,
  ].filter(Boolean);

  return (
    <div className="flex min-h-[340px] flex-col justify-between rounded-2xl border border-[#d9e4f3] bg-[linear-gradient(180deg,#f5fbff_0%,#edf7ff_100%)] p-4 shadow-sm">
      <div className="flex flex-1 flex-col">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#19435b]">Real Delivery Route</p>
        <div className="relative mt-2 min-h-[220px] flex-1 overflow-hidden rounded-xl border border-[#d9e8f3] bg-white p-1.5 shadow-sm">
          <MapContainer
            className="absolute inset-0 h-full w-full rounded-lg"
            scrollWheelZoom
            zoom={13}
            center={points[0] || [3.139, 101.6869]}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewportUpdater points={points} orderId={order.id} />

            {routePoints.length > 1 && (
              <Polyline
                positions={routePoints}
                pathOptions={{ color: "#1d77d4", weight: 5, opacity: 0.9, lineCap: "round", lineJoin: "round" }}
              />
            )}

            {pickupCoordinates && (
              <Marker icon={vendorIcon} position={[pickupCoordinates.latitude, pickupCoordinates.longitude]}>
                <Tooltip direction="bottom" offset={[0, 15]} permanent>Vendor Pickup</Tooltip>
              </Marker>
            )}
            {dropoffCoordinates && (
              <Marker icon={destinationIcon} position={[dropoffCoordinates.latitude, dropoffCoordinates.longitude]}>
                <Tooltip direction="bottom" offset={[0, 15]} permanent>Drop-Off</Tooltip>
              </Marker>
            )}
            {riderCoordinates && (
              <Marker icon={riderIcon} position={riderCoordinates}>
                <Tooltip direction="top" offset={[0, -15]} permanent={order.status === "DELIVERED"}>
                  {order.status === "DELIVERED" ? "Rider Arrived" : "Rider Live Location"}
                </Tooltip>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
      <div className="mt-3 rounded-xl border border-[#d9e4f3]/60 bg-white/70 p-3 text-xs leading-relaxed text-[#35556a]">
        <div className="flex items-center gap-1.5 font-bold text-[#19435b]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <p>{order.tracking?.message || "Waiting for live rider updates."}</p>
        </div>
        <p className="mt-1 text-[11px] text-[#5a7c94]">
          Route guidance follows the assigned rider once they accept the order.
        </p>
      </div>
    </div>
  );
}

function MapViewportUpdater({ points, orderId }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !points || points.length === 0) return;

    window.setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(points, { padding: [32, 32], maxZoom: 16, animate: true, duration: 0.8 });
    }, 150);
  }, [map, orderId, points]);

  return null;
}

function StatusCard({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#ebefdf] bg-white p-3.5 shadow-sm transition-all hover:border-[#d2dbbf]">
      <div className="flex items-center gap-1.5 text-[#5b6c57]">
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1.5 truncate text-sm font-bold text-[#253724]">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl border border-[#e4edf7] bg-[#f8fbff] p-2.5 text-center transition-colors hover:bg-[#f0f6fc]">
      <p className="text-[9px] font-bold uppercase tracking-wider text-[#6b88a1]">{label}</p>
      <p className="mt-0.5 text-xs font-bold text-[#1c4259]">{value}</p>
    </div>
  );
}
