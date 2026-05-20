import { useState, useEffect } from "react";

// ─── Theme tokens ─────────────────────────────────────────────────────────────
const C = {
  primary: "#2d6a1b",
  primaryContainer: "#468432",
  onPrimaryContainer: "#ffffff",
  primaryFixed: "#aff594",
  primaryFixedDim: "#94d87b",
  secondary: "#356b10",
  secondaryContainer: "#b4f48a",
  onSecondaryContainer: "#3a7117",
  tertiary: "#695f00",
  tertiaryFixed: "#fbe504",
  onTertiary: "#ffffff",
  onTertiaryContainer: "#474000",
  surface: "#f8fbf0",
  surfaceContainerLow: "#f2f5ea",
  surfaceContainer: "#ecefe4",
  surfaceContainerHigh: "#e6e9df",
  surfaceContainerHighest: "#e0e4d9",
  onSurface: "#191d16",
  onSurfaceVariant: "#41493c",
  outline: "#717a6b",
  outlineVariant: "#c1c9b8",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onError: "#ffffff",
  background: "#f8fbf0",
};

// ─── Sample data ──────────────────────────────────────────────────────────────
const INITIAL_LISTINGS = [
  {
    id: "listing-1",
    title: "10x Bakery Surprise Bags",
    description: "Assorted loaves and pastries from today's morning bake.",
    category: "Bakery",
    qty: 10,
    claimed: 6,
    expiry: "Today, 18:00",
    expiryLabel: "Exp. in 4h",
    expiryWarning: false,
    status: "active",
    instructions: "Pick up at main bakery entrance.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwmPiWcFr-dI9l3QYduWTsVZbobpcbI-3VYFVu0uNcqCDKIUYjfLyNVdAQuC8HIIHe2tBEBQNB_voqWAveDx5bDfjhhdVWfDMBB1kRZnrK0tGq4ys-dDHpITblGTR7Kzx-QSowO6dQkpQKhN05bYNNh7rV8oZQfP_IzH3g_zRwFH3fwwgnRdDj5EpNUOYHQwhcrjV7lgs35gN4Xm_oBUh2cxlbRJfu9cFeUmD86YIGj1Mo-GlfHLi27acIxHHyd6Iv-Z3BvpPgLsnQ",
  },
  {
    id: "listing-2",
    title: "Surplus Veggie Box",
    description: "Mixed seasonal organic vegetables from local farm partnership.",
    category: "Veggies",
    qty: 5,
    claimed: 2,
    expiry: "Today, 15:45",
    expiryLabel: "Exp. in 55m",
    expiryWarning: true,
    status: "expiring",
    instructions: "Bring your own reusable bag.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuA34-ZZ5wGcAfScofoLG9JUpRlC3JOkUIsr7ybo2L4vOgqmIz_1JDh2T2fxqrmwypOp4rHDB9AAb1DsbCTilMoj_bbphiAqprzUrS29dgsB3v2WazcW3fj_zsNKVJKgJTWf8uKn0rXo9rFpvbQ1ZD2Utv3zlRsdntsKN3MfTy3yUfKi60vsBc9etmLuGlD4sTsFvX-bSQFS8-BRdC1Hru_EXA5JYXd0jajyHO46biUZ0sU5vihyEXgK0YzcrX9MS82VcCy78EEKbtdj",
  },
  {
    id: "listing-3",
    title: "Prepared Meal: Quinoa Power Bowl",
    description: "Healthy, pre-packed vegan lunch bowls ready for pickup.",
    category: "Prepared",
    qty: 15,
    claimed: 15,
    expiry: "Yesterday",
    expiryLabel: "Pickup Completed",
    expiryWarning: false,
    status: "claimed",
    instructions: "Pickup complete.",
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCbsLu2y4CLbFc2h8sZOKhzHK1KBiYJqDsLNuq3yIUfVcUg5aTDhKtTNTAV-D0knALaqeZn2c47HX1r6gvma38wm6iVx0ioNGy1fTGcOTqbWx5lLi9EID2pYCKI-n0hbZUEYxpikfiyqeafAaWi5LMvMOuJq1z76W0WSxfAd8Y2cBC3PWjYQK2R9MjNALQdQeBCDvrRxMyRoFdl8NuOuy-6qnsmUQEvd81M877PRrAJy3NztrAzmlUMeTqc5Y5bkVpCR4x2907neHPp",
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status, archived }) {
  if (archived) return (
    <span style={{ padding: "4px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 700, textTransform: "uppercase", background: C.outline, color: "#fff" }}>
      Archived
    </span>
  );
  const map = {
    active: { bg: C.primaryContainer, color: "#fff", label: "Active" },
    expiring: { bg: C.tertiary, color: C.onTertiary, label: "Expiring Soon" },
    claimed: { bg: C.outline, color: "#fff", label: "Claimed" },
  };
  const s = map[status] || map.active;
  return (
    <span style={{
      padding: "4px 12px", borderRadius: 9999, fontSize: 12, fontWeight: 700,
      textTransform: "uppercase", background: s.bg, color: s.color,
      animation: status === "expiring" ? "pulse 2s infinite" : undefined,
    }}>
      {s.label}
    </span>
  );
}

function StatCard({ label, value, icon, accent, sub }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: 24,
      boxShadow: "0 4px 12px rgba(70,132,50,0.05)",
      border: `1px solid rgba(180,244,138,0.3)`,
      borderLeft: `4px solid ${C.primary}`,
      transition: "transform 0.2s, box-shadow 0.2s",
      flex: "1 1 0",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(70,132,50,0.08)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 12px rgba(70,132,50,0.05)"; }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 14, fontWeight: 600, color: C.onSurfaceVariant, marginBottom: 4 }}>{label}</p>
          <h3 style={{ fontSize: 48, lineHeight: "56px", fontWeight: 800, letterSpacing: "-0.02em", color: accent || C.primary }}>{value}</h3>
        </div>
        <span className="material-symbols-outlined" style={{ color: accent || C.primary, background: C.secondaryContainer, padding: 8, borderRadius: 8, fontSize: 24 }}>{icon}</span>
      </div>
      <p style={{ fontSize: 12, fontWeight: 700, color: accent || C.primary, marginTop: 16 }}>{sub}</p>
    </div>
  );
}

function ListingCard({ listing, onEdit, onDelete, onToggleArchive, onRelist }) {
  const isClaimed = listing.status === "claimed";
  const archived = listing.archived;

  return (
    <div style={{
      background: "#fff", borderRadius: 16, display: "flex", flexDirection: "column",
      boxShadow: "0 4px 12px rgba(70,132,50,0.05)",
      border: `1px solid rgba(180,244,138,0.3)`,
      borderLeft: `4px solid ${C.primary}`,
      transition: "transform 0.2s, box-shadow 0.2s, opacity 0.3s",
      opacity: archived ? 0.6 : 1,
      filter: archived ? "grayscale(0.5)" : "none",
      overflow: "hidden",
    }}
      onMouseEnter={e => { if (!archived) { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(70,132,50,0.08)"; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 4px 12px rgba(70,132,50,0.05)"; }}
    >
      {/* Image */}
      <div style={{ height: 192, position: "relative", overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
        <img src={listing.image} alt={listing.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <StatusBadge status={listing.status} archived={archived} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <h4 style={{ fontSize: 22, fontWeight: 600, lineHeight: "30px", color: C.onSurface, marginBottom: 4 }}>{listing.title}</h4>
        <p style={{ fontSize: 16, color: C.onSurfaceVariant, marginBottom: 16 }}>{listing.description}</p>

        <div style={{ display: "flex", gap: 16, marginTop: "auto", marginBottom: 24, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: listing.expiryWarning ? C.error : C.onSurfaceVariant }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {listing.expiryWarning ? "warning" : isClaimed ? "check_circle" : "schedule"}
            </span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{listing.expiryLabel}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.onSurfaceVariant }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>shopping_basket</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{listing.claimed}/{listing.qty} Claimed</span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", borderTop: `1px solid ${C.outlineVariant}33`, paddingTop: 16, gap: 2 }}>
          {!isClaimed ? (
            <>
              <ActionBtn icon="edit" label="Edit" color={C.primary} hoverBg={C.surfaceContainerLow} onClick={() => onEdit(listing)} />
              <div style={{ width: 1, background: `${C.outlineVariant}33`, alignSelf: "center", height: 32 }} />
              <ActionBtn icon="delete" label="Delete" color={C.error} hoverBg={`${C.errorContainer}33`} onClick={() => onDelete(listing.id)} />
            </>
          ) : (
            <>
              <ActionBtn
                icon={archived ? "unarchive" : "history"}
                label={archived ? "Restore" : "Archive"}
                color={C.onSurfaceVariant}
                hoverBg={C.surfaceContainerLow}
                onClick={() => onToggleArchive(listing.id)}
              />
              <div style={{ width: 1, background: `${C.outlineVariant}33`, alignSelf: "center", height: 32 }} />
              <ActionBtn icon="refresh" label="Relist" color={C.primary} hoverBg={`${C.secondaryContainer}4D`} onClick={() => onRelist(listing.id)} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, color, hoverBg, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        fontSize: 14, fontWeight: 600, color,
        background: hov ? hoverBg : "transparent",
        border: "none", cursor: "pointer", padding: "8px 4px", borderRadius: 8,
        transition: "background 0.15s",
      }}>
      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{icon}</span>
      {label}
    </button>
  );
}

function Modal({ open, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(25,29,22,0.4)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, width: "100%", maxWidth: 480, borderRadius: 16,
        boxShadow: "0 24px 64px rgba(0,0,0,0.2)", border: `1px solid ${C.outlineVariant}`,
        overflow: "hidden",
      }}>
        {children}
      </div>
    </div>
  );
}

function FormInput({ label, id, children }) {
  return (
    <div>
      <label htmlFor={id} style={{ display: "block", fontSize: 14, fontWeight: 600, color: C.onSurfaceVariant, marginBottom: 4 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", borderRadius: 8, border: `1px solid ${C.outlineVariant}`,
  background: C.surfaceContainerLow, padding: "10px 12px",
  fontSize: 14, color: C.onSurface, outline: "none", boxSizing: "border-box",
  fontFamily: "inherit",
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function FeedbackPro() {
  const [listings, setListings] = useState(INITIAL_LISTINGS);
  const [showListingModal, setShowListingModal] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ name: "", category: "Bakery", qty: "", date: "", time: "", instructions: "" });
  const [deletingId, setDeletingId] = useState(null);
  const [relist, setRelist] = useState(null);

  const activeCount = listings.filter(l => !l.archived).length;

  function openCreate() {
    setEditingListing(null);
    setForm({ name: "", category: "Bakery", qty: "", date: "", time: "", instructions: "" });
    setShowListingModal(true);
  }

  function openEdit(listing) {
    setEditingListing(listing);
    const today = new Date().toISOString().split("T")[0];
    setForm({
      name: listing.title, category: listing.category,
      qty: String(listing.qty), date: today, time: "12:00",
      instructions: listing.instructions,
    });
    setShowListingModal(true);
  }

  function handleSubmit() {
    if (!form.name || !form.qty || !form.date || !form.time) return;
    if (editingListing) {
      setListings(ls => ls.map(l => l.id === editingListing.id
        ? { ...l, title: form.name, category: form.category, qty: Number(form.qty), instructions: form.instructions, description: `${form.category} surplus items from our latest batch.`, expiryLabel: `Exp. today at ${form.time}` }
        : l
      ));
    } else {
      const newListing = {
        id: `listing-${Date.now()}`,
        title: form.name, description: `${form.category} surplus items from our latest batch.`,
        category: form.category, qty: Number(form.qty), claimed: 0,
        expiry: `Today, ${form.time}`, expiryLabel: `Exp. at ${form.time}`,
        expiryWarning: false, status: "active", archived: false,
        instructions: form.instructions,
        image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwmPiWcFr-dI9l3QYduWTsVZbobpcbI-3VYFVu0uNcqCDKIUYjfLyNVdAQuC8HIIHe2tBEBQNB_voqWAveDx5bDfjhhdVWfDMBB1kRZnrK0tGq4ys-dDHpITblGTR7Kzx-QSowO6dQkpQKhN05bYNNh7rV8oZQfP_IzH3g_zRwFH3fwwgnRdDj5EpNUOYHQwhcrjV7lgs35gN4Xm_oBUh2cxlbRJfu9cFeUmD86YIGj1Mo-GlfHLi27acIxHHyd6Iv-Z3BvpPgLsnQ",
      };
      setListings(ls => [newListing, ...ls]);
    }
    setShowListingModal(false);
  }

  function handleDelete(id) {
    setDeletingId(id);
    setTimeout(() => {
      setListings(ls => ls.filter(l => l.id !== id));
      setDeletingId(null);
      setDeleteTarget(null);
    }, 300);
  }

  function handleToggleArchive(id) {
    setListings(ls => ls.map(l => l.id === id ? { ...l, archived: !l.archived } : l));
  }

  function handleRelist(id) {
    setListings(ls => ls.map(l => l.id === id ? { ...l, archived: false, status: "active" } : l));
    setRelist(id);
    setTimeout(() => setRelist(null), 2500);
  }

  const navLink = (label, active) => (
    <a href="#" style={{
      fontSize: 14, fontWeight: active ? 700 : 600, letterSpacing: "0.01em",
      color: active ? C.primary : C.onSurfaceVariant,
      borderBottom: active ? `2px solid ${C.primary}` : "2px solid transparent",
      padding: "4px 0", textDecoration: "none", transition: "color 0.15s",
    }}>
      {label}
    </a>
  );

  return (
    <div style={{ background: C.background, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', sans-serif", color: C.onSurface }}>
      {/* Keyframes */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; font-family: 'Material Symbols Outlined'; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes fadeIn { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        .toast { animation: fadeIn 0.3s ease; }
        * { box-sizing: border-box; }
        a { text-decoration: none; }
      `}</style>

      {/* Topbar */}
      <nav style={{
        background: C.surface, boxShadow: "0 1px 3px rgba(70,132,50,0.1)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 24px 0 280px", height: 64, position: "sticky", top: 0, zIndex: 50,
      }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: C.primary }}>FeedBack</span>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div style={{ display: "flex", gap: 32 }}>
            {navLink("Listings", true)}
            {navLink("Deliveries", false)}
            {navLink("Analytics", false)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {["recycling", "notifications"].map(icon => (
              <button key={icon} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: "50%", color: C.onSurfaceVariant }}>
                <span className="material-symbols-outlined">{icon}</span>
              </button>
            ))}
            <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", border: `2px solid ${C.secondaryContainer}` }}>
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdTSJmUIKcmGP_Jidwkyb9mSKYR_sXi4H_B7Jr3L1JGmKsaWKpvr3Px4G2_CDVOzqZSm6gyMRoGLN6R9tJKnjbqZVKZrUJY2907VjE_IVuFepr9FHW3SnhfPGjPwq2hMvw-vhtmik7QKCeXXjniNOOWhaGJdvcG36fwxhRG83jdTi0c60gtw2kHUn_oQLmvlKCfTClvU4S7t5pir8PyP0dOVhHzfQISkXFotYEXs4MboESJzQ67B4WwQPD6Y04REQMUx68lIzZqi_e" alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
        </div>
      </nav>

      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <aside style={{
          width: 256, position: "fixed", left: 0, top: 64, height: "calc(100vh - 64px)",
          background: C.surfaceContainerLow, borderRight: `1px solid ${C.outlineVariant}33`,
          display: "flex", flexDirection: "column", padding: "24px 0", zIndex: 40,
        }}>
          <div style={{ padding: "0 24px", marginBottom: 32 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: C.primary }}>FeedBack Pro</h2>
            <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.03em", color: C.onSurfaceVariant }}>Sustainability Hub</p>
          </div>
          <nav style={{ flexGrow: 1 }}>
            {[
              { icon: "storefront", label: "Marketplace", active: false },
              { icon: "list_alt", label: "Listings", active: true },
              { icon: "local_shipping", label: "Deliveries", active: false },
              { icon: "monitoring", label: "Analytics", active: false },
            ].map(({ icon, label, active }) => (
              <a key={label} href="#" style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", margin: "0 8px", borderRadius: 12,
                background: active ? C.secondaryContainer : "transparent",
                color: active ? C.onSecondaryContainer : C.onSurfaceVariant,
                fontSize: 14, fontWeight: 600, transition: "background 0.15s",
              }}>
                <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : {}}>{icon}</span>
                {label}
              </a>
            ))}
          </nav>
          <button onClick={openCreate} style={{
            margin: "0 16px 32px", background: C.primaryContainer, color: C.onPrimaryContainer,
            padding: "12px 16px", borderRadius: 12, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontSize: 14, fontWeight: 600, boxShadow: "0 2px 6px rgba(70,132,50,0.2)",
            transition: "filter 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.filter = "brightness(1.08)"}
            onMouseLeave={e => e.currentTarget.style.filter = ""}
          >
            <span className="material-symbols-outlined">add_circle</span>
            Add New Listing
          </button>
          <div style={{ borderTop: `1px solid ${C.outlineVariant}33`, paddingTop: 8 }}>
            {["Settings", "Support"].map((label, i) => (
              <a key={label} href="#" style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "12px 16px", margin: "0 8px", borderRadius: 12,
                color: C.onSurfaceVariant, fontSize: 14, fontWeight: 600,
              }}>
                <span className="material-symbols-outlined">{i === 0 ? "settings" : "help"}</span>
                {label}
              </a>
            ))}
          </div>
        </aside>

        {/* Main */}
        <main style={{ marginLeft: 256, flexGrow: 1, padding: 24, paddingTop: 32, background: C.background, minWidth: 0 }}>
          <div>

            {/* Header */}
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, gap: 16 }}>
              <div>
                <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.01em", color: C.onSurface }}>Manage Listings</h1>
                <p style={{ fontSize: 16, color: C.onSurfaceVariant, marginTop: 4 }}>Oversee your surplus food distribution and track your community impact.</p>
              </div>
            </header>

            {/* Stats */}
            <div style={{ display: "flex", gap: 16, marginBottom: 64 }}>
              <StatCard label="Active Listings" value={activeCount} icon="inventory_2" sub="↑ 14% from last week" />
              <StatCard label="Total Meals Provided" value="1,482" icon="restaurant" accent={C.tertiary} sub="Equivalent to 450kg CO2 saved" />
              <div style={{
                background: C.primaryContainer, borderRadius: 16, padding: 24, flex: "1 1 0",
                boxShadow: "0 4px 12px rgba(70,132,50,0.1)", border: `1px solid rgba(180,244,138,0.3)`,
                borderLeft: `4px solid ${C.primary}`, position: "relative", overflow: "hidden",
              }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.onPrimaryContainer, opacity: 0.8, marginBottom: 4 }}>Community Trust Score</p>
                <h3 style={{ fontSize: 48, fontWeight: 800, color: C.onPrimaryContainer }}>4.9/5</h3>
                <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined" style={{ color: C.tertiaryFixed, fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <span className="material-symbols-outlined" style={{ position: "absolute", right: -16, bottom: -16, fontSize: 120, opacity: 0.1, color: C.onPrimaryContainer }}>volunteer_activism</span>
              </div>
            </div>

            {/* Listings grid */}
            <div style={{ marginBottom: 64 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <h2 style={{ fontSize: 24, fontWeight: 600, color: C.onSurface }}>Live Listings</h2>
                <div style={{ display: "flex", gap: 8 }}>
                  {["filter_list", "search"].map(icon => (
                    <button key={icon} style={{ padding: 8, border: `1px solid ${C.outlineVariant}`, borderRadius: 8, background: "transparent", cursor: "pointer", color: C.onSurface }}>
                      <span className="material-symbols-outlined">{icon}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {listings.map(listing => (
                  <div key={listing.id} style={{
                    opacity: deletingId === listing.id ? 0 : 1,
                    transform: deletingId === listing.id ? "scale(0.9)" : "scale(1)",
                    transition: "opacity 0.3s, transform 0.3s",
                  }}>
                    <ListingCard
                      listing={listing}
                      onEdit={openEdit}
                      onDelete={id => setDeleteTarget(id)}
                      onToggleArchive={handleToggleArchive}
                      onRelist={handleRelist}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <footer style={{ textAlign: "center", paddingBottom: 48, marginTop: 64 }}>
              <div style={{ width: 96, height: 4, background: `${C.outlineVariant}33`, borderRadius: 9999, margin: "0 auto 32px" }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: C.onSurfaceVariant, marginBottom: 8 }}>Need help with your listings?</p>
              <a href="#" style={{ fontSize: 14, fontWeight: 700, color: C.primary }}>Contact Vendor Support</a>
            </footer>
          </div>
        </main>
      </div>

      {/* FAB mobile */}
      <button onClick={openCreate} style={{
        position: "fixed", bottom: 24, right: 24, width: 56, height: 56, borderRadius: "50%",
        background: C.primaryContainer, color: C.onPrimaryContainer, border: "none",
        boxShadow: "0 4px 16px rgba(70,132,50,0.3)", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>add</span>
      </button>

      {/* Create / Edit Modal */}
      <Modal open={showListingModal} onClose={() => setShowListingModal(false)}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${C.outlineVariant}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: 22, fontWeight: 600, color: C.onSurface }}>{editingListing ? "Edit Listing" : "Create New Listing"}</h3>
          <button onClick={() => setShowListingModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.onSurfaceVariant }}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <FormInput label="Item Name" id="f-name">
            <input id="f-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Artisanal Loaves" style={inputStyle} />
          </FormInput>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FormInput label="Category" id="f-category">
              <select id="f-category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={inputStyle}>
                {["Bakery", "Veggies", "Prepared", "Meat & Dairy", "Other"].map(c => <option key={c}>{c}</option>)}
              </select>
            </FormInput>
            <FormInput label="Quantity" id="f-qty">
              <input id="f-qty" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))} placeholder="10" type="number" style={inputStyle} />
            </FormInput>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FormInput label="Expiry Date" id="f-date">
              <input id="f-date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} type="date" style={inputStyle} />
            </FormInput>
            <FormInput label="Expiry Time" id="f-time">
              <input id="f-time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} type="time" style={inputStyle} />
            </FormInput>
          </div>
          <FormInput label="Pickup Instructions" id="f-instructions">
            <textarea id="f-instructions" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="Where and when to pick up..." rows={3} style={{ ...inputStyle, resize: "vertical" }} />
          </FormInput>
          <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
            <button onClick={() => setShowListingModal(false)} style={{
              flex: 1, padding: "12px 16px", borderRadius: 12, border: `1px solid ${C.outline}`,
              background: "transparent", color: C.onSurfaceVariant, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>Cancel</button>
            <button onClick={handleSubmit} style={{
              flex: 1, padding: "12px 16px", borderRadius: 12, border: "none",
              background: C.primary, color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>{editingListing ? "Save Changes" : "Publish Listing"}</button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <div style={{ padding: 24, textAlign: "center" }}>
          <span className="material-symbols-outlined" style={{ color: C.error, fontSize: 48, marginBottom: 16, display: "block" }}>warning</span>
          <h3 style={{ fontSize: 22, fontWeight: 600, color: C.onSurface, marginBottom: 8 }}>Delete Listing?</h3>
          <p style={{ fontSize: 16, color: C.onSurfaceVariant, marginBottom: 24 }}>Are you sure you want to remove this listing? This action cannot be undone.</p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setDeleteTarget(null)} style={{
              flex: 1, padding: "12px 16px", borderRadius: 12, border: `1px solid ${C.outline}`,
              background: "transparent", color: C.onSurfaceVariant, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>Cancel</button>
            <button onClick={() => handleDelete(deleteTarget)} style={{
              flex: 1, padding: "12px 16px", borderRadius: 12, border: "none",
              background: C.error, color: C.onError, fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}>Delete</button>
          </div>
        </div>
      </Modal>

      {/* Relist toast */}
      {relist && (
        <div className="toast" style={{
          position: "fixed", bottom: 96, left: "50%", transform: "translateX(-50%)",
          background: C.primary, color: "#fff", padding: "12px 24px", borderRadius: 12,
          fontSize: 14, fontWeight: 600, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", zIndex: 200,
        }}>
          ✓ Listing updated with a fresh expiry window!
        </div>
      )}
    </div>
  );
}
