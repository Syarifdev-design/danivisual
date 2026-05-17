import { createBrowserRouter } from "react-router";
import RootLayout from "./layouts/RootLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Public Pages
import HomePage from "./pages/HomePage";
import PortfolioPage from "./pages/PortfolioPage";
import AlbumDetailPage from "./pages/AlbumDetailPage";
import ServicesPage from "./pages/ServicesPage";
import AboutPage from "./pages/AboutPage";
import FAQPage from "./pages/FAQPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import PackageSelectionPage from "./pages/PackageSelectionPage";
import CheckoutPage from "./pages/CheckoutPage";
import BookingReviewPage from "./pages/BookingReviewPage";
import BookingSuccessPage from "./pages/BookingSuccessPage";

// Dashboard Pages
import MyBooking from "./pages/dashboard/MyBooking";
import Progress from "./pages/dashboard/Progress";
import Account from "./pages/dashboard/Account";

import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "portfolio", Component: PortfolioPage },
      { path: "portfolio/:albumId", Component: AlbumDetailPage },
      { path: "services", Component: ServicesPage },
      { path: "about", Component: AboutPage },
      { path: "faq", Component: FAQPage },
      { path: "contact", Component: ContactPage },
      { path: "login", Component: LoginPage },
      { path: "packages", Component: PackageSelectionPage },
      { path: "checkout", Component: CheckoutPage },
      { path: "booking-review", Component: BookingReviewPage },
      { path: "booking-success", Component: BookingSuccessPage },
    ],
  },
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { index: true, Component: MyBooking },
      { path: "my-booking", Component: MyBooking },
      { path: "progress", Component: Progress },
      { path: "account", Component: Account },
    ],
  },
  {
    path: "*",
    Component: NotFound,
  },
]);
