import { useState } from "react";

const colors = {
  primary: "#2d6a1b",
  primaryContainer: "#468432",
  onPrimaryContainer: "#ffffff",
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
  surfaceVariant: "#e0e4d9",
  onSurface: "#191d16",
  onSurfaceVariant: "#41493c",
  outlineVariant: "#c1c9b8",
  outline: "#717a6b",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
};

const listings = [
  {
    id: 1,
    title: "10x Bakery Surprise Bags",
    desc: "Assorted loaves and pastries from today's morning bake.",
    status: "Active",
    expiry: "Exp. in 4h",
    expiryUrgent: false,
    claimed: "6/10 Claimed",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCwmPiWcFr-dI9l3QYduWTsVZbobpcbI-3VYFVu0uNcqCDKIUYjfLyNVdAQuC8HIIHe2tBEBQNB_voqWAveDx5bDfjhhdVWfDMBB1kRZnrK0tGq4ys-dDHpITblGTR7Kzx-QSowO6dQkpQKhN05bYNNh7rV8oZQfP_IzH3g_zRwFH3fwwgnRdDj5EpNUOYHQwhcrjV7lgs35gN4Xm_oBUh2cxlbRJfu9cFeUmD86YIGj1Mo-GlfHLi27acIxHHyd6Iv-Z3BvpPgLsnQ",
    actions: ["edit", "delete"],
  },
  {
    id: 2,
    title: "Surplus Veggie Box",
    desc: "Mixed seasonal organic vegetables from local farm partnership.",
    status: "Expiring Soon",
    expiry: "Exp. in 55m",
    expiryUrgent: true,
    claimed: "2/5 Claimed",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuA34-ZZ5wGcAfScofoLG9JUpRlC3JOkUIsr7ybo2L4vOgqmIz_1JDh2T2fxqrmwypOp4rHDB9AAb1DsbCTilMoj_bbphiAqprzUrS29dgsB3v2WazcW3fj_zsNKVJKgJTWf8uKn0rXo9rFpvbQ1ZD2Utv3zlRsdntsKN3MfTy3yUfKi60vsBc9etmLuGlD4sTsFvX-bSQFS8-BRdC1Hru_EXA5JYXd0jajyHO46biUZ0sU5vihyEXgK0YzcrX9MS82VcCy78EEKbtdj",
    actions: ["edit", "delete"],
  },
  {
    id: 3,
    title: "Prepared Meal: Quinoa Power Bowl",
    desc: "Healthy, pre-packed vegan lunch bowls ready for pickup.",
    status: "Claimed",
    expiry: "Pickup Completed",
    expiryUrgent: false,
    claimed: "15/15 Claimed",
    img: "https://lh3.googleusercontent.com/aida-public/AB6AXuCbsLu2y4CLbFc2h8sZOKhzHK1KBiYJqDsLNuq3yIUfVcUg5aTDhKtTNTAV-D0knALaqeZn2c47HX1r6gvma38wm6iVx0ioNGy1fTGcOTqbWx5lLi9EID2pYCKI-n0hbZUEYxpikfiyqeafAaWi5LMvMOuJq1z76W0WSxfAd8Y2cBC3PWjYQK2R9MjNALQdQeBCDvrRxMyRoFdl8NuOuy-6qnsmUQEvd81M877PRrAJy3NztrAzmlUMeTqc5Y5bkVpCR4x2907neHPp",
    actions: ["archive", "relist"],
    muted: true,
  },
];

function Icon({ name, size = 24, fill = 0, style = {} }) {
  return (
    <span
      className="material-symbols-outlined"
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        lineHeight: 1,
        ...style,
      }}
    >
      {name}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    Active: { background: colors.primaryContainer, color: "#fff" },
    "Expiring Soon": { background: colors.tertiary, color: "#fff" },
    Claimed: { background: colors.outline, color: "#fff" },
  };
  const s = styles[status] || styles.Active;
  return (
    <span
      style={{
        ...s,
        padding: "4px 12px",
        borderRadius: 9999,
        fontSize: 12,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
        animation: status === "Expiring Soon" ? "pulse 2s infinite" : "none",
      }}
    >
      {status}
    </span>
  );
}

function ListingCard({ listing }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 12px rgba(70,132,50,0.05)",
        border: "1px solid rgba(180,244,138,0.3)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s, box-shadow 0.2s",
        opacity: listing.muted ? 0.8 : 1,
        filter: listing.muted ? "grayscale(0.2)" : "none",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(70,132,50,0.08)";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(70,132,50,0.05)";
      }}
    >
      <div style={{ height: 192, position: "relative", flexShrink: 0 }}>
        <img
          src={listing.img}
          alt={listing.title}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
        <div style={{ position: "absolute", top: 12, left: 12 }}>
          <StatusBadge status={listing.status} />
        </div>
      </div>
      <div style={{ padding: 20, display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <h4 style={{ fontWeight: 600, fontSize: 20, lineHeight: "28px", color: colors.onSurface, marginBottom: 4 }}>
          {listing.title}
        </h4>
        <p style={{ fontSize: 15, color: colors.onSurfaceVariant, marginBottom: 16, flexGrow: 1 }}>
          {listing.desc}
        </p>
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: listing.expiryUrgent ? colors.error : colors.onSurfaceVariant }}>
            <Icon name={listing.expiryUrgent ? "warning" : (listing.status === "Claimed" ? "check_circle" : "schedule")} size={18} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>{listing.expiry}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: colors.onSurfaceVariant }}>
            <Icon name="shopping_basket" size={18} />
            <span style={{ fontSize: 12, fontWeight: 700 }}>{listing.claimed}</span>
          </div>
        </div>
        <div style={{ display: "flex", borderTop: `1px solid ${colors.outlineVariant}33`, paddingTop: 12, gap: 0 }}>
          {listing.actions.map((action, i) => {
            const isEdit = action === "edit";
            const isDelete = action === "delete";
            const isArchive = action === "archive";
            const isRelist = action === "relist";
            return (
              <div key={action} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                {i > 0 && <div style={{ width: 1, height: 32, background: `${colors.outlineVariant}33` }} />}
                <button
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    fontSize: 14,
                    fontWeight: 600,
                    color: isDelete ? colors.error : isRelist ? colors.primary : isArchive ? colors.onSurfaceVariant : colors.primary,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "8px 0",
                    borderRadius: 8,
                  }}
                >
                  <Icon
                    name={isEdit ? "edit" : isDelete ? "delete" : isArchive ? "history" : "refresh"}
                    size={20}
                  />
                  {isEdit ? "Edit" : isDelete ? "Delete" : isArchive ? "Archive" : "Relist"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function FeedbackProDashboard() {
  const [activeNav, setActiveNav] = useState("Listings");

  const navItems = [
    { label: "Marketplace", icon: "storefront" },
    { label: "Listings", icon: "list_alt" },
    { label: "Deliveries", icon: "local_shipping" },
    { label: "Analytics", icon: "monitoring" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Plus Jakarta Sans', sans-serif; background: #f8fbf0; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: colors.surface }}>
        {/* Top Nav */}
        <nav style={{
          background: colors.surface,
          boxShadow: "0 1px 3px rgba(70,132,50,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 24px",
          height: 72,
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}>
          <span style={{ fontWeight: 700, fontSize: 24, color: colors.primary }}>FeedBack</span>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
              {["Listings", "Deliveries", "Analytics"].map(item => (
                <a
                  key={item}
                  href="#"
                  style={{
                    fontSize: 14,
                    fontWeight: item === "Listings" ? 700 : 600,
                    color: item === "Listings" ? colors.primary : colors.onSurfaceVariant,
                    textDecoration: "none",
                    borderBottom: item === "Listings" ? `2px solid ${colors.primary}` : "2px solid transparent",
                    paddingBottom: 2,
                  }}
                >
                  {item}
                </a>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {["recycling", "notifications"].map(icon => (
                <button key={icon} style={{ background: "none", border: "none", cursor: "pointer", padding: 8, borderRadius: "50%", color: colors.onSurfaceVariant, display: "flex" }}>
                  <Icon name={icon} size={24} />
                </button>
              ))}
              <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", border: `2px solid ${colors.secondaryContainer}` }}>
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDdTSJmUIKcmGP_Jidwkyb9mSKYR_sXi4H_B7Jr3L1JGmKsaWKpvr3Px4G2_CDVOzqZSm6gyMRoGLN6R9tJKnjbqZVKZrUJY2907VjE_IVuFepr9FHW3SnhfPGjPwq2hMvw-vhtmik7QKCeXXjniNOOWhaGJdvcG36fwxhRG83jdTi0c60gtw2kHUn_oQLmvlKCfTClvU4S7t5pir8PyP0dOVhHzfQISkXFotYEXs4MboESJzQ67B4WwQPD6Y04REQMUx68lIzZqi_e"
                  alt="Profile"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            </div>
          </div>
        </nav>

        <div style={{ display: "flex", flexGrow: 1 }}>
          {/* Sidebar */}
          <aside style={{
            width: 256,
            flexShrink: 0,
            background: colors.surfaceContainerLow,
            borderRight: `1px solid ${colors.outlineVariant}33`,
            display: "flex",
            flexDirection: "column",
            padding: "24px 0",
            position: "sticky",
            top: 72,
            height: "calc(100vh - 72px)",
            overflowY: "auto",
          }}>
            <div style={{ padding: "0 24px", marginBottom: 32 }}>
              <h2 style={{ fontWeight: 700, fontSize: 22, color: colors.primary }}>FeedBack Pro</h2>
              <p style={{ fontSize: 12, color: colors.onSurfaceVariant, fontWeight: 700 }}>Sustainability Hub</p>
            </div>
            <nav style={{ flexGrow: 1 }}>
              {navItems.map(item => {
                const active = activeNav === item.label;
                return (
                  <a
                    key={item.label}
                    href="#"
                    onClick={e => { e.preventDefault(); setActiveNav(item.label); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 16px",
                      margin: "2px 8px",
                      borderRadius: 12,
                      background: active ? colors.secondaryContainer : "transparent",
                      color: active ? colors.onSecondaryContainer : colors.onSurfaceVariant,
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 600,
                      transition: "background 0.2s",
                    }}
                  >
                    <Icon name={item.icon} size={22} fill={active ? 1 : 0} />
                    {item.label}
                  </a>
                );
              })}
            </nav>
            <button style={{
              margin: "16px",
              background: colors.primaryContainer,
              color: colors.onPrimaryContainer,
              border: "none",
              borderRadius: 12,
              padding: "12px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(70,132,50,0.15)",
            }}>
              <Icon name="add_circle" size={22} />
              Add New Listing
            </button>
            <div style={{ borderTop: `1px solid ${colors.outlineVariant}33`, paddingTop: 8 }}>
              {["settings", "help"].map((icon, i) => (
                <a key={icon} href="#" style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
                  margin: "2px 8px", borderRadius: 12, color: colors.onSurfaceVariant,
                  textDecoration: "none", fontSize: 14, fontWeight: 600,
                }}>
                  <Icon name={icon} size={22} />
                  {i === 0 ? "Settings" : "Support"}
                </a>
              ))}
            </div>
          </aside>

          {/* Main */}
          <main style={{ flexGrow: 1, padding: 24, background: colors.surface, maxWidth: "100%" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              {/* Header */}
              <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
                <div>
                  <h1 style={{ fontWeight: 700, fontSize: 32, color: colors.onSurface, lineHeight: "40px" }}>Manage Listings</h1>
                  <p style={{ fontSize: 16, color: colors.onSurfaceVariant, marginTop: 4 }}>
                    Oversee your surplus food distribution and track your community impact.
                  </p>
                </div>
              </header>

              {/* Stats Bento */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 48 }}>
                {/* Active Listings */}
                <div style={{
                  background: "#fff", borderRadius: 16, padding: 24,
                  boxShadow: "0 4px 12px rgba(70,132,50,0.05)",
                  border: "1px solid rgba(180,244,138,0.3)",
                  borderLeft: `4px solid ${colors.primary}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: colors.onSurfaceVariant, marginBottom: 4 }}>Active Listings</p>
                      <h3 style={{ fontSize: 48, fontWeight: 800, color: colors.primary, lineHeight: 1 }}>12</h3>
                    </div>
                    <span style={{ background: colors.secondaryContainer, padding: 8, borderRadius: 8, display: "flex" }}>
                      <Icon name="inventory_2" size={24} style={{ color: colors.primary }} />
                    </span>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: colors.primary, marginTop: 16, display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="trending_up" size={16} /> 14% from last week
                  </p>
                </div>
                {/* Total Meals */}
                <div style={{
                  background: "#fff", borderRadius: 16, padding: 24,
                  boxShadow: "0 4px 12px rgba(70,132,50,0.05)",
                  border: "1px solid rgba(180,244,138,0.3)",
                  borderLeft: `4px solid ${colors.tertiary}`,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: colors.onSurfaceVariant, marginBottom: 4 }}>Total Meals Provided</p>
                      <h3 style={{ fontSize: 48, fontWeight: 800, color: colors.tertiary, lineHeight: 1 }}>1,482</h3>
                    </div>
                    <span style={{ background: `${colors.tertiaryFixed}33`, padding: 8, borderRadius: 8, display: "flex" }}>
                      <Icon name="restaurant" size={24} style={{ color: colors.tertiary }} />
                    </span>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: colors.onSurfaceVariant, marginTop: 16 }}>
                    Equivalent to 450kg CO₂ saved
                  </p>
                </div>
                {/* Trust Score */}
                <div style={{
                  background: colors.primaryContainer, borderRadius: 16, padding: 24,
                  boxShadow: "0 4px 12px rgba(70,132,50,0.1)",
                  color: colors.onPrimaryContainer, position: "relative", overflow: "hidden",
                }}>
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, opacity: 0.9, marginBottom: 4 }}>Community Trust Score</p>
                    <h3 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1 }}>4.9/5</h3>
                    <div style={{ display: "flex", gap: 4, marginTop: 16 }}>
                      {[1,2,3,4,5].map(i => (
                        <Icon key={i} name="star" size={24} fill={1} style={{ color: colors.tertiaryFixed }} />
                      ))}
                    </div>
                  </div>
                  <span style={{
                    position: "absolute", right: -16, bottom: -16, opacity: 0.1,
                    fontSize: 120, fontFamily: "Material Symbols Outlined",
                    fontVariationSettings: "'FILL' 1",
                    lineHeight: 1,
                  }}>volunteer_activism</span>
                </div>
              </div>

              {/* Listings Section */}
              <div style={{ marginBottom: 64 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <h2 style={{ fontWeight: 600, fontSize: 24, color: colors.onSurface }}>Live Listings</h2>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["filter_list", "search"].map(icon => (
                      <button key={icon} style={{
                        padding: 8, border: `1px solid ${colors.outlineVariant}`, borderRadius: 8,
                        background: "none", cursor: "pointer", display: "flex",
                        color: colors.onSurfaceVariant,
                      }}>
                        <Icon name={icon} size={22} />
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                  {listings.map(listing => (
                    <ListingCard key={listing.id} listing={listing} />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <footer style={{ textAlign: "center", paddingBottom: 48 }}>
                <div style={{ width: 96, height: 4, background: `${colors.outlineVariant}33`, borderRadius: 9999, margin: "0 auto 32px" }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: colors.onSurfaceVariant, marginBottom: 8 }}>
                  Need help with your listings?
                </p>
                <a href="#" style={{ fontSize: 14, fontWeight: 700, color: colors.primary, textDecoration: "none" }}>
                  Contact Vendor Support
                </a>
              </footer>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
