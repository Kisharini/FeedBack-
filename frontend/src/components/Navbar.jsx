import logo from "../assets/logo.png";
import NotificationBell from "./NotificationBell";
import { clearAuth, getCurrentUserFromStorage } from "../lib/auth";
import { navigateTo } from "../lib/navigation";

const getPathname = () =>
  window.location.pathname === "/"
    ? "/"
    : window.location.pathname.replace(/\/+$/, "");

const getNavButtonClassName = (isActive) =>
  isActive
    ? "rounded-full bg-[#213722] px-5 py-2 font-label-md text-label-md text-white shadow-[0_10px_24px_rgba(33,55,34,0.18)] transition-all hover:bg-[#162617]"
    : "rounded-full border border-[#e2e7d8] bg-white/85 px-5 py-2 font-label-md text-label-md text-[#415041] shadow-[0_8px_20px_rgba(104,97,59,0.05)] transition-all hover:border-[#b9d48f] hover:bg-[#f7fbf1]";

export default function Navbar() {
  const currentUser = getCurrentUserFromStorage();
  const pathname = getPathname();

  const handleLogout = () => {
    clearAuth();
    navigateTo("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#e8eddc] bg-[linear-gradient(180deg,rgba(255,252,238,0.98)_0%,rgba(248,249,244,0.96)_100%)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Brand Identity / Logo Action */}
        <button
          type="button"
          onClick={() => navigateTo("/")}
          className="group flex items-center gap-3"
        >
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(255,168,57,0.24)_0%,rgba(255,168,57,0)_70%)] blur-md" />
            <img
              src={logo}
              alt="Feedback logo"
              className="relative h-16 w-16 rounded-full border-4 border-surface-container-lowest bg-surface-container-lowest object-cover shadow-[0_14px_30px_rgba(104,97,59,0.14)] transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>
          <span className="font-display text-h2 text-primary transition-colors hover:text-[#FFA02E]">
            FeedBack
          </span>
        </button>

        {/* Dynamic Contextual Action Control Links */}
        <div className="flex flex-wrap items-center justify-end gap-3">
          {currentUser ? (
            <>
              <NotificationBell />

              {/* Individual and NGO Public View Controls */}
              {["INDIVIDUAL", "NGO"].includes(currentUser.role) && (
                <>
                  <button
                    type="button"
                    onClick={() => navigateTo("/marketplace")}
                    className={getNavButtonClassName(pathname === "/marketplace")}
                  >
                    Marketplace
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/marketplace/orders")}
                    className={getNavButtonClassName(pathname === "/marketplace/orders")}
                  >
                    Track Orders
                  </button>
                </>
              )}

              {/* Vendor Management Actions ( MERCHANT verification removed ) */}
              {currentUser.role === "VENDOR" && (
                <>
                  <button
                    type="button"
                    onClick={() => navigateTo("/vendor/dashboard")} 
                    className={getNavButtonClassName(pathname === "/vendor/dashboard")}
                  >
                    Create Listing
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/vendor/listings")}
                    className={getNavButtonClassName(pathname === "/vendor/listings")}
                  >
                    My Listings
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/vendor/orders")}
                    className={getNavButtonClassName(pathname === "/vendor/orders")}
                  >
                    Order History
                  </button>
                </>
              )}

              {/* Rider / Delivery Driver Tracking Management Actions */}
              {currentUser.role === "RIDER" && (
                <>
                  <button
                    type="button"
                    onClick={() => navigateTo("/rider/dashboard")}
                    className={getNavButtonClassName(pathname === "/rider/dashboard")}
                  >
                    Delivery Jobs
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/rider/history")}
                    className={getNavButtonClassName(pathname === "/rider/history")}
                  >
                    Delivery History
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/rider/wallet")}
                    className={getNavButtonClassName(pathname === "/rider/wallet")}
                  >
                    Wallet
                  </button>
                </>
              )}

              {/* General Account Access Endpoint */}
              <button
                type="button"
                onClick={() => navigateTo("/me")}
                className={getNavButtonClassName(pathname === "/me")}
              >
                My Account
              </button>

              {/* Administrative Back-Office Approvals Portal */}
              {currentUser.role === "ADMIN" && (
                <>
                  <button
                    type="button"
                    onClick={() => navigateTo("/admin/dashboard")}
                    className={getNavButtonClassName(pathname === "/admin/dashboard")}
                  >
                    Admin Panel
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/admin/approvals")}
                    className={getNavButtonClassName(pathname === "/admin/approvals")}
                  >
                    Approvals
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo("/admin/users")}
                    className={getNavButtonClassName(pathname === "/admin/users")}
                  >
                    Accounts
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handleLogout}
                className="rounded-full bg-[#eef7e3] px-4 py-2 font-label-md text-label-md text-primary transition-all hover:bg-[#fff1d6] hover:text-[#FFA02E]"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {/* Unauthenticated View Access fallbacks */}
              <button
                type="button"
                onClick={() => navigateTo("/login")}
                className={getNavButtonClassName(pathname === "/login")}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => navigateTo("/register")}
                className="rounded-full bg-[#eef7e3] px-4 py-2 font-label-md text-label-md text-primary transition-all hover:bg-[#fff1d6] hover:text-[#FFA02E]"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}