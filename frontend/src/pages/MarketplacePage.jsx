import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { getCartCount } from "../lib/cart";
import { getCurrentUserFromStorage } from "../lib/auth";
import { fetchListings } from "../lib/marketplace";
import { navigateTo } from "../lib/navigation";

const audienceCopy = {
  INDIVIDUAL: {
    title: "Discounted Food Marketplace",
    subtitle:
      "Browse discounted surplus meals from vendors, add them to cart, and check out with pickup or delivery.",
    badge: "Individual access",
  },
  NGO: {
    title: "Donation Food Marketplace",
    subtitle:
      "Browse free donation listings from vendors. NGOs only pay delivery when delivery is selected.",
    badge: "NGO access",
  },
};

const money = (moneyValue) => moneyValue?.formatted || "RM 0.00";

export default function MarketplacePage() {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const copy = audienceCopy[currentUser?.role] || audienceCopy.INDIVIDUAL;
  const [filters, setFilters] = useState({
    search: "",
    location: "",
    maxPrice: "",
  });
  const [state, setState] = useState({
    loading: true,
    error: "",
    listings: [],
  });
  const [cartCount, setCartCount] = useState(() =>
    currentUser ? getCartCount(currentUser.role) : 0
  );

  useEffect(() => {
    if (!currentUser) {
      navigateTo("/login");
      return undefined;
    }

    if (!["INDIVIDUAL", "NGO"].includes(currentUser.role)) {
      setState({
        loading: false,
        error: "Marketplace access is currently available only for individual and NGO accounts.",
        listings: [],
      });
      return undefined;
    }

    const loadListings = async () => {
      setState((current) => ({ ...current, loading: true, error: "" }));

      try {
        const response = await fetchListings({
          search: filters.search,
          location: filters.location,
          maxPrice:
            currentUser.role === "INDIVIDUAL" && filters.maxPrice
              ? Number(filters.maxPrice) * 100
              : undefined,
        });

        setState({
          loading: false,
          error: "",
          listings: response.data.listings,
        });
      } catch (error) {
        setState({
          loading: false,
          error: error.message,
          listings: [],
        });
      }
    };

    loadListings();
  }, [currentUser, filters.location, filters.maxPrice, filters.search]);

  useEffect(() => {
    const syncCartCount = () => {
      if (!currentUser) {
        setCartCount(0);
        return;
      }

      setCartCount(getCartCount(currentUser.role));
    };

    window.addEventListener("cartchange", syncCartCount);
    syncCartCount();

    return () => {
      window.removeEventListener("cartchange", syncCartCount);
    };
  }, [currentUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({
      ...current,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#e6ebda] bg-[linear-gradient(135deg,#fff9ef_0%,#f5fbe9_48%,#eef7ff_100%)] p-8 shadow-level-2">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex rounded-full border border-[#f1d8b8] bg-white/80 px-4 py-2 font-label-md text-label-md text-primary">
                {copy.badge}
              </div>
              <h1 className="font-display text-[clamp(2.2rem,4vw,3.4rem)] leading-tight text-[#1d3720]">
                {copy.title}
              </h1>
              <p className="mt-3 max-w-2xl text-body-lg text-[#53604a]">
                {copy.subtitle}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigateTo("/marketplace/checkout")}
                className="rounded-[1.4rem] border border-[#e6ebda] bg-white px-5 py-4 text-left shadow-[0_14px_24px_rgba(95,104,69,0.08)] transition-transform hover:-translate-y-0.5"
              >
                <p className="text-sm font-semibold text-[#203322]">Checkout Cart</p>
                <p className="mt-1 text-sm text-[#5a6752]">{cartCount} item(s) ready</p>
              </button>
              <button
                type="button"
                onClick={() => navigateTo("/marketplace/orders")}
                className="rounded-[1.4rem] border border-[#d7e4f5] bg-white px-5 py-4 text-left shadow-[0_14px_24px_rgba(76,107,132,0.08)] transition-transform hover:-translate-y-0.5"
              >
                <p className="text-sm font-semibold text-[#203322]">Track Order Status</p>
                <p className="mt-1 text-sm text-[#5a6752]">Monitor payment, pickup, and rider updates</p>
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-surface-container-high bg-white p-6 shadow-level-1">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2">
              <span className="font-label-md text-label-md uppercase text-on-surface">Search</span>
              <input
                name="search"
                value={filters.search}
                onChange={handleChange}
                className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-3 text-on-surface outline-none transition focus:border-primary"
                placeholder="Food title or description"
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="font-label-md text-label-md uppercase text-on-surface">Location</span>
              <input
                name="location"
                value={filters.location}
                onChange={handleChange}
                className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-3 text-on-surface outline-none transition focus:border-primary"
                placeholder="Area or neighborhood"
              />
            </label>
            {currentUser?.role === "INDIVIDUAL" && (
              <label className="flex flex-col gap-2">
                <span className="font-label-md text-label-md uppercase text-on-surface">
                  Max Price (RM)
                </span>
                <input
                  name="maxPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={filters.maxPrice}
                  onChange={handleChange}
                  className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-3 text-on-surface outline-none transition focus:border-primary"
                  placeholder="e.g. 12.50"
                />
              </label>
            )}
          </div>
        </section>

        {state.error && (
          <div className="mt-6 rounded-2xl bg-red-50 px-5 py-4 text-red-700">{state.error}</div>
        )}

        {state.loading ? (
          <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-[320px] animate-pulse rounded-[2rem] border border-[#edf0e6] bg-white"
              />
            ))}
          </section>
        ) : state.listings.length === 0 ? (
          <section className="mt-8 rounded-[2rem] border border-dashed border-[#d5dec8] bg-white px-6 py-14 text-center">
            <p className="text-h2 text-[#223623]">No matching listings right now</p>
            <p className="mt-3 text-body-md text-[#63705f]">
              Try adjusting your filters or come back once more vendors publish listings for your audience.
            </p>
          </section>
        ) : (
          <section className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {state.listings.map((listing) => (
              <article
                key={listing.id}
                className="group overflow-hidden rounded-[2rem] border border-[#ebefdf] bg-white shadow-[0_16px_32px_rgba(92,103,70,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_48px_rgba(92,103,70,0.12)]"
              >
                <div className="relative h-48 overflow-hidden bg-[linear-gradient(135deg,#b8e67f_0%,#ffe7a2_100%)]">
                  {listing.imageUrl ? (
                    <img
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-center text-[#335027]">
                      <div>
                        <span className="material-symbols-outlined text-[52px]">lunch_dining</span>
                        <p className="mt-2 text-sm font-semibold">Food preview unavailable</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full bg-white/88 px-3 py-1 text-xs font-semibold tracking-wide text-[#355528]">
                    {listing.type === "DISCOUNTED" ? "Discounted" : "Donation"}
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-h2 text-[#233424]">{listing.title}</h2>
                      <p className="mt-1 text-sm text-[#60705f]">
                        {listing.vendor.businessName || listing.vendor.name}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-[#f4fae8] px-3 py-2 text-right">
                      <p className="text-xs uppercase tracking-wide text-[#64805d]">Price</p>
                      <p className="text-sm font-semibold text-[#244125]">
                        {listing.type === "DISCOUNTED" ? money(listing.unitPrice) : "Free"}
                      </p>
                    </div>
                  </div>

                  <p className="line-clamp-3 text-sm leading-6 text-[#576455]">
                    {listing.description}
                  </p>

                  <div className="grid grid-cols-2 gap-3 rounded-[1.4rem] bg-[#fbfdf8] p-4">
                    <InfoPill icon="inventory_2" label="Quantity" value={`${listing.quantity}`} />
                    <InfoPill icon="location_on" label="Location" value={listing.location} />
                    <InfoPill
                      icon="schedule"
                      label="Expires"
                      value={new Date(listing.expiryAt).toLocaleString()}
                    />
                    <InfoPill
                      icon="local_shipping"
                      label="Delivery"
                      value="Mock delivery available"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => navigateTo(`/marketplace/listings/${listing.id}`)}
                    className="w-full rounded-xl bg-primary px-4 py-3 font-semibold text-white transition hover:bg-[#f59b27]"
                  >
                    View Food Details
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </div>
  );
}

function InfoPill({ icon, label, value }) {
  return (
    <div className="rounded-xl border border-[#e7eddc] bg-white px-3 py-3">
      <div className="flex items-center gap-2 text-[#4d6549]">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-sm text-[#243923]">{value}</p>
    </div>
  );
}
