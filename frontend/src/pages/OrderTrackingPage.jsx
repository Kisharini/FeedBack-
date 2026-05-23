import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import Navbar from "../components/Navbar";
import { getCurrentUserFromStorage } from "../lib/auth";
import {
  fetchOrderById,
  fetchOrders,
} from "../lib/marketplace";
import { navigateTo } from "../lib/navigation";

const formatMoney = (moneyValue) => moneyValue?.formatted || "RM 0.00";

const statusCopy = {
  PAYMENT_CONFIRMED: "Payment Confirmed",
  READY_FOR_PICKUP: "Ready For Pickup",
  FINDING_RIDER: "Finding Rider",
  RIDER_ASSIGNED: "Rider Assigned",
  OUT_FOR_DELIVERY: "Out For Delivery",
  DELIVERED: "Delivered",
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

const autoProgressDelayMs = {
  READY_FOR_PICKUP: 6000,
  FINDING_RIDER: 3000,
  RIDER_ASSIGNED: 4500,
  OUT_FOR_DELIVERY: 5000,
  DELIVERED: 2500,
};

// ========================================================
// LEAFLET MAP CUSTOM ICON MARKERS
// ========================================================
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

const hashString = (value) =>
  value.split("").reduce((sum, character, index) => sum + character.charCodeAt(0) * (index + 1), 0);

const buildDeliveryMapData = (order) => {
  const seed = hashString(order.id);
  const baseLat = 3.139 + ((seed % 120) - 60) * 0.00008;
  const baseLng = 101.6869 + ((Math.floor(seed / 3) % 120) - 60) * 0.00008;

  const riderStart = [baseLat - 0.0042, baseLng - 0.0048];
  const vendor = [baseLat - 0.0012, baseLng - 0.0015];
  const waypointOne = [baseLat + 0.0015, baseLng + 0.0007];
  const waypointTwo = [baseLat + 0.0033, baseLng + 0.003];
  const destination = [baseLat + 0.0052, baseLng + 0.0054];

  return {
    riderStart,
    vendor,
    waypointOne,
    waypointTwo,
    destination,
    route: [vendor, waypointOne, waypointTwo, destination],
    bounds: [riderStart, vendor, waypointOne, waypointTwo, destination],
  };
};

const getStatusPath = (mapData, status) => {
  if (status === "FINDING_RIDER") {
    return [mapData.riderStart, mapData.vendor];
  }
  if (status === "RIDER_ASSIGNED") {
    return [mapData.vendor, mapData.waypointOne];
  }
  if (status === "OUT_FOR_DELIVERY") {
    return [mapData.waypointOne, mapData.waypointTwo, mapData.destination];
  }
  return [mapData.destination];
};

const interpolateCoordinates = (start, end, progress) => [
  start[0] + (end[0] - start[0]) * progress,
  start[1] + (end[1] - start[1]) * progress,
];

const interpolateAlongPath = (path, progress) => {
  if (!path?.length) return null;
  if (path.length === 1) return path[0];

  const segmentCount = path.length - 1;
  const scaledProgress = Math.min(progress, 1) * segmentCount;
  const segmentIndex = Math.min(Math.floor(scaledProgress), segmentCount - 1);
  const segmentProgress = scaledProgress - segmentIndex;

  return interpolateCoordinates(path[segmentIndex], path[segmentIndex + 1], segmentProgress);
};

const getAutomationLabel = (order, updating) => {
  if (!order) return "";
  if (order.status === "COMPLETED") return "Order Completed";
  if (order.deliveryOption === "SELF_PICKUP") return updating ? "Confirming pickup..." : "Auto Pickup Integration";
  return "Live Delivery Polling";
};

const getEtaLabel = (order) => {
  if (!order) return "--";
  if (order.status === "FINDING_RIDER") return "8 min";
  if (order.status === "RIDER_ASSIGNED") return "6 min";
  if (order.status === "OUT_FOR_DELIVERY") return "3 min";
  if (order.status === "DELIVERED") return "Arrived";
  if (order.status === "COMPLETED") return "Completed";
  if (order.status === "READY_FOR_PICKUP") return "Ready soon";
  return "--";
};

// ========================================================
// MAIN EXPORT COMPONENT: ORDER TRACKING PAGE
// ========================================================
export default function OrderTrackingPage({ orderId = null }) {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const [state, setState] = useState({
    loading: true,
    error: "",
    orders: [],
    selectedOrder: null,
    updating: false,
  });
  const [riderPosition, setRiderPosition] = useState(null);

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

  // REAL TIME DATABASE POLL ENGINES
  useEffect(() => {
    if (!state.selectedOrder || state.selectedOrder.status === "COMPLETED") {
      return undefined;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetchOrderById(state.selectedOrder.id);
        const freshlyPolledOrder = response.data.order;

        setState((current) => ({
          ...current,
          selectedOrder: freshlyPolledOrder,
          orders: current.orders.map((o) =>
            o.id === freshlyPolledOrder.id ? freshlyPolledOrder : o
          ),
        }));
      } catch (pollError) {
        console.error("Tracking telemetry dropped frame sync:", pollError.message);
      }
    }, 5000); 

    return () => clearInterval(pollInterval);
  }, [state.selectedOrder?.id, state.selectedOrder?.status]);

  // TIMELINE STEP INTERPOLATOR CALCULATIONS
  useEffect(() => {
    if (!state.selectedOrder || state.selectedOrder.deliveryOption !== "DELIVERY") {
      setRiderPosition(null);
      return undefined;
    }

    const mapData = buildDeliveryMapData(state.selectedOrder);
    const path = getStatusPath(mapData, state.selectedOrder.status);

    if (!path?.length) {
      setRiderPosition(null);
      return undefined;
    }

    if (path.length === 1) {
      setRiderPosition(path[0]);
      return undefined;
    }

    const duration = autoProgressDelayMs[state.selectedOrder.status] || 4000;
    const frameDuration = 80;
    const totalFrames = Math.max(1, Math.round(duration / frameDuration));
    let frame = 0;

    setRiderPosition(path[0]);

    const intervalId = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      setRiderPosition(interpolateAlongPath(path, progress));

      if (progress >= 1) {
        window.clearInterval(intervalId);
      }
    }, frameDuration);

    return () => window.clearInterval(intervalId);
  }, [state.selectedOrder?.deliveryOption, state.selectedOrder?.id, state.selectedOrder?.status]);

  const isCompletedOrder = state.selectedOrder?.status === "COMPLETED";
  const deliveryMapData =
    state.selectedOrder?.deliveryOption === "DELIVERY"
      ? buildDeliveryMapData(state.selectedOrder)
      : null;

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="mb-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigateTo("/marketplace")}
            className="group flex items-center gap-2 rounded-full border border-[#dde6cf] bg-white px-5 py-2.5 text-sm font-medium text-[#445441] shadow-sm transition-all hover:bg-[#f4f8ee] hover:border-[#cbdbb7]"
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

        <section className="grid gap-8 items-stretch lg:grid-cols-[22rem_1fr] xl:grid-cols-[24rem_1fr]">
          <div className="flex flex-col h-full rounded-3xl border border-[#e7eddc] bg-white p-5 shadow-sm">
            <div className="pb-4 border-b border-[#edf1e6]">
              <p className="font-label-md text-xs font-bold uppercase tracking-[0.14em] text-[#70816c]">
                Track Order Status
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-[#213722]">Your Order Summary</h1>
            </div>

            {state.error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3.5 text-sm font-medium text-red-700 border border-red-100">
                <span className="material-symbols-outlined text-lg flex-shrink-0">error</span>
                <p className="line-clamp-2">{state.error}</p>
              </div>
            )}

            {state.loading ? (
              <div className="mt-4 space-y-3 overflow-y-auto pr-1 flex-1">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-[104px] animate-pulse rounded-2xl border border-[#edf0e6] bg-[#fafcf8]" />
                ))}
              </div>
            ) : state.orders.length === 0 ? (
              <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#d7dfcb] bg-[#fcfdf9] px-4 py-12 text-center flex-1">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#eef7df] text-primary">
                  <span className="material-symbols-outlined text-2xl">receipt</span>
                </div>
                <p className="mt-4 text-base font-bold text-[#243523]">No orders yet</p>
                <p className="mt-1 text-sm text-[#5f6d5b] max-w-[200px] mx-auto">
                  Once you complete payment, your orders will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3 overflow-y-auto pr-1 custom-scrollbar flex-1 max-h-[65vh]">
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
                          : "border-[#ebefdf] bg-[#fbfdf8] hover:bg-white hover:border-[#d2dbbf] hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-bold text-[#253824]">Order #{order.id.slice(-6)}</p>
                          <p className="mt-0.5 text-xs text-[#5c6b59]">
                            {order.items.length} item{order.items.length > 1 ? "s" : ""} &bull;{" "}
                            {order.deliveryOption === "DELIVERY" ? "Delivery" : "Self pickup"}
                          </p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap bg-white border border-[#ebefdf] text-[#476846] ${isSelected ? "border-primary/20 shadow-sm" : ""}`}>
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

          <div className="rounded-3xl border border-[#dfe7d4] bg-[linear-gradient(180deg,#ffffff_0%,#f8fcf2_100%)] p-5 sm:p-6 shadow-sm h-full flex flex-col justify-between">
            {!state.selectedOrder ? (
              <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center text-[#60705d] flex-1">
                <span className="material-symbols-outlined text-4xl text-[#70816c]/60 animate-bounce">map</span>
                <p className="mt-3 font-medium">Select an order to view detailed tracking information.</p>
              </div>
            ) : (
              <div className="space-y-6 flex-1 flex flex-col justify-between">
                <div className="flex flex-col gap-4 rounded-2xl border border-[#edf1e4] bg-white p-5 sm:flex-row sm:items-center sm:justify-between shadow-sm">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#72806b]">Selected Order</p>
                    <h2 className="mt-0.5 text-xl font-bold text-[#213722]">Order #{state.selectedOrder.id.slice(-6)}</h2>
                    <p className="text-sm text-[#5e6f5b]">
                      Handling via{" "}
                      <span className="font-semibold text-[#3d523e]">
                        {state.selectedOrder.deliveryOption === "DELIVERY" ? "Delivery Dispatch" : "Self Pickup Route"}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start rounded-xl border border-[#d8e6cf] bg-[#f4faea] px-3.5 py-2 text-xs font-bold text-[#2d5b2f] sm:self-center">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2d5b2f] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2d5b2f]"></span>
                    </span>
                    {getAutomationLabel(state.selectedOrder, state.updating)}
                  </div>
                </div>

                <div className="rounded-2xl border border-[#edf1e4] bg-white p-5 shadow-sm overflow-hidden">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#72806b] mb-6">Delivery Milestone</p>
                  <div className="relative flex items-start justify-between w-full px-2">
                    <div className="absolute left-6 right-6 top-[14px] h-1 bg-[#edf1e6] -z-10 rounded-full" />
                    <div 
                      className="absolute left-6 top-[14px] h-1 bg-[#476846] -z-10 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `calc(${(orderedStatuses.indexOf(state.selectedOrder.status) / (orderedStatuses.length - 1)) * 100}% - 12px)` }}
                    />
                    {orderedStatuses.map((statusKey, index) => {
                      const currentActiveIndex = orderedStatuses.indexOf(state.selectedOrder.status);
                      const isPast = index < currentActiveIndex;
                      const isCurrent = index === currentActiveIndex;
                      return (
                        <div key={statusKey} className="flex flex-col items-center flex-1 relative">
                          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 z-10 ${
                            isPast ? "bg-[#476846] border-[#476846] text-white" : isCurrent ? "bg-white border-[#476846] text-[#476846] scale-110 shadow-md ring-4 ring-[#f4faea]" : "bg-white border-[#edf1e6] text-[#b2beb0]"
                          }`}>
                            {isPast ? <span className="material-symbols-outlined text-sm font-bold">check</span> : <span className="text-xs font-bold">{index + 1}</span>}
                          </div>
                          <span className={`mt-3 hidden text-[11px] font-bold tracking-tight text-center sm:block max-w-[84px] mx-auto transition-colors duration-200 ${isCurrent ? "text-[#213722] font-extrabold" : isPast ? "text-[#4b5749]" : "text-[#9cb098]"}`}>
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
                  <StatusCard icon="schedule" label="Paid At" value={new Date(state.selectedOrder.paidAt).toLocaleString([], {hour: '2-digit', minute:'2-digit', year: 'numeric', month: 'short', day: 'numeric'})} />
                </div>

                {state.selectedOrder.deliveryOption === "SELF_PICKUP" ? (
                  <div className="rounded-2xl border border-[#f0d9b3] bg-[linear-gradient(135deg,#fff9ef_0%,#fff4df_100%)] p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-[#8c5d17]">
                      <span className="material-symbols-outlined text-xl">info</span>
                      <p className="text-sm font-bold">Pickup Instructions</p>
                    </div>
                    <p className="mt-2.5 text-sm leading-relaxed text-[#6e542c]">{state.selectedOrder.pickupInstructions}</p>
                    <div className="mt-4 border-t border-[#e6d0a8]/60 pt-3 text-xs text-[#7e612e]/80">
                      {isCompletedOrder ? "This pickup order has already been completed successfully." : "The interface updates automatically when the package is verified."}
                    </div>
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
                              <span className="font-semibold text-[#243824]">{state.selectedOrder.rider.phoneNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#70816c]">Vehicle</span>
                              <span className="font-semibold text-[#243824]">{state.selectedOrder.rider.vehicle}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-[#70816c]">Plate</span>
                              <span className="font-semibold text-[#243824] tracking-wider bg-[#f4faea] px-2 py-0.5 rounded text-xs border border-[#d8e6cf]">{state.selectedOrder.rider.plateNumber}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-4 text-sm leading-relaxed text-[#5f6d5b]">Waiting for dispatch confirmation from logistics platform...</p>
                        )}
                      </div>
                      <div className="mt-6 grid gap-2 grid-cols-3">
                        <MiniStat label="ETA" value={getEtaLabel(state.selectedOrder)} />
                        <MiniStat label="Mode" value="Live" />
                        <MiniStat label="Route" value="OSM" />
                      </div>
                    </div>

                    {deliveryMapData && (
                      <DeliveryLeafletMap
                        order={state.selectedOrder}
                        mapData={deliveryMapData}
                        riderPosition={riderPosition}
                        isCompletedOrder={isCompletedOrder}
                      />
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-[#e8eedc] bg-white p-5 shadow-sm mt-2">
                  <p className="text-sm font-bold text-[#214021] mb-3.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-[#5f6d5b]">restaurant_menu</span>
                    Items Ordered ({state.selectedOrder.items.length})
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {state.selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between gap-4 rounded-xl border border-[#edf1e4] bg-[#fbfdf8] p-3.5 transition-colors hover:bg-white">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-[#213822] truncate">{item.title}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#5f6d5b]">
                            <span className={`font-semibold ${item.type === "DISCOUNTED" ? "text-amber-700 bg-amber-50" : "text-emerald-700 bg-emerald-50"} px-1.5 py-0.5 rounded`}>
                              {item.type === "DISCOUNTED" ? "Discounted Surplus" : "Donation Batch"}
                            </span>
                            <span>&bull;</span>
                            <span className="font-medium">Qty {item.quantity}</span>
                            {item.listing?.location && (
                              <>
                                <span>&bull;</span>
                                <span className="truncate max-w-[140px] sm:max-w-none">{item.listing.location}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-bold text-[#213822] flex-shrink-0">{formatMoney(item.lineTotal)}</p>
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

// ========================================================
// RE-REALIZED: MODULAR REAL-TIME OPENSTREETMAP INTERFACE
// ========================================================
function DeliveryLeafletMap({ order, mapData, riderPosition, isCompletedOrder }) {
  return (
    <div className="rounded-2xl border border-[#d9e4f3] bg-[linear-gradient(180deg,#f5fbff_0%,#edf7ff_100%)] p-4 shadow-sm flex flex-col justify-between h-full min-h-[340px]">
      <div className="flex-1 flex flex-col">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#19435b]">Real-Time Delivery Route</p>
        <div className="mt-2 overflow-hidden rounded-xl border border-[#d9e8f3] bg-white p-1.5 shadow-sm flex-1 relative min-h-[220px]">
          <MapContainer
            className="delivery-leaflet-map h-full w-full rounded-lg absolute inset-0"
            scrollWheelZoom={true}
            zoomControl={true}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapViewportUpdater points={mapData.bounds} orderId={order.id} />

            <Polyline
              positions={[mapData.riderStart, mapData.vendor]}
              pathOptions={{ color: "#70a8e6", weight: 3, dashArray: "6 10", opacity: 0.7 }}
            />
            <Polyline
              positions={mapData.route}
              pathOptions={{ color: "#1d77d4", weight: 5, opacity: 0.9, lineCap: "round", lineJoin: "round" }}
            />

            <Marker icon={vendorIcon} position={mapData.vendor}>
              <Tooltip className="delivery-map-tooltip" direction="bottom" offset={[0, 15]} permanent>Vendor Shop</Tooltip>
            </Marker>
            <Marker icon={destinationIcon} position={mapData.destination}>
              <Tooltip className="delivery-map-tooltip" direction="bottom" offset={[0, 15]} permanent>Dropoff Location</Tooltip>
            </Marker>

            {riderPosition && (
              <Marker icon={riderIcon} position={riderPosition}>
                <Tooltip className="delivery-map-tooltip bg-primary text-white font-semibold" direction="top" offset={[0, -15]} permanent={isCompletedOrder}>
                  {isCompletedOrder ? "Package Delivered" : "Rider (En Route)"}
                </Tooltip>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-white/70 p-3 text-xs leading-relaxed text-[#35556a] border border-[#d9e4f3]/60">
        <div className="flex items-center gap-1.5 font-bold text-[#19435b]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <p>{order.tracking?.message || "Connected to telemetry distribution engine."}</p>
        </div>
        <p className="mt-1 text-[11px] text-[#5a7c94]">Map layout updates positioning vectors as updates stream from the rider's device.</p>
      </div>
    </div>
  );
}

function MapViewportUpdater({ points, orderId }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !points || points.length === 0) return;
    setTimeout(() => {
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
      <p className="mt-1.5 text-sm font-bold text-[#253724] truncate">{value}</p>
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