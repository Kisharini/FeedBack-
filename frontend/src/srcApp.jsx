import { useEffect, useState } from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import CurrentUserPage from "./pages/CurrentUserPage";
import PendingApprovalsPage from "./pages/PendingApprovalsPage";
import Register from "./pages/Register";
import MarketplacePage from "./pages/MarketplacePage";
import ListingDetailsPage from "./pages/ListingDetailsPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import AdminControlPanel from "./pages/AdminControlPanel";
import VendorListingDashboard from "./pages/VendorListingDashboard"; 

// IMPORTED: Match the file name exactly (RiderDeliveryHistory without 'Page')
import RiderDashboardPage from "./pages/RiderDashboardPage";
import RiderDeliveryHistory from "./pages/RiderDeliveryHistory"; 

const staticRoutes = {
  "/": LandingPage,
  "/login": LoginPage,
  "/register": Register,
  "/me": CurrentUserPage,
  "/admin/approvals": PendingApprovalsPage,
  "/marketplace": MarketplacePage,
  "/marketplace/checkout": CheckoutPage,
  "/marketplace/orders": OrderTrackingPage,
  "/admin/dashboard": AdminControlPanel,
  "/vendor/dashboard": VendorListingDashboard, 
  
  // CONNECTED: Map the path to the correctly imported component
  "/rider/dashboard": RiderDashboardPage,
  "/rider/history": RiderDeliveryHistory, 
};

const dynamicRoutes = [
  {
    match: /^\/marketplace\/listings\/([^/]+)$/,
    render: (pathname) => <ListingDetailsPage listingId={pathname.split("/").pop()} />,
  },
  {
    match: /^\/marketplace\/orders\/([^/]+)$/,
    render: (pathname) => <OrderTrackingPage orderId={pathname.split("/").pop()} />,
  },
];

export default function App() {
  const getPathname = () =>
    window.location.pathname === "/"
      ? "/"
      : window.location.pathname.replace(/\/+$/, "");

  const [pathname, setPathname] = useState(getPathname());

  useEffect(() => {
    const syncPathname = () => setPathname(getPathname());

    window.addEventListener("popstate", syncPathname);
    window.addEventListener("authchange", syncPathname);

    return () => {
      window.removeEventListener("popstate", syncPathname);
      window.removeEventListener("authchange", syncPathname);
    };
  }, []);

  if (staticRoutes[pathname]) {
    const CurrentPage = staticRoutes[pathname];
    return <CurrentPage />;
  }

  const matchedDynamicRoute = dynamicRoutes.find((route) => route.match.test(pathname));

  if (matchedDynamicRoute) {
    return matchedDynamicRoute.render(pathname);
  }

  return <LandingPage />;
}