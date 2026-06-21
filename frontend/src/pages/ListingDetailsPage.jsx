import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import { addCartItem, getCartCount } from "../lib/cart";
import { getCurrentUserFromStorage } from "../lib/auth";
import { fetchListingById } from "../lib/marketplace";
import { navigateTo } from "../lib/navigation";

export default function ListingDetailsPage({ listingId }) {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const [quantity, setQuantity] = useState(1);
  const [cartCount, setCartCount] = useState(() =>
    currentUser ? getCartCount(currentUser.role) : 0
  );
  const [state, setState] = useState({
    loading: true,
    error: "",
    listing: null,
    successMessage: "",
  });

  useEffect(() => {
    if (!currentUser) {
      navigateTo("/login");
      return;
    }

    if (!["INDIVIDUAL", "NGO"].includes(currentUser.role)) {
      setState({
        loading: false,
        error: "Only individual and NGO users can access marketplace listings.",
        listing: null,
        successMessage: "",
      });
      return;
    }

    fetchListingById(listingId)
      .then((response) => {
        setState({
          loading: false,
          error: "",
          listing: response.data.listing,
          successMessage: "",
        });
      })
      .catch((error) => {
        setState({
          loading: false,
          error: error.message,
          listing: null,
          successMessage: "",
        });
      });
  }, [currentUser, listingId]);

  useEffect(() => {
    const syncCartCount = () => {
      if (!currentUser) {
        setCartCount(0);
        return;
      }
      setCartCount(getCartCount(currentUser.role));
    };

    window.addEventListener("cartchange", syncCartCount);
    return () => {
      window.removeEventListener("cartchange", syncCartCount);
    };
  }, [currentUser]);

  const handleAddToCart = () => {
    if (!state.listing || !currentUser) return;

    addCartItem(currentUser.role, {
      listingId: state.listing.id,
      quantity,
      snapshot: {
        title: state.listing.title,
        type: state.listing.type,
        location: state.listing.location,
        imageUrl: state.listing.imageUrl,
        unitPrice: state.listing.unitPrice,
        vendorName: state.listing.vendor.businessName || state.listing.vendor.name,
      },
    });

    setCartCount(getCartCount(currentUser.role));
    setState((current) => ({
      ...current,
      successMessage: `${state.listing.title} added to cart successfully.`,
    }));
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigateTo("/marketplace")}
            className="rounded-full border border-[#dde6cf] bg-white px-4 py-2 text-sm text-[#445441] transition hover:bg-[#f4f8ee] inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Back to Marketplace
          </button>
          <button
            type="button"
            onClick={() => navigateTo("/marketplace/checkout")}
            className="rounded-full bg-[#eef7df] px-4 py-2 text-sm font-semibold text-primary transition hover:bg-[#fff0d1] inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">shopping_cart</span>
            Cart: {cartCount} item(s)
          </button>
        </div>

        {state.loading && (
          <div className="h-[520px] animate-pulse rounded-[2rem] border border-[#edf0e6] bg-white" />
        )}

        {state.error && (
          <div className="rounded-2xl bg-red-50 px-5 py-4 text-red-700 border border-red-100 text-sm">{state.error}</div>
        )}

        {state.listing && (
          <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="overflow-hidden rounded-[2.4rem] border border-[#e8eedc] bg-white shadow-sm">
              <div className="relative h-[340px] bg-[linear-gradient(135deg,#b3e376_0%,#ffe08f_100%)]">
                {state.listing.imageUrl ? (
                  <img
                    src={state.listing.imageUrl}
                    alt={state.listing.title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#2d4a29]">
                    <div className="text-center">
                      <span className="material-symbols-outlined text-[72px]">lunch_dining</span>
                      <p className="mt-3 text-lg font-semibold">Vendor image unavailable</p>
                    </div>
                  </div>
                )}
                <div className="absolute left-5 top-5 rounded-full bg-white/95 px-4 py-2 text-xs font-bold tracking-wide text-[#F2994A] shadow-sm">
                  {state.listing.type === "DISCOUNTED" ? "50% Discounted" : "Donation Food for NGOs"}
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div>
                  <p className="font-label-md text-label-md uppercase tracking-[0.18em] text-[#6b7b69]">
                    Listing Overview
                  </p>
                  <h1 className="mt-2 text-3xl font-bold leading-tight text-[#213722]">
                    {state.listing.title}
                  </h1>
                  <p className="mt-4 text-sm leading-7 text-[#576454]">
                    {state.listing.description}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <DetailCard
                    icon="storefront"
                    label="Vendor"
                    value={state.listing.vendor.businessName || state.listing.vendor.name}
                  />
                  <DetailCard icon="location_on" label="Location" value={state.listing.location} />
                  <DetailCard
                    icon="inventory_2"
                    label="Available Quantity"
                    value={`${state.listing.quantity}`}
                  />
                  <DetailCard
                    icon="schedule"
                    label="Expiry"
                    value={new Date(state.listing.expiryAt).toLocaleString()}
                  />
                </div>
              </div>
            </div>

            {/* Pricing and Action Sidebar */}
            <div className="rounded-[2.4rem] border border-[#dfe7d4] bg-[linear-gradient(180deg,#ffffff_0%,#f8fcf2_100%)] p-6 shadow-sm space-y-6">
              
              <div className="rounded-[1.7rem] border border-[#e7eed9] bg-white p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#75856d]"> Pricing Details </p>
                
                <div className="mt-4 flex flex-wrap items-baseline gap-3">
                  {state.listing.type === "DISCOUNTED" ? (
                    <>
                      <span className="text-4xl font-extrabold tracking-tight text-[#1f3821]">
                        {state.listing.unitPrice.formatted}
                      </span>
                      {state.listing.originalPrice && (
                        <span className="text-lg font-medium text-[#a0b09c] line-through decoration-red-400/60 decoration-2">
                          {state.listing.originalPrice.formatted}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-3xl font-bold tracking-tight text-primary">
                      Free Donation
                    </span>
                  )}
                </div>

                <p className="mt-3.5 text-sm leading-relaxed text-[#617160]">
                  {state.listing.type === "DISCOUNTED"
                    ? "Individuals can add this discounted item to cart, select delivery or self pickup, and complete checkout using their preferred Malaysian payment method."
                    : "As an NGO representative, you are eligible to request this surplus batch entirely free of charge. Shipping fees only apply upon selecting home-delivery."}
                </p>
              </div>

              <div className="rounded-[1.7rem] border border-[#ebefdf] bg-white p-5">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#75856d]">
                  Select Quantity
                </label>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d8e4cd] bg-[#f7fbef] text-[#355227] transition hover:bg-[#eaf3dd] disabled:opacity-40"
                  >
                    -
                  </button>
                  <div className="min-w-[72px] rounded-full bg-[#f5f9ee] px-4 py-3 text-center font-bold text-[#253a22]">
                    {quantity}
                  </div>
                  <button
                    type="button"
                    disabled={quantity >= state.listing.quantity}
                    onClick={() => setQuantity((current) => Math.min(state.listing.quantity, current + 1))}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[#d8e4cd] bg-[#f7fbef] text-[#355227] transition hover:bg-[#eaf3dd] disabled:opacity-40"
                  >
                    +
                  </button>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full rounded-xl bg-primary px-4 py-3.5 font-semibold text-white transition shadow-sm hover:bg-[#f59b27] inline-flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                    {state.listing.type === "DISCOUNTED" ? "Add to Cart" : "Add Donation to Cart"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToCart();
                      navigateTo("/marketplace/checkout");
                    }}
                    className="w-full rounded-xl border border-[#d7e2cb] bg-white px-4 py-3.5 font-semibold text-[#29412a] transition shadow-sm hover:bg-[#f6faef] inline-flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">shopping_cart_checkout</span>
                    Proceed to Checkout
                  </button>
                </div>

                {state.successMessage && (
                  <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 border border-green-100">
                    {state.successMessage}
                  </div>
                )}
              </div>

              <div className="rounded-[1.7rem] border border-[#f0d9b3] bg-[linear-gradient(135deg,#fff9ef_0%,#fff4df_100%)] p-5">
                <p className="text-sm font-bold text-[#804d0d]">What happens next</p>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[#735327]">
                  <li className="flex gap-2"><span>1.</span> Add one or more listings to your cart.</li>
                  <li className="flex gap-2"><span>2.</span> Choose delivery or self pickup during checkout.</li>
                  <li className="flex gap-2"><span>3.</span> Complete payment using FPX, Touch 'n Go, or another available method.</li>
                  <li className="flex gap-2"><span>4.</span> Track pickup readiness or rider delivery updates on the tracking dashboard.</li>
                </ul>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function DetailCard({ icon, label, value }) {
  return (
    <div className="rounded-[1.4rem] border border-[#ebefdf] bg-[#fbfdf8] p-4">
      <div className="flex items-center gap-2 text-[#5b6c57]">
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
        <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2.5 text-sm font-medium text-[#253724] break-words">{value}</p>
    </div>
  );
}