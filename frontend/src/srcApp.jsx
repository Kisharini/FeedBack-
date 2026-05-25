import { useEffect, useState } from "react";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import CurrentUserPage from "./pages/CurrentUserPage";
import PendingApprovalsPage from "./pages/PendingApprovalsPage";
import Register from "./pages/Register";
import FeedbackProDashboard from "./FeedbackProDashboard"

const routes = {
  "/": LandingPage,
  "/login": LoginPage,
  "/register": Register,
  "/me": CurrentUserPage,
  "/admin/approvals": PendingApprovalsPage,
  "/vendordashboard": FeedbackProDashboard
};

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

  const CurrentPage = routes[pathname] ?? LandingPage;

  return <CurrentPage />;
}
