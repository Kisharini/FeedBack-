import { useEffect, useState } from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import CurrentUserPage from "./pages/CurrentUserPage";
import PendingApprovalsPage from "./pages/PendingApprovalsPage";
import Register from "./pages/Register";
<<<<<<< HEAD

const routes = {
  "/": LandingPage,
  "/login": LoginPage,
  "/register": Register,
  "/me": CurrentUserPage,
  "/admin/approvals": PendingApprovalsPage,
};

=======
import MarketplacePage from "./pages/MarketplacePage";
import ListingDetailsPage from "./pages/ListingDetailsPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import AdminControlPanel from "./pages/AdminControlPanel";
import ContactUsPage from "./pages/ContactUsPage";
import PartnerWithUsPage from "./pages/PartnerWithUsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/TermsOfServicePage";
import VendorListingDashboard from "./pages/VendorListingDashboard";
import VendorMyListingsPage from "./pages/VendorMyListingsPage";
import VendorOrderHistoryPage from "./pages/VendorOrderHistoryPage";

// IMPORTED: Match the file name exactly (RiderDeliveryHistory without 'Page')
import RiderDashboardPage from "./pages/RiderDashboardPage";
import RiderDeliveryHistory from "./pages/RiderDeliveryHistory";
import RiderWalletPage from "./pages/RiderWalletPage";

const staticRoutes = {
  "/": LandingPage,
  "/login": LoginPage,
  "/register": Register,
  "/privacy-policy": PrivacyPolicyPage,
  "/terms-of-service": TermsOfServicePage,
  "/contact-us": ContactUsPage,
  "/partner-with-us": PartnerWithUsPage,
  "/me": CurrentUserPage,
  "/admin/approvals": PendingApprovalsPage,
  "/marketplace": MarketplacePage,
  "/marketplace/checkout": CheckoutPage,
  "/marketplace/orders": OrderTrackingPage,
  "/admin/dashboard": AdminControlPanel,
  "/vendor/dashboard": VendorListingDashboard,
  "/vendor/listings": VendorMyListingsPage,
  "/vendor/orders": VendorOrderHistoryPage,
  "/vendordashboard": VendorListingDashboard,
  "/rider/dashboard": RiderDashboardPage,
  "/rider/history": RiderDeliveryHistory,
  "/rider/wallet": RiderWalletPage,
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

>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f
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

<<<<<<< HEAD
  const CurrentPage = routes[pathname] ?? LandingPage;

  return <CurrentPage />;
=======
  if (staticRoutes[pathname]) {
    const CurrentPage = staticRoutes[pathname];
    return <CurrentPage />;
  }

  const matchedDynamicRoute = dynamicRoutes.find((route) => route.match.test(pathname));

  if (matchedDynamicRoute) {
    return matchedDynamicRoute.render(pathname);
  }

  return <LandingPage />;
>>>>>>> 822f7ce03a154547be32d378797ba9d7209f164f
}
