import { useEffect, useState } from "react";
import AddressAutocompleteField from "../components/AddressAutocompleteField";
import Navbar from "../components/Navbar";
import { getCurrentUserFromStorage } from "../lib/auth";
import { apiRequest } from "../lib/api";
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

const statusTone = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CLAIMED: "bg-amber-50 text-amber-700 border-amber-200",
  PICKED_UP: "bg-sky-50 text-sky-700 border-sky-200",
  DELIVERED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  EXPIRED: "bg-slate-100 text-slate-600 border-slate-200",
};

const INITIAL_FORM_STATE = {
  title: "",
  description: "",
  type: "DISCOUNTED",
  quantity: "1",
  unitPrice: "",
  location: "",
  pickupLatitude: "",
  pickupLongitude: "",
  expiryAt: "",
  imageUrl: "",
};

function buildListingPayload(formData, listingImageFile) {
  const payload = new FormData();
  payload.append("title", formData.title.trim());
  payload.append("description", formData.description.trim());
  payload.append("type", formData.type);
  payload.append("quantity", String(Number(formData.quantity)));
  payload.append(
    "unitPrice",
    String(formData.type === "DISCOUNTED" ? Math.round(Number(formData.unitPrice) * 100) : 0)
  );
  payload.append("location", formData.location.trim());
  payload.append("pickupLatitude", formData.pickupLatitude);
  payload.append("pickupLongitude", formData.pickupLongitude);
  payload.append("expiryAt", new Date(formData.expiryAt).toISOString());

  if (formData.imageUrl.trim()) {
    payload.append("imageUrl", formData.imageUrl.trim());
  }

  if (listingImageFile) {
    payload.append("listingImage", listingImageFile);
  }

  return payload;
}

function toDateTimeInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

export default function VendorMyListingsPage() {
  const [currentUser] = useState(() => getCurrentUserFromStorage());
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingListing, setEditingListing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deletingListingId, setDeletingListingId] = useState("");
  const [listingImageFile, setListingImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  const loadListings = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await apiRequest("/vendor/listings", { method: "GET" });
      setListings(response.data.listings || []);
    } catch (requestError) {
      setError(requestError.message || "Failed to load your listings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigateTo("/login");
      return;
    }

    if (!["VENDOR", "ADMIN"].includes(currentUser.role)) {
      navigateTo("/");
      return;
    }

    loadListings();
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

  const openEditModal = (listing) => {
    setEditingListing(listing);
    setListingImageFile(null);
    setFormData({
      title: listing.title || "",
      description: listing.description || "",
      type: listing.type || "DISCOUNTED",
      quantity: String(listing.quantity ?? 1),
      unitPrice:
        listing.type === "DISCOUNTED" && listing.unitPrice !== null && listing.unitPrice !== undefined
          ? (listing.unitPrice / 100).toFixed(2)
          : "",
      location: listing.location || "",
      pickupLatitude:
        typeof listing.pickupLatitude === "number" ? String(listing.pickupLatitude) : "",
      pickupLongitude:
        typeof listing.pickupLongitude === "number" ? String(listing.pickupLongitude) : "",
      expiryAt: toDateTimeInputValue(listing.expiryAt),
      imageUrl: listing.imageUrl || "",
    });
  };

  const closeEditModal = () => {
    setEditingListing(null);
    setListingImageFile(null);
    setImagePreviewUrl("");
    setFormData(INITIAL_FORM_STATE);
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSaveListing = async (event) => {
    event.preventDefault();

    if (!editingListing) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await apiRequest(`/listings/${editingListing.id}`, {
        method: "PUT",
        body: buildListingPayload(formData, listingImageFile),
      });

      await loadListings();
      closeEditModal();
    } catch (requestError) {
      setError(requestError.message || "Failed to update this listing.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteListing = async () => {
    if (!deleteTarget) {
      return;
    }

    const targetId = deleteTarget.id;
    setDeletingListingId(targetId);
    setError("");

    try {
      await apiRequest(`/listings/${targetId}`, {
        method: "DELETE",
      });

      setListings((current) => current.filter((listing) => listing.id !== targetId));
      setDeletingListingId("");
      setDeleteTarget(null);
    } catch (requestError) {
      setError(requestError.message || "Failed to delete this listing.");
      setDeletingListingId("");
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md antialiased">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <section className="overflow-hidden rounded-[2.5rem] border border-[#e6ebda] bg-[linear-gradient(135deg,#fff9ef_0%,#f5fbe9_48%,#eef7ff_100%)] p-8 shadow-level-2">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c7d69]">
                Vendor Workspace
              </p>
              <h1 className="mt-2 font-display text-[clamp(2rem,3vw,2.8rem)] leading-tight text-[#1d3720]">
                My Listings
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#53604a]">
                Review all listings you have published, update stock details, and refresh images or pickup information whenever something changes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo("/vendor/dashboard")}
              className="rounded-full bg-[#eef7e3] px-5 py-3 text-sm font-semibold text-primary transition hover:bg-[#e2f0cc]"
            >
              Create New Listing
            </button>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mt-8">
          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[320px] animate-pulse rounded-[2rem] border border-[#edf0e6] bg-white"
                />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-[#d5dec8] bg-white px-6 py-14 text-center">
              <p className="text-h2 text-[#223623]">No listings published yet</p>
              <p className="mt-3 text-body-md text-[#63705f]">
                Create your first listing to start receiving customer and NGO orders.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <article
                  key={listing.id}
                  className="overflow-hidden rounded-[2rem] border border-[#ebefdf] bg-white shadow-[0_16px_32px_rgba(92,103,70,0.08)]"
                >
                  <div className="relative h-48 overflow-hidden bg-[linear-gradient(135deg,#b8e67f_0%,#ffe7a2_100%)]">
                    <RemoteFoodImage
                      src={listing.imageUrl}
                      alt={listing.title}
                      className="h-full w-full object-cover"
                      fallbackClassName="h-full w-full"
                    />
                    <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                      <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone[listing.status] || "bg-white/90 text-[#355528] border-[#dce7cf]"}`}>
                        {listing.status}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${listing.type === "DONATION" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                        {listing.type}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <h2 className="text-xl font-bold text-[#1d3720]">{listing.title}</h2>
                      <p className="mt-2 text-sm leading-relaxed text-[#5b6757]">
                        {listing.description}
                      </p>
                    </div>

                    <div className="grid gap-3 rounded-2xl border border-[#edf3e4] bg-[#fbfdf8] p-4 text-sm text-[#425040]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#70816c]">Quantity</span>
                        <span className="font-semibold text-[#1d3720]">{listing.quantity}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#70816c]">Price</span>
                        <span className="font-semibold text-[#1d3720]">
                          {listing.type === "DISCOUNTED" && listing.unitPrice !== null
                            ? `RM ${(listing.unitPrice / 100).toFixed(2)}`
                            : "Donation"}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[#70816c]">Pickup</span>
                        <span className="text-right font-semibold text-[#1d3720]">{listing.location}</span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[#70816c]">Expires</span>
                        <span className="text-right font-semibold text-[#1d3720]">
                          {new Date(listing.expiryAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(listing)}
                        className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#f59b27]"
                      >
                        Edit Listing
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(listing)}
                        disabled={deletingListingId === listing.id}
                        className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingListingId === listing.id ? "Deleting..." : "Delete Listing"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-[#e7eddc] bg-white p-8 shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c7d69]">
                  Listing Editor
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#1d3720]">
                  Edit {editingListing.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-full border border-[#dce6d2] bg-white px-3 py-2 text-sm font-semibold text-[#53604a] transition hover:bg-[#f7fbf1]"
              >
                Close
              </button>
            </div>

            <form className="space-y-6" onSubmit={handleSaveListing}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-xs font-bold uppercase text-[#576455]">Food Batch Title</span>
                  <input
                    required
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-2.5 outline-none focus:border-[#f2994a]"
                  />
                </label>

                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-xs font-bold uppercase text-[#576455]">Description & Allergens</span>
                  <textarea
                    required
                    rows="3"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-2.5 outline-none focus:border-[#f2994a] resize-none"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase text-[#576455]">Listing Type</span>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-2.5 outline-none focus:border-[#f2994a]"
                  >
                    <option value="DISCOUNTED">Discounted</option>
                    <option value="DONATION">Donation</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase text-[#576455]">Quantity</span>
                  <input
                    required
                    type="number"
                    min="1"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-2.5 outline-none focus:border-[#f2994a]"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase text-[#576455]">Offer Price (RM)</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required={formData.type === "DISCOUNTED"}
                    disabled={formData.type === "DONATION"}
                    name="unitPrice"
                    value={formData.type === "DONATION" ? "" : formData.unitPrice}
                    onChange={handleInputChange}
                    className={`rounded-xl border px-4 py-2.5 outline-none ${formData.type === "DONATION" ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "border-[#d8e2d2] bg-[#fbfdf7] focus:border-[#f2994a]"}`}
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase text-[#576455]">Expiry</span>
                  <input
                    required
                    type="datetime-local"
                    name="expiryAt"
                    value={formData.expiryAt}
                    onChange={handleInputChange}
                    className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-2.5 outline-none focus:border-[#f2994a]"
                  />
                </label>

                <AddressAutocompleteField
                  className="sm:col-span-2"
                  label="Pickup Location Details"
                  required
                  value={formData.location}
                  onValueChange={(nextValue) =>
                    setFormData((current) => ({
                      ...current,
                      location: nextValue,
                      pickupLatitude: "",
                      pickupLongitude: "",
                    }))
                  }
                  onLocationSelect={(location) =>
                    setFormData((current) => ({
                      ...current,
                      location: location?.address || current.location,
                      pickupLatitude:
                        typeof location?.latitude === "number" ? String(location.latitude) : "",
                      pickupLongitude:
                        typeof location?.longitude === "number" ? String(location.longitude) : "",
                    }))
                  }
                />

                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-xs font-bold uppercase text-[#576455]">Snapshot Image URL</span>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="rounded-xl border border-[#d8e2d2] bg-[#fbfdf7] px-4 py-2.5 outline-none focus:border-[#f2994a]"
                  />
                </label>

                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-xs font-bold uppercase text-[#576455]">Replace Food Image</span>
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
                      Update your image, quantity, location, price, or expiry details here before saving changes.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t border-[#edf3e4] pt-5">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-xl border border-[#dce6d2] bg-white px-5 py-3 text-sm font-semibold text-[#53604a] transition hover:bg-[#f7fbf1]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f59b27] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving Changes..." : "Save Listing Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-[#e7eddc] bg-white p-7 shadow-[0_24px_64px_rgba(0,0,0,0.18)]">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6c7d69]">
              Delete Listing
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#1d3720]">
              Remove {deleteTarget.title}?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#5b6757]">
              This will remove the listing from your active inventory. This action cannot be undone.
            </p>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-[#dce6d2] bg-white px-5 py-3 text-sm font-semibold text-[#53604a] transition hover:bg-[#f7fbf1]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteListing}
                disabled={deletingListingId === deleteTarget.id}
                className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingListingId === deleteTarget.id ? "Deleting..." : "Delete Listing"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
