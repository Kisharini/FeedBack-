import { useEffect, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import Navbar from "../components/Navbar";
import { getCurrentUserFromStorage } from "../lib/auth";
import {
  advanceMockOrder,
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

const autoProgressDelayMs = {
  READY_FOR_PICKUP: 6000,
  FINDING_RIDER: 3000,
  RIDER_ASSIGNED: 4500,
  OUT_FOR_DELIVERY: 5000,
  DELIVERED: 2500,
};

const vendorIcon = L.divIcon({
  className: "delivery-map-marker-shell",
  html: '<div class="delivery-map-marker delivery-map-marker-vendor"><span class="material-symbols-outlined">storefront</span></div>',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const riderIcon = L.divIcon({
  className: "delivery-map-marker-shell",
  html: '<div class="delivery-map-marker delivery-map-marker-rider"><span class="material-symbols-outlined">two_wheeler</span></div>',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const destinationIcon = L.divIcon({
  className: "delivery-map-marker-shell",
  html: '<div class="delivery-map-marker delivery-map-marker-destination"><span class="material-symbols-outlined">location_on</span></div>',
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
  if (!path?.length) {
    return null;
  }

  if (path.length === 1) {
    return path[0];
  }

  const segmentCount = path.length - 1;
  const scaledProgress = Math.min(progress, 1) * segmentCount;
  const segmentIndex = Math.min(Math.floor(scaledProgress), segmentCount - 1);
  const segmentProgress = scaledProgress - segmentIndex;

  return interpolateCoordinates(path[segmentIndex], path[segmentIndex + 1], segmentProgress);
};

const canAutoProgress = (order) =>
  Boolean(order) &&
  ["READY_FOR_PICKUP", "FINDING_RIDER", "RIDER_ASSIGNED", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
    order.status
  );

const getAutomationLabel = (order, updating) => {
  if (!order) {
    return "";
  }

  if (order.status === "COMPLETED") {
    return "Order completed";
  }

  if (order.deliveryOption === "SELF_PICKUP") {
    return updating ? "Confirming pickup..." : "Auto pickup confirmation";
  }

  return updating ? "Live rider simulation" : "Live delivery tracking";
};

const getEtaLabel = (order) => {
  if (!order) {
    return "--";
  }

  if (order.status === "FINDING_RIDER") return "8 min";
  if (order.status === "RIDER_ASSIGNED") return "6 min";
  if (order.status === "OUT_FOR_DELIVERY") return "3 min";
  if (order.status === "DELIVERED") return "Arrived";
  if (order.status === "COMPLETED") return "Completed";
  if (order.status === "READY_FOR_PICKUP") return "Ready soon";

  return "--";
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
  const [animatedRiderPosition, setAnimatedRiderPosition] = useState(null);

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

  const advanceOrderStatus = async (targetOrderId = state.selectedOrder?.id) => {
    if (!targetOrderId) return;

    setState((current) => ({ ...current, updating: true, error: "" }));

    try {
      const response = await advanceMockOrder(targetOrderId);
      const updatedOrder = response.data.order;

      setState((current) => ({
        ...current,
        updating: false,
        error: "",
        selectedOrder: updatedOrder,
        orders: current.orders.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        ),
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        updating: false,
        error: error.message,
      }));
    }
  };

  useEffect(() => {
    if (!canAutoProgress(state.selectedOrder) || state.updating) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      advanceOrderStatus(state.selectedOrder.id);
    }, autoProgressDelayMs[state.selectedOrder.status] || 4000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [
    state.selectedOrder?.deliveryOption,
    state.selectedOrder?.id,
    state.selectedOrder?.status,
    state.updating,
  ]);

  useEffect(() => {
    if (!state.selectedOrder || state.selectedOrder.deliveryOption !== "DELIVERY") {
      setAnimatedRiderPosition(null);
      return undefined;
    }

    const mapData = buildDeliveryMapData(state.selectedOrder);
    const path = getStatusPath(mapData, state.selectedOrder.status);

    if (!path?.length) {
      setAnimatedRiderPosition(null);
      return undefined;
    }

    if (path.length === 1) {
      setAnimatedRiderPosition(path[0]);
      return undefined;
    }

    const duration = autoProgressDelayMs[state.selectedOrder.status] || 4000;
    const frameDuration = 80;
    const totalFrames = Math.max(1, Math.round(duration / frameDuration));
    let frame = 0;

    setAnimatedRiderPosition(path[0]);

    const intervalId = window.setInterval(() => {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      setAnimatedRiderPosition(interpolateAlongPath(path, progress));

      if (progress >= 1) {
        window.clearInterval(intervalId);
      }
    }, frameDuration);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    state.selectedOrder?.deliveryOption,
    state.selectedOrder?.id,
    state.selectedOrder?.status,
  ]);

  const isCompletedOrder = state.selectedOrder?.status === "COMPLETED";
  const deliveryMapData =
    state.selectedOrder?.deliveryOption === "DELIVERY"
      ? buildDeliveryMapData(state.selectedOrder)
      : null;

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => navigateTo("/marketplace")}
            className="rounded-full border border-[#dde6cf] bg-white px-4 py-2 text-sm text-[#445441] transition hover:bg-[#f4f8ee]"
          >
            Browse more food
          </button>
          <button
            type="button"
            onClick={() => navigateTo("/marketplace/checkout")}
            className="rounded-full bg-[#eef7df] px-4 py-2 text-sm font-semibold text-primary transition hover:bg-[#fff0d1]"
          >
            Checkout cart
          </button>
        </div>

        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] border border-[#e7eddc] bg-white p-6 shadow-level-1">
            <div className="border-b border-[#edf1e6] pb-5">
              <p className="font-label-md text-label-md uppercase tracking-[0.18em] text-[#70816c]">
                Track Order Status
              </p>
              <h1 className="mt-2 text-h1 text-[#213722]">Your marketplace orders</h1>
            </div>

            {state.error && (
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-red-700">
                {state.error}
              </div>
            )}

            {state.loading ? (
              <div className="mt-6 space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-28 animate-pulse rounded-[1.5rem] border border-[#edf0e6] bg-[#fafcf8]"
                  />
                ))}
              </div>
            ) : state.orders.length === 0 ? (
              <div className="mt-8 rounded-[1.6rem] border border-dashed border-[#d7dfcb] bg-[#fcfdf9] px-6 py-12 text-center">
                <p className="text-h2 text-[#243523]">No orders yet</p>
                <p className="mt-2 text-[#5f6d5b]">
                  Once you complete payment, your orders will appear here.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {state.orders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => {
                      setState((current) => ({
                        ...current,
                        error: "",
                        selectedOrder: order,
                      }));
                      navigateTo(`/marketplace/orders/${order.id}`);
                    }}
                    className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                      state.selectedOrder?.id === order.id
                        ? "border-primary bg-[#f4faea]"
                        : "border-[#ebefdf] bg-[#fbfdf8] hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-[#253824]">
                          Order #{order.id.slice(-6)}
                        </p>
                        <p className="mt-1 text-sm text-[#5c6b59]">
                          {order.items.length} item(s) -{" "}
                          {order.deliveryOption === "DELIVERY" ? "Delivery" : "Self pickup"}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#476846]">
                        {statusCopy[order.status]}
                      </span>
                    </div>
                    <p className="mt-4 text-sm text-[#344634]">
                      {formatMoney(order.totalAmount)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-[#dfe7d4] bg-[linear-gradient(180deg,#ffffff_0%,#f8fcf2_100%)] p-6 shadow-level-1">
            {!state.selectedOrder ? (
              <div className="flex h-full min-h-[320px] items-center justify-center text-center text-[#60705d]">
                Select an order to view detailed tracking information.
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 rounded-[1.8rem] border border-[#edf1e4] bg-white p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-[#72806b]">
                      Selected order
                    </p>
                    <h2 className="mt-2 text-h1 text-[#213722]">
                      Order #{state.selectedOrder.id.slice(-6)}
                    </h2>
                    <p className="mt-2 text-[#5e6f5b]">
                      {statusCopy[state.selectedOrder.status]} -{" "}
                      {state.selectedOrder.deliveryOption === "DELIVERY"
                        ? "Delivery flow"
                        : "Pickup flow"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#d8e6cf] bg-[#f4faea] px-4 py-3 text-sm font-semibold text-[#2d5b2f]">
                    {getAutomationLabel(state.selectedOrder, state.updating)}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <StatusCard
                    label="Payment Method"
                    value={state.selectedOrder.paymentMethod}
                    icon="payments"
                  />
                  <StatusCard
                    label="Order Total"
                    value={formatMoney(state.selectedOrder.totalAmount)}
                    icon="receipt_long"
                  />
                  <StatusCard
                    label="Paid At"
                    value={new Date(state.selectedOrder.paidAt).toLocaleString()}
                    icon="schedule"
                  />
                </div>

                {state.selectedOrder.deliveryOption === "SELF_PICKUP" ? (
                  <div className="rounded-[1.8rem] border border-[#f0d9b3] bg-[linear-gradient(135deg,#fff9ef_0%,#fff4df_100%)] p-5">
                    <p className="text-sm font-semibold text-[#8c5d17]">Pickup procedures</p>
                    <p className="mt-3 leading-7 text-[#6e542c]">
                      {state.selectedOrder.pickupInstructions}
                    </p>
                    <p className="mt-4 text-sm text-[#7e612e]">
                      {isCompletedOrder
                        ? "This pickup order has already been completed successfully."
                        : "Demo mode will auto-confirm pickup after a short delay."}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                    <div className="rounded-[1.8rem] border border-[#e8eedc] bg-white p-5">
                      <p className="text-sm font-semibold text-[#214021]">Rider details</p>
                      {state.selectedOrder.rider ? (
                        <div className="mt-4 space-y-3 text-sm text-[#5d6c59]">
                          <p>
                            <span className="font-semibold text-[#243824]">Name:</span>{" "}
                            {state.selectedOrder.rider.name}
                          </p>
                          <p>
                            <span className="font-semibold text-[#243824]">Phone:</span>{" "}
                            {state.selectedOrder.rider.phoneNumber}
                          </p>
                          <p>
                            <span className="font-semibold text-[#243824]">Vehicle:</span>{" "}
                            {state.selectedOrder.rider.vehicle}
                          </p>
                          <p>
                            <span className="font-semibold text-[#243824]">Plate:</span>{" "}
                            {state.selectedOrder.rider.plateNumber}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm leading-6 text-[#5f6d5b]">
                          The system is automatically assigning a rider for this demo order.
                        </p>
                      )}

                      <div className="mt-5 grid gap-3 sm:grid-cols-3">
                        <MiniStat label="ETA" value={getEtaLabel(state.selectedOrder)} />
                        <MiniStat label="Mode" value="Live tracked" />
                        <MiniStat label="Route" value="Live route" />
                      </div>
                    </div>

                    {deliveryMapData && (
                      <DeliveryLeafletMap
                        order={state.selectedOrder}
                        mapData={deliveryMapData}
                        riderPosition={animatedRiderPosition}
                        isCompletedOrder={isCompletedOrder}
                      />
                    )}
                  </div>
                )}

                <div className="rounded-[1.8rem] border border-[#e8eedc] bg-white p-5">
                  <p className="text-sm font-semibold text-[#214021]">Ordered items</p>
                  <div className="mt-4 space-y-4">
                    {state.selectedOrder.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-[1.3rem] border border-[#edf1e4] bg-[#fbfdf8] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-[#213822]">{item.title}</p>
                          <p className="mt-1 text-sm text-[#5f6d5b]">
                            {item.type === "DISCOUNTED"
                              ? "Discounted food"
                              : "Donation food"}{" "}
                            - Qty {item.quantity}
                          </p>
                          <p className="mt-1 text-sm text-[#5f6d5b]">
                            {item.listing?.location}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-[#213822]">
                          {formatMoney(item.lineTotal)}
                        </p>
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

function DeliveryLeafletMap({ order, mapData, riderPosition, isCompletedOrder }) {
  return (
    <div className="rounded-[1.8rem] border border-[#d9e4f3] bg-[linear-gradient(180deg,#f5fbff_0%,#edf7ff_100%)] p-5">
      <p className="text-sm font-semibold text-[#19435b]">Live map</p>
      <div className="mt-4 overflow-hidden rounded-[1.4rem] border border-[#d9e8f3] bg-white p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
        <MapContainer
          className="delivery-leaflet-map h-72 w-full rounded-[1.2rem]"
          scrollWheelZoom={false}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewport points={mapData.bounds} orderId={order.id} />

          <Polyline
            positions={[mapData.riderStart, mapData.vendor]}
            pathOptions={{
              color: "#70a8e6",
              weight: 4,
              dashArray: "6 10",
              opacity: 0.9,
            }}
          />
          <Polyline
            positions={mapData.route}
            pathOptions={{
              color: "#1d77d4",
              weight: 5,
              opacity: 0.9,
              lineCap: "round",
              lineJoin: "round",
            }}
          />

          <Marker icon={vendorIcon} position={mapData.vendor}>
            <Tooltip
              className="delivery-map-tooltip"
              direction="bottom"
              offset={[0, 20]}
              permanent
            >
              Vendor
            </Tooltip>
          </Marker>

          <Marker icon={destinationIcon} position={mapData.destination}>
            <Tooltip
              className="delivery-map-tooltip"
              direction="bottom"
              offset={[0, 20]}
              permanent
            >
              Destination
            </Tooltip>
          </Marker>

          {riderPosition && (
            <Marker icon={riderIcon} position={riderPosition}>
              <Tooltip
                className="delivery-map-tooltip"
                direction="top"
                offset={[0, -20]}
                permanent={isCompletedOrder}
              >
                {isCompletedOrder ? "Delivered" : "Rider"}
              </Tooltip>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="mt-4 rounded-[1.2rem] bg-white/80 p-4 text-sm leading-6 text-[#35556a]">
        {order.tracking?.message ||
          "This live map is using a mocked route for the delivery preview."}
        {!isCompletedOrder && (
          <p className="mt-2 text-xs text-[#5a7c94]">
            The rider marker moves automatically as the mocked status updates.
          </p>
        )}
      </div>
    </div>
  );
}

function MapViewport({ points, orderId }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(points, {
      padding: [28, 28],
    });
  }, [map, orderId, points]);

  return null;
}

function StatusCard({ icon, label, value }) {
  return (
    <div className="rounded-[1.4rem] border border-[#ebefdf] bg-white p-4">
      <div className="flex items-center gap-2 text-[#5b6c57]">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-[#253724]">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-[1rem] border border-[#e4edf7] bg-[#f8fbff] px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#6b88a1]">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[#1c4259]">{value}</p>
    </div>
  );
}
