import { useState } from "react";

// ── Tailwind theme colours as JS constants (mirrors the original config) ──────
const C = {
  primary: "#2d6a1b",
  primaryContainer: "#468432",
  primaryFixed: "#aff594",
  primaryFixedDim: "#94d87b",
  onPrimary: "#ffffff",
  secondary: "#356b10",
  secondaryContainer: "#b4f48a",
  onSecondaryContainer: "#3a7117",
  tertiary: "#695f00",
  tertiaryFixed: "#fbe504",
  onTertiary: "#ffffff",
  surface: "#f8fbf0",
  surfaceContainerLow: "#f2f5ea",
  surfaceContainer: "#ecefe4",
  surfaceContainerHigh: "#e6e9df",
  onSurface: "#191d16",
  onSurfaceVariant: "#41493c",
  outlineVariant: "#c1c9b8",
  outline: "#717a6b",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
  onError: "#ffffff",
};

// ── Inline style helpers ───────────────────────────────────────────────────────
const styles = {
  body: {
    backgroundColor: C.surface,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    color: C.onSurface,
    minHeight: "100vh",
  },
  nav: {
    backgroundColor: C.surface,
    boxShadow: "0 1px 3px rgba(70,132,50,0.1)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0 24px",
    height: "72px",
    position: "sticky",
    top: 0,
    zIndex: 50,
    borderBottom: `1px solid ${C.outlineVariant}33`,
  },
  sidebar: {
    width: 256,
    position: "fixed",
    left: 0,
    top: 72,
    height: "calc(100vh - 72px)",
    backgroundColor: C.surfaceContainerLow,
    borderRight: `1px solid ${C.outlineVariant}33`,
    display: "flex",
    flexDirection: "column",
    padding: "24px 0",
    zIndex: 40,
    overflowY: "auto",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    boxShadow: "0 4px 12px rgba(70,132,50,0.05)",
    border: `1px solid ${C.secondaryContainer}4d`,
    transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.3s ease",
    display: "flex",
    flexDirection: "column",
  },
  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(25,29,22,0.4)",
    backdropFilter: "blur(4px)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
};

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED_LISTINGS = [
  {
    id: "listing-1",
    title: "10x Bakery Surprise Bags",
    description: "Assorted loaves and pastries from today's morning bake.",
    category: "Bakery",
    qty: 10,
    claimed: 6,
    expiryLabel: "Exp. in 4h",
    expirySoon: false,
    status: "active",
    instructions: "Pick up at main bakery entrance.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCwmPiWcFr-dI9l3QYduWTsVZbobpcbI-3VYFVu0uNcqCDKIUYjfLyNVdAQuC8HIIHe2tBEBQNB_voqWAveDx5bDfjhhdVWfDMBB1kRZnrK0tGq4ys-dDHpITblGTR7Kzx-QSowO6dQkpQKhN05bYNNh7rV8oZQfP_IzH3g_zRwFH3fwwgnRdDj5EpNUOYHQwhcrjV7lgs35gN4Xm_oBUh2cxlbRJfu9cFeUmD86YIGj1Mo-GlfHLi27acIxHHyd6Iv-Z3BvpPgLsnQ",
  },
  {
    id: "listing-2",
    title: "Surplus Veggie Box",
    description: "Mixed seasonal organic vegetables from local farm partnership.",
    category: "Veggies",
    qty: 5,
    claimed: 2,
    expiryLabel: "Exp. in 55m",
    expirySoon: true,
    status: "expiring",
    instructions: "Bring your own reusable bag.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA34-ZZ5wGcAfScofoLG9JUpRlC3JOkUIsr7ybo2L4vOgqmIz_1JDh2T2fxqrmwypOp4rHDB9AAb1DsbCTilMoj_bbphiAqprzUrS29dgsB3v2WazcW3fj_zsNKVJKgJTWf8uKn0rXo9rFpvbQ1ZD2Utv3zlRsdntsKN3MfTy3yUfKi60vsBc9etmLuGlD4sTsFvX-bSQFS8-BRdC1Hru_EXA5JYXd0jajyHO46biUZ0sU5vihyEXgK0YzcrX9MS82VcCy78EEKbtdj",
  },
  {
    id: "listing-3",
    title: "Prepared Meal: Quinoa Power Bowl",
    description: "Healthy, pre-packed vegan lunch bowls ready for pickup.",
    category: "Prepared",
    qty: 15,
    claimed: 15,
    expiryLabel: "Pickup Completed",
    expirySoon: false,
    status: "claimed",
    instructions: "Pickup complete.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCbsLu2y4CLbFc2h8sZOKhzHK1KBiYJqDsLNuq3yIUfVcUg5aTDhKtTNTAV-D0knALaqeZn2c47HX1r6gvma38wm6iVx0ioNGy1fTGcOTqbWx5lLi9EID2pYCKI-n0hbZUEYxpikfiyqeafAaWi5LMvMOuJq1z76W0WSxfAd8Y2cBC3PWjYQK2R9MjNALQdQeBCDvrRxMyRoFdl8NuOuy-6qnsmUQEvd81M877PRrAJy3NztrAzmlUMeTqc5Y5bkVpCR4x2907neHPp",
  },
];

const CATEGORIES = ["Bakery", "Veggies", "Prepared", "Meat & Dairy", "Other"];

// ── Tiny icon component (Material Symbols via className trick) ─────────────────
function Icon({ name, style = {}, fill = false }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontVariationSettings: fill ? "'FILL' 1, 'wght' 400" : "'FILL' 0, 'wght' 400",
        fontSize: style.fontSize ?? 24,
        lineHeight: 1,
        userSelect: "none",
        ...style,
      }}
    >
      {name}
    </span>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, archived }) {
  if (archived)
    return (
      <span
        style={{
          padding: "4px 12px",
          borderRadius: 9999,
          fontSize: 12,
          fontWeight: 700,
          textTransform: "uppercase",
          backgroundColor: C.outline,
          color: "#fff",
        }}
      >
        Archived
      </span>
    );
  const map = {
    active: { bg: C.primaryContainer, color: "#fff", label: "Active" },
    expiring: { bg: C.tertiary, color: C.onTertiary, label: "Expiring Soon" },
    claimed: { bg: C.outline, color: "#fff", label: "Claimed" },
  };
  const m = map[status] ?? map.active;
  return (
    <span
      style={{
        padding: "4px 12px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase",
        backgroundColor: m.bg,
        color: m.color,
        animation: status === "expiring" ? "pulse 2s infinite" : undefined,
      }}
    >
      {m.label}
    </span>
  );
}

// ── Listing Card ──────────────────────────────────────────────────────────────
function ListingCard({ listing, onEdit, onDelete, onToggleArchive, onRelist }) {
  const [hovered, setHovered] = useState(false);
  const isClaimed = listing.status === "claimed";

  return (
    <div
      style={{
        ...styles.card,
        borderLeft: `4px solid ${C.primary}`,
        opacity: listing.archived ? 0.6 : 1,
        filter: listing.archived ? "grayscale(0.5)" : "none",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered
          ? "0 8px 24px rgba(70,132,50,0.08)"
          : "0 4px 12px rgba(70,132,50,0.05)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      <div style={{ height: 192, position: "relative", overflow: "hidden", borderRadius: "16px 16px 0 0" }}>
        <img
          src={listing.image}
          alt={listing.title}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <StatusBadge status={listing.status} archived={listing.archived} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 20, flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: C.onSurface, marginBottom: 4 }}>
          {listing.title}
        </h4>
        <p style={{ fontSize: 14, color: C.onSurfaceVariant, marginBottom: 16, flexGrow: 1 }}>
          {listing.description}
        </p>

        {/* Meta row */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: listing.expirySoon ? C.error : C.onSurfaceVariant }}>
            <Icon name={listing.expirySoon ? "warning" : listing.status === "claimed" ? "check_circle" : "schedule"} style={{ fontSize: 18 }} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>{listing.expiryLabel}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.onSurfaceVariant }}>
            <Icon name="shopping_basket" style={{ fontSize: 18 }} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>{listing.claimed}/{listing.qty} Claimed</span>
          </div>
        </div>

        {/* Actions */}
        <div
          style={{
            display: "flex",
            borderTop: `1px solid ${C.outlineVariant}33`,
            paddingTop: 12,
          }}
        >
          {isClaimed ? (
            <>
              <ActionBtn
                icon={listing.archived ? "unarchive" : "history"}
                label={listing.archived ? "Restore" : "Archive"}
                color={C.onSurfaceVariant}
                hoverBg={C.surfaceContainerLow}
                onClick={() => onToggleArchive(listing.id)}
              />
              <div style={{ width: 1, backgroundColor: `${C.outlineVariant}33`, margin: "0 4px" }} />
              <ActionBtn
                icon="refresh"
                label="Relist"
                color={C.primary}
                hoverBg={`${C.secondaryContainer}4d`}
                onClick={() => onRelist(listing.id)}
              />
            </>
          ) : (
            <>
              <ActionBtn
                icon="edit"
                label="Edit"
                color={C.primary}
                hoverBg={C.surfaceContainerLow}
                onClick={() => onEdit(listing)}
              />
              <div style={{ width: 1, backgroundColor: `${C.outlineVariant}33`, margin: "0 4px" }} />
              <ActionBtn
                icon="delete"
                label="Delete"
                color={C.error}
                hoverBg={`${C.errorContainer}33`}
                onClick={() => onDelete(listing.id)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, color, hoverBg, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexGrow: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        fontSize: 13,
        fontWeight: 600,
        color,
        backgroundColor: hovered ? hoverBg : "transparent",
        border: "none",
        cursor: "pointer",
        padding: "8px 4px",
        borderRadius: 8,
        transition: "background-color 0.15s",
      }}
    >
      <Icon name={icon} style={{ fontSize: 18 }} />
      {label}
    </button>
  );
}

// ── Listing Modal ─────────────────────────────────────────────────────────────
function ListingModal({ mode, initial, onClose, onSubmit }) {
  const [form, setForm] = useState(
    initial ?? { name: "", category: "Bakery", qty: "", date: "", time: "", instructions: "" }
  );

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <div style={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        style={{
          backgroundColor: C.surface,
          width: "100%",
          maxWidth: 512,
          borderRadius: 16,
          border: `1px solid ${C.outlineVariant}`,
          overflow: "hidden",
          animation: "fadeZoom 0.18s ease",
        }}
      >
        <div
          style={{
            padding: "16px 24px",
            borderBottom: `1px solid ${C.outlineVariant}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 600, color: C.onSurface }}>
            {mode === "edit" ? "Edit Listing" : "Create New Listing"}
          </span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.onSurfaceVariant }}
          >
            <Icon name="close" />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Item Name">
            <input
              required
              type="text"
              value={form.name}
              onChange={set("name")}
              placeholder="e.g. Artisanal Loaves"
              style={inputStyle}
            />
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Category">
              <select value={form.category} onChange={set("category")} style={inputStyle}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Quantity">
              <input
                required
                type="number"
                value={form.qty}
                onChange={set("qty")}
                placeholder="10"
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Expiry Date">
              <input required type="date" value={form.date} onChange={set("date")} style={inputStyle} />
            </Field>
            <Field label="Expiry Time">
              <input required type="time" value={form.time} onChange={set("time")} style={inputStyle} />
            </Field>
          </div>

          <Field label="Pickup Instructions">
            <textarea
              value={form.instructions}
              onChange={set("instructions")}
              rows={3}
              placeholder="Where and when to pick up..."
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </Field>

          <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
            <button type="button" onClick={onClose} style={cancelBtnStyle}>
              Cancel
            </button>
            <button type="submit" style={submitBtnStyle}>
              {mode === "edit" ? "Save Changes" : "Publish Listing"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: C.onSurfaceVariant, marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${C.outlineVariant}`,
  backgroundColor: C.surfaceContainerLow,
  fontSize: 14,
  fontFamily: "'Plus Jakarta Sans', sans-serif",
  color: C.onSurface,
  outline: "none",
  boxSizing: "border-box",
};

const cancelBtnStyle = {
  flexGrow: 1,
  padding: "12px 16px",
  borderRadius: 12,
  border: `1px solid ${C.outline}`,
  backgroundColor: "transparent",
  color: C.onSurfaceVariant,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

const submitBtnStyle = {
  flexGrow: 1,
  padding: "12px 16px",
  borderRadius: 12,
  border: "none",
  backgroundColor: C.primary,
  color: C.onPrimary,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  fontFamily: "'Plus Jakarta Sans', sans-serif",
};

// ── Delete Confirmation Modal ─────────────────────────────────────────────────
function DeleteModal({ onCancel, onConfirm }) {
  return (
    <div style={styles.modalOverlay}>
      <div
        style={{
          backgroundColor: C.surface,
          width: "100%",
          maxWidth: 384,
          borderRadius: 16,
          border: `1px solid ${C.outlineVariant}`,
          padding: 24,
          textAlign: "center",
          animation: "fadeZoom 0.15s ease",
        }}
      >
        <Icon name="warning" style={{ fontSize: 48, color: C.error }} />
        <h3 style={{ fontSize: 20, fontWeight: 600, color: C.onSurface, margin: "12px 0 8px" }}>
          Delete Listing?
        </h3>
        <p style={{ fontSize: 15, color: C.onSurfaceVariant, marginBottom: 24 }}>
          Are you sure you want to remove this listing? This action cannot be undone.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
          <button
            onClick={onConfirm}
            style={{ ...submitBtnStyle, backgroundColor: C.error }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Sidebar Nav Link ──────────────────────────────────────────────────────────
function NavLink({ icon, label, active, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); onClick?.(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        margin: "0 8px",
        borderRadius: 12,
        backgroundColor: active
          ? C.secondaryContainer
          : hovered
          ? C.surfaceContainerHigh
          : "transparent",
        color: active ? C.onSecondaryContainer : C.onSurfaceVariant,
        textDecoration: "none",
        transition: "background-color 0.15s",
      }}
    >
      <Icon name={icon} fill={active} />
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
    </a>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, valueColor, sub, stars }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...styles.card,
        padding: 24,
        borderLeft: `4px solid ${C.primary}`,
        transform: hovered ? "scale(1.02)" : "scale(1)",
        cursor: "default",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.onSurfaceVariant, marginBottom: 4 }}>{label}</p>
          <h3 style={{ fontSize: 48, fontWeight: 800, letterSpacing: "-0.02em", color: valueColor ?? C.primary, lineHeight: 1.1 }}>
            {value}
          </h3>
        </div>
        {icon && (
          <span
            style={{
              backgroundColor: C.secondaryContainer,
              padding: 8,
              borderRadius: 8,
              color: valueColor ?? C.primary,
            }}
          >
            <Icon name={icon} style={{ fontSize: 24 }} />
          </span>
        )}
      </div>
      {sub && (
        <p style={{ fontSize: 12, fontWeight: 700, color: C.primary, display: "flex", alignItems: "center", gap: 4 }}>
          <Icon name="trending_up" style={{ fontSize: 16 }} /> {sub}
        </p>
      )}
      {stars && (
        <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
          {[...Array(5)].map((_, i) => (
            <Icon key={i} name="star" fill style={{ fontSize: 20, color: C.tertiaryFixed }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function FeedbackProDashboard() {
  const [listings, setListings] = useState(SEED_LISTINGS);
  const [modal, setModal] = useState(null); // null | { type: 'create' | 'edit', listing? }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeCount = listings.length;

  const openCreate = () => setModal({ type: "create" });
  const openEdit = (listing) =>
    setModal({
      type: "edit",
      listing,
      form: {
        name: listing.title,
        category: listing.category,
        qty: String(listing.qty),
        date: new Date().toISOString().split("T")[0],
        time: "12:00",
        instructions: listing.instructions,
      },
    });

  const handleModalSubmit = (form) => {
    if (modal.type === "edit") {
      setListings((ls) =>
        ls.map((l) =>
          l.id === modal.listing.id
            ? {
                ...l,
                title: form.name,
                category: form.category,
                qty: Number(form.qty),
                description: `${form.category} surplus items from our latest batch.`,
                expiryLabel: `Exp. today at ${form.time}`,
                instructions: form.instructions,
              }
            : l
        )
      );
    } else {
      const newId = `listing-${Date.now()}`;
      setListings((ls) => [
        {
          id: newId,
          title: form.name,
          description: `${form.category} surplus items from our latest batch.`,
          category: form.category,
          qty: Number(form.qty),
          claimed: 0,
          expiryLabel: `Exp. at ${form.time}`,
          expirySoon: false,
          status: "active",
          instructions: form.instructions,
          image: SEED_LISTINGS[0].image,
        },
        ...ls,
      ]);
    }
    setModal(null);
  };

  const handleDelete = () => {
    setListings((ls) => ls.filter((l) => l.id !== deleteTarget));
    setDeleteTarget(null);
  };

  const handleToggleArchive = (id) =>
    setListings((ls) =>
      ls.map((l) => (l.id === id ? { ...l, archived: !l.archived } : l))
    );

  const handleRelist = (id) => {
    setListings((ls) =>
      ls.map((l) =>
        l.id === id ? { ...l, archived: false, status: "active", expiryLabel: "Exp. in 4h" } : l
      )
    );
    alert("Listing updated with a fresh expiry window!");
  };

  return (
    <>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        @keyframes fadeZoom { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { margin: 0; }
        input, select, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 6px; } 
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #c1c9b8; border-radius: 3px; }
      `}</style>

      <div style={styles.body}>
        {/* ── Top Nav ── */}
        <nav style={styles.nav}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              style={{ background: "none", border: "none", cursor: "pointer", color: C.onSurfaceVariant, display: "none" }}
              className="mobile-menu-btn"
            >
              <Icon name="menu" />
            </button>
            <span style={{ fontSize: 22, fontWeight: 700, color: C.primary }}>FeedBack</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
              {[["Listings", true], ["Deliveries", false], ["Analytics", false]].map(([label, active]) => (
                <a
                  key={label}
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 700 : 600,
                    color: active ? C.primary : C.onSurfaceVariant,
                    textDecoration: "none",
                    borderBottom: active ? `2px solid ${C.primary}` : "none",
                    paddingBottom: 4,
                  }}
                >
                  {label}
                </a>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {["recycling", "notifications"].map((ic) => (
                <button
                  key={ic}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: C.onSurfaceVariant,
                    padding: 8,
                    borderRadius: "50%",
                  }}
                >
                  <Icon name={ic} />
                </button>
              ))}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: `2px solid ${C.secondaryContainer}`,
                }}
              >
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdTSJmUIKcmGP_Jidwkyb9mSKYR_sXi4H_B7Jr3L1JGmKsaWKpvr3Px4G2_CDVOzqZSm6gyMRoGLN6R9tJKnjbqZVKZrUJY2907VjE_IVuFepr9FHW3SnhfPGjPwq2hMvw-vhtmik7QKCeXXjniNOOWhaGJdvcG36fwxhRG83jdTi0c60gtw2kHUn_oQLmvlKCfTClvU4S7t5pir8PyP0dOVhHzfQISkXFotYEXs4MboESJzQ67B4WwQPD6Y04REQMUx68lIzZqi_e"
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
          </div>
        </nav>

        <div style={{ display: "flex", minHeight: "calc(100vh - 72px)" }}>
          {/* ── Sidebar ── */}
          <aside style={styles.sidebar}>
            <div style={{ padding: "0 24px 24px" }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: C.primary }}>FeedBack Pro</h2>
              <p style={{ fontSize: 11, fontWeight: 700, color: C.onSurfaceVariant, letterSpacing: "0.03em" }}>
                Sustainability Hub
              </p>
            </div>

            <nav style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { icon: "storefront", label: "Marketplace" },
                { icon: "list_alt", label: "Listings", active: true },
                { icon: "local_shipping", label: "Deliveries" },
                { icon: "monitoring", label: "Analytics" },
              ].map((item) => (
                <NavLink key={item.label} {...item} />
              ))}
            </nav>

            <div style={{ padding: "0 16px 32px" }}>
              <button
                onClick={openCreate}
                style={{
                  width: "100%",
                  backgroundColor: C.primaryContainer,
                  color: C.onPrimary,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  marginBottom: 8,
                }}
              >
                <Icon name="add_circle" />
                Add New Listing
              </button>
            </div>

            <div style={{ borderTop: `1px solid ${C.outlineVariant}33`, paddingTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                { icon: "settings", label: "Settings" },
                { icon: "help", label: "Support" },
              ].map((item) => (
                <NavLink key={item.label} {...item} />
              ))}
            </div>
          </aside>

          {/* ── Main ── */}
          <main style={{ flexGrow: 1, marginLeft: 256, padding: "32px 24px", backgroundColor: C.surface }}>
            <div style={{ maxWidth: 960, margin: "0 auto" }}>
              {/* Header */}
              <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.01em", color: C.onSurface }}>
                    Manage Listings
                  </h1>
                  <p style={{ fontSize: 15, color: C.onSurfaceVariant, marginTop: 4 }}>
                    Oversee your surplus food distribution and track your community impact.
                  </p>
                </div>
              </header>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 48 }}>
                <StatCard
                  label="Active Listings"
                  value={activeCount}
                  icon="inventory_2"
                  sub="14% from last week"
                />
                <StatCard
                  label="Total Meals Provided"
                  value="1,482"
                  icon="restaurant"
                  valueColor={C.tertiary}
                  sub="Equivalent to 450kg CO2 saved"
                />
                <StatCard
                  label="Community Trust Score"
                  value="4.9/5"
                  stars
                />
              </div>

              {/* Listings Section */}
              <section>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ fontSize: 22, fontWeight: 600, color: C.onSurface }}>Live Listings</h2>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["filter_list", "search"].map((ic) => (
                      <button
                        key={ic}
                        style={{
                          padding: 8,
                          border: `1px solid ${C.outlineVariant}`,
                          borderRadius: 8,
                          background: "none",
                          cursor: "pointer",
                          color: C.onSurfaceVariant,
                        }}
                      >
                        <Icon name={ic} />
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                  {listings.map((listing) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      onEdit={openEdit}
                      onDelete={setDeleteTarget}
                      onToggleArchive={handleToggleArchive}
                      onRelist={handleRelist}
                    />
                  ))}
                </div>
              </section>

              {/* Footer */}
              <footer style={{ marginTop: 64, paddingBottom: 48, textAlign: "center" }}>
                <div style={{ width: 96, height: 4, backgroundColor: `${C.outlineVariant}33`, borderRadius: 2, margin: "0 auto 24px" }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: C.onSurfaceVariant, marginBottom: 8 }}>
                  Need help with your listings?
                </p>
                <a href="#" style={{ fontSize: 13, fontWeight: 700, color: C.primary }}>
                  Contact Vendor Support
                </a>
              </footer>
            </div>
          </main>
        </div>

        {/* FAB (mobile) */}
        <button
          onClick={openCreate}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: C.primaryContainer,
            color: C.onPrimary,
            border: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            zIndex: 50,
          }}
        >
          <Icon name="add" style={{ fontSize: 28 }} />
        </button>
      </div>

      {/* Modals */}
      {modal && (
        <ListingModal
          mode={modal.type}
          initial={modal.form}
          onClose={() => setModal(null)}
          onSubmit={handleModalSubmit}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </>
  );
} 
