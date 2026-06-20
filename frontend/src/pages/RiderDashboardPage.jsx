import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import Navbar from "../components/Navbar";
import { clearAuth, getCurrentUserFromStorage } from "../lib/auth";
import {
  fetchActiveRiderJob,
  fetchAvailableRiderJobs,
  acceptRiderJob,
  updateRiderJobLocation,
  updateRiderJobStatus,
} from "../lib/rider";
import {
  fetchDrivingRoute,
  geocodeAddress,
  getCurrentBrowserLocation,
} from "../lib/location";
import { navigateTo } from "../lib/navigation";

const statusCopy = {
  FINDING_RIDER: "Awaiting Rider",
  RIDER_ASSIGNED: "Heading To Pickup",
  OUT_FOR_DELIVERY: "Heading To Customer",
  DELIVERED: "Arrived At Drop-Off",
  COMPLETED: "Completed",
};

const riderIcon = L.divIcon({
  className: "delivery-map-marker-shell",
  html: '<div class="delivery-map-marker delivery-map-marker-rider" style="border-color: #1d77d4;"><span class="material-symbols-outlined" style="color: #1d77d4;">two_wheeler</span></div>',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const pickupIcon = L.divIcon({
  className: "delivery-map-marker-shell",
  html: '<div class="delivery-map-marker delivery-map-marker-vendor" style="border-color: #16a34a;"><span class="material-symbols-outlined" style="color: #16a34a;">storefront</span></div>',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const dropoffIcon = L.divIcon({
  className: "delivery-map-marker-shell",
  html: '<div class="delivery-map-marker delivery-map-marker-destination" style="border-color: #dc2626;"><span class="material-symbols-outlined" style="color: #dc2626;">location_on</span></div>',
  iconSize: [42, 42],
  iconAnchor: [21, 21],
});

const formatMoney = (amount) => `RM ${(amount / 100).toFixed(2)}`;

const getPickupAddress = (job) =>
  job?.items?.[0]?.pickupLocation || job?.vendor?.address || "Pickup location unavailable";

const getDropoffAddress = (job) => job?.deliveryAddress || "Delivery address unavailable";
const getPickupCoordinatesFromJob = (job) =>
  typeof job?.items?.[0]?.pickupLatitude === "number" &&
  typeof job?.items?.[0]?.pickupLongitude === "number"
    ? {
        latitude: job.items[0].pickupLatitude,
        longitude: job.items[0].pickupLongitude,
      }
    : typeof job?.vendor?.pickupLatitude === "number" && typeof job?.vendor?.pickupLongitude === "number"
      ? {
          latitude: job.vendor.pickupLatitude,
          longitude: job.vendor.pickupLongitude,
        }
      : null;

const getDropoffCoordinatesFromJob = (job) =>
  typeof job?.deliveryLatitude === "number" && typeof job?.deliveryLongitude === "number"
    ? {
        latitude: job.deliveryLatitude,
        longitude: job.deliveryLongitude,
      }
    : null;

const statusAction = {
  RIDER_ASSIGNED: {
    label: "Mark As Picked Up",
    nextStatus: "OUT_FOR_DELIVERY",
  },
  OUT_FOR_DELIVERY: {
    label: "Mark As Arrived",
    nextStatus: "DELIVERED",
  },
};

export default function RiderDashboardPage() {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const [state, setState] = useState({
    loading: true,
    error: "",
    availableJobs: [],
    activeJob: null,
    busy: false,
  });
  const [ignoredJobs, setIgnoredJobs] = useState([]);
  const [deviceLocation, setDeviceLocation] = useState(null);
  const [locationError, setLocationError] = useState("");
  const [pickupCoordinates, setPickupCoordinates] = useState(null);
  const [dropoffCoordinates, setDropoffCoordinates] = useState(null);
  const [routePoints, setRoutePoints] = useState([]);
  const isRiderUser = currentUser?.role === "RIDER";

  const loadDashboard = async () => {
    if (!isRiderUser) return;

    setState((current) => ({ ...current, loading: true, error: "" }));

    try {
      const [availableResponse, activeResponse] = await Promise.all([
        fetchAvailableRiderJobs(),
        fetchActiveRiderJob(),
      ]);

      setState((current) => ({
        ...current,
        loading: false,
        error: "",
        availableJobs: availableResponse.data.jobs || [],
        activeJob: activeResponse.data.job || null,
      }));
    } catch (error) {
      if (error.message === "You do not have permission to access this resource") {
        clearAuth();
        navigateTo("/login");
        return;
      }

      setState((current) => ({
        ...current,
        loading: false,
        error: error.message || "Failed to load rider dashboard.",
      }));
    }
  };

  useEffect(() => {
    if (!currentUser || !isRiderUser) {
      navigateTo("/login");
      return;
    }
    loadDashboard();
  }, [currentUser, isRiderUser]);

  useEffect(() => {
    let cancelled = false;

    getCurrentBrowserLocation()
      .then((coordinates) => {
        if (!cancelled) {
          setDeviceLocation(coordinates);
          setLocationError("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLocationError("Location access is off, so route guidance may be less accurate.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isRiderUser) return undefined;

    const intervalId = window.setInterval(() => {
      loadDashboard();
    }, 10000);

    return () => window.clearInterval(intervalId);
  }, [isRiderUser]);

  useEffect(() => {
    if (!isRiderUser || !state.activeJob) return undefined;

    const syncLocation = async () => {
      try {
        const coordinates = await getCurrentBrowserLocation();
        setDeviceLocation(coordinates);

        if (state.activeJob?.status !== "COMPLETED") {
          await updateRiderJobLocation(state.activeJob.id, coordinates);
        }
      } catch (error) {
        setLocationError("We could not refresh your current location.");
      }
    };

    syncLocation();
    const intervalId = window.setInterval(syncLocation, 15000);
    return () => window.clearInterval(intervalId);
  }, [isRiderUser, state.activeJob?.id, state.activeJob?.status]);

  useEffect(() => {
    let cancelled = false;

    if (!state.activeJob) {
      setPickupCoordinates(null);
      setDropoffCoordinates(null);
      return undefined;
    }

    const loadStops = async () => {
      const savedPickup = getPickupCoordinatesFromJob(state.activeJob);
      const savedDropoff = getDropoffCoordinatesFromJob(state.activeJob);

      if (savedPickup && savedDropoff) {
        setPickupCoordinates(savedPickup);
        setDropoffCoordinates(savedDropoff);
        return;
      }

      const [pickup, dropoff] = await Promise.all([
        savedPickup || geocodeAddress(getPickupAddress(state.activeJob)),
        savedDropoff || geocodeAddress(getDropoffAddress(state.activeJob)),
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
  }, [state.activeJob]);

  useEffect(() => {
    let cancelled = false;

    const loadRoute = async () => {
      if (!state.activeJob || !pickupCoordinates || !dropoffCoordinates) {
        setRoutePoints([]);
        return;
      }

      const liveRiderCoordinates = state.activeJob.tracking?.latitude && state.activeJob.tracking?.longitude
        ? {
            latitude: state.activeJob.tracking.latitude,
            longitude: state.activeJob.tracking.longitude,
          }
        : deviceLocation;

      if (!liveRiderCoordinates) {
        setRoutePoints([]);
        return;
      }

      const destination = state.activeJob.status === "RIDER_ASSIGNED" ? pickupCoordinates : dropoffCoordinates;
      const route = await fetchDrivingRoute(liveRiderCoordinates, destination);

      if (!cancelled) {
        setRoutePoints(route);
      }
    };

    loadRoute();
    return () => {
      cancelled = true;
    };
  }, [deviceLocation, dropoffCoordinates, pickupCoordinates, state.activeJob]);

  const activeAction = statusAction[state.activeJob?.status];
  const deliveryPhaseLabel = useMemo(() => {
    if (!state.activeJob) return "Searching";
    if (state.activeJob.status === "RIDER_ASSIGNED") return "Route to Pickup";
    if (state.activeJob.status === "OUT_FOR_DELIVERY") return "Route to Customer";
    if (state.activeJob.status === "DELIVERED") return "Waiting for Confirmation";
    return statusCopy[state.activeJob.status] || state.activeJob.status;
  }, [state.activeJob]);

  const visibleJobs = state.availableJobs.filter((job) => !ignoredJobs.includes(job.id));

  const handleAcceptJob = async (orderId) => {
    try {
      setState((current) => ({ ...current, busy: true, error: "" }));
      const response = await acceptRiderJob(orderId, deviceLocation || undefined);

      setState((current) => ({
        ...current,
        busy: false,
        activeJob: response.data.job,
        availableJobs: current.availableJobs.filter((job) => job.id !== orderId),
      }));
      setIgnoredJobs([]);
    } catch (error) {
      setState((current) => ({
        ...current,
        busy: false,
        error: error.message || "Could not accept this delivery job.",
      }));
    }
  };

  const handleAdvanceStatus = async () => {
    if (!state.activeJob || !activeAction) return;

    try {
      setState((current) => ({ ...current, busy: true, error: "" }));
      const response = await updateRiderJobStatus(
        state.activeJob.id,
        activeAction.nextStatus,
        deviceLocation || undefined
      );

      setState((current) => ({
        ...current,
        busy: false,
        activeJob: response.data.job,
      }));
    } catch (error) {
      setState((current) => ({
        ...current,
        busy: false,
        error: error.message || "Could not update this delivery status.",
      }));
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        
        {/* Grounded and Normalized Rider Header Section */}
        <section className="overflow-hidden rounded-[2.5rem] border border-[#e6ebda] bg-[linear-gradient(135deg,#fff9ef_0%,#f5fbe9_48%,#eef7ff_100%)] p-8 shadow-level-2">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#d8e6cf] bg-[#f4faea] px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#2d5b2f]">
                <span className="material-symbols-outlined text-[14px]">sports_motorsports</span>
                Delivery Network
              </div>
              <h1 className="font-display text-[clamp(2rem,3vw,2.6rem)] font-extrabold leading-tight text-[#1d3720]">
                Rider Portal
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-[#53604a]">
                View your active job status, plan your drop-off routes, or accept new nearby delivery offers in real time.
              </p>
            </div>
            
            {/* Standardized Rider Profile Box */}
            <div className="flex items-center gap-4 min-w-[260px] rounded-2xl border border-white/80 bg-white/60 p-4 backdrop-blur-md shadow-sm">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <span className="material-symbols-outlined text-2xl">sports_motorsports</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#70816c] uppercase tracking-wider">Rider Profile</p>
                <p className="truncate font-display text-lg font-bold text-[#1d3720]">{currentUser?.name || "Driver"}</p>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-[#16a34a]">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  Active
                </div>
              </div>
            </div>
          </div>
        </section>

        {state.error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {state.error}
          </div>
        )}

        {locationError && (
          <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm text-amber-700">
            {locationError}
          </div>
        )}

        {state.loading ? (
          <div className="mt-8 rounded-[2rem] border border-[#e7eddc] bg-white p-10 text-center shadow-level-1">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary/25 border-t-primary" />
            <p className="mt-4 text-sm font-medium text-[#53604a]">Loading available delivery jobs...</p>
          </div>
        ) : (
          <section className="mt-8 grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="rounded-[2rem] border border-[#e7eddc] bg-white p-6 shadow-level-1">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf3e4] pb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#71806c]">
                      Active Delivery
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-[#1d3720]">
                      {state.activeJob ? `Order #${state.activeJob.id.slice(-8).toUpperCase()}` : "Searching for Delivery Task"}
                    </h2>
                  </div>
                  <span className="rounded-full border border-[#d8e6cf] bg-[#f4faea] px-3 py-1 text-xs font-bold text-[#2d5b2f]">
                    {deliveryPhaseLabel}
                  </span>
                </div>

                {!state.activeJob ? (
                  <FindingJobsPanel jobCount={visibleJobs.length} />
                ) : (
                  <div className="space-y-5 pt-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <InfoCard
                        label="Pickup"
                        title={state.activeJob.vendor?.businessName || state.activeJob.vendor?.name || "Vendor"}
                        body={getPickupAddress(state.activeJob)}
                      />
                      <InfoCard
                        label="Drop-Off"
                        title={state.activeJob.customer?.name || "Customer"}
                        body={getDropoffAddress(state.activeJob)}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      <MetricCard label="Status" value={statusCopy[state.activeJob.status] || state.activeJob.status} />
                      <MetricCard label="Order Value" value={formatMoney(state.activeJob.totalAmount)} />
                      <MetricCard label="Items" value={`${state.activeJob.items?.length || 0} item${state.activeJob.items?.length === 1 ? "" : "s"}`} />
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#d9e8f3] bg-[#f5fbff]">
                      <div className="border-b border-[#d9e8f3] px-5 py-4">
                        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#587389]">
                          Live Route
                        </p>
                      </div>
                      <div className="h-[360px]">
                        <RiderMap
                          riderCoordinates={
                            state.activeJob.tracking?.latitude && state.activeJob.tracking?.longitude
                              ? [state.activeJob.tracking.latitude, state.activeJob.tracking.longitude]
                              : deviceLocation ? [deviceLocation.latitude, deviceLocation.longitude] : null
                          }
                          pickupCoordinates={pickupCoordinates}
                          dropoffCoordinates={dropoffCoordinates}
                          routePoints={routePoints}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#edf3e4] bg-[#fbfdf8] p-5">
                      <p className="text-sm font-bold text-[#1d3720]">Tracking Message</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#5e6c5a]">
                        {state.activeJob.tracking?.message || "The rider can update delivery progress from this page."}
                      </p>
                    </div>

                    {activeAction ? (
                      <button
                        type="button"
                        onClick={handleAdvanceStatus}
                        disabled={state.busy}
                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f59b27] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="material-symbols-outlined text-[18px]">route</span>
                        {state.busy ? "Updating..." : activeAction.label}
                      </button>
                    ) : (
                      <div className="rounded-2xl border border-[#e7eddc] bg-white px-4 py-3 text-sm text-[#5f6d5b]">
                        {state.activeJob.status === "DELIVERED"
                          ? "Waiting for the customer or NGO to confirm receipt and complete the order."
                          : "This order does not need a rider action right now."}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[2rem] border border-[#e7eddc] bg-white p-6 shadow-level-1">
              <div className="flex items-center justify-between gap-3 border-b border-[#edf3e4] pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#71806c]">
                    Job Offers Nearby
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-[#1d3720]"> {visibleJobs.length} to review</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIgnoredJobs([]);
                    loadDashboard();
                  }}
                  className="rounded-xl border border-[#d7e4cd] bg-[#f7fbf1] px-3 py-2 text-xs font-bold text-[#476846] transition hover:bg-[#eef7df]"
                >
                  Refresh
                </button>
              </div>

              {visibleJobs.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#5f6d5b]">
                  No new jobs to review right now. Keep this page open while we continue searching.
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {visibleJobs.map((job) => (
                    <article
                      key={job.id}
                      className="rounded-2xl border border-[#ebefdf] bg-[#fbfdf8] p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-[#1d3720]">
                            {job.vendor?.businessName || job.vendor?.name || "Vendor Pickup"}
                          </p>
                          <p className="mt-1 text-xs text-[#5f6d5b]">
                            Deliver to {job.customer?.name || "customer"}
                          </p>
                        </div>
                        <span className="rounded-full border border-[#d7e4cd] bg-white px-2.5 py-1 text-[11px] font-bold text-[#476846]">
                          {formatMoney(job.totalAmount)}
                        </span>
                      </div>
                      <div className="mt-4 space-y-2 text-xs text-[#5f6d5b]">
                        <p><span className="font-semibold text-[#1d3720]">Pickup:</span> {getPickupAddress(job)}</p>
                        <p><span className="font-semibold text-[#1d3720]">Drop-off:</span> {getDropoffAddress(job)}</p>
                        <p><span className="font-semibold text-[#1d3720]">Items:</span> {job.items?.map((item) => `${item.title} x${item.quantity}`).join(", ") || "No item description"}</p>
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => handleAcceptJob(job.id)}
                          disabled={state.busy || !!state.activeJob}
                          className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#f59b27] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {state.activeJob ? "Complete active job first" : state.busy ? "Accepting..." : "Accept Job"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setIgnoredJobs((current) => [...current, job.id])}
                          disabled={state.busy}
                          className="w-full rounded-xl border border-[#d7e4cd] bg-white px-4 py-2.5 text-sm font-semibold text-[#476846] transition hover:bg-[#f7fbf1] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Not Now
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function FindingJobsPanel({ jobCount }) {
  return (
    <div className="pt-5">
      <div className="rounded-[2rem] border border-[#d9e8f3] bg-[linear-gradient(180deg,#f5fbff_0%,#edf7ff_100%)] p-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative flex h-40 w-40 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full border border-[#9cc6ef] opacity-60" />
            <div className="absolute inset-[14px] animate-pulse rounded-full border border-[#6ba9de] opacity-70" />
            <div className="absolute inset-[32px] rounded-full border border-[#1d77d4]/40 bg-white/70" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#1d77d4] text-white shadow-lg">
              <span className="material-symbols-outlined text-3xl">two_wheeler</span>
            </div>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#587389]">Dispatch Search Live</p>
          <h3 className="mt-2 text-2xl font-bold text-[#1d3720]">Finding Delivery Near Your Location</h3>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-[#5a7c94]">
            Stay on this screen while the dispatch queue refreshes. New jobs will appear on the right for you to accept or skip.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#d9e8f3] bg-white px-4 py-2 text-sm font-semibold text-[#1d77d4]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1d77d4] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#1d77d4]" />
            </span>
            {jobCount > 0 ? `${jobCount} job offer${jobCount === 1 ? "" : "s"} waiting for review` : "No open jobs yet"}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, title, body }) {
  return (
    <div className="rounded-2xl border border-[#edf3e4] bg-[#fbfdf8] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#71806c]">{label}</p>
      <p className="mt-2 text-sm font-bold text-[#1d3720]">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-[#5f6d5b]">{body}</p>
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#edf3e4] bg-white p-4 shadow-sm">
      <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#71806c]">{label}</p>
      <p className="mt-2 text-sm font-bold text-[#1d3720]">{value}</p>
    </div>
  );
}

function RiderMap({ riderCoordinates, pickupCoordinates, dropoffCoordinates, routePoints }) {
  const points = useMemo(() => {
    return [
      riderCoordinates,
      pickupCoordinates ? [pickupCoordinates.latitude, pickupCoordinates.longitude] : null,
      dropoffCoordinates ? [dropoffCoordinates.latitude, dropoffCoordinates.longitude] : null,
    ].filter((p) => p && p[0] !== undefined && p[1] !== undefined);
  }, [riderCoordinates, pickupCoordinates, dropoffCoordinates]);

  return (
    <MapContainer
      className="h-full w-full"
      center={points[0] || [3.139, 101.6869]}
      zoom={13}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitMapBounds points={points} />

      {routePoints.length > 1 && (
        <Polyline
          positions={routePoints}
          pathOptions={{ color: "#1d77d4", weight: 5, opacity: 0.8 }}
        />
      )}

      {riderCoordinates && (
        <Marker icon={riderIcon} position={riderCoordinates}>
          <Tooltip direction="top" offset={[0, -15]}>Rider</Tooltip>
        </Marker>
      )}

      {pickupCoordinates && (
        <Marker
          icon={pickupIcon}
          position={[pickupCoordinates.latitude, pickupCoordinates.longitude]}
        >
          <Tooltip direction="top" offset={[0, -15]}>Pickup</Tooltip>
        </Marker>
      )}

      {dropoffCoordinates && (
        <Marker
          icon={dropoffIcon}
          position={[dropoffCoordinates.latitude, dropoffCoordinates.longitude]}
        >
          <Tooltip direction="top" offset={[0, -15]}>Drop-Off</Tooltip>
        </Marker>
      )}
    </MapContainer>
  );
}

function FitMapBounds({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!map || points.length === 0) return;

    map.fitBounds(points, {
      padding: [40, 40],
      maxZoom: 15,
    });
  }, [map, points]);

  return null;
}
