import { createBrowserRouter } from "react-router";
import RootLayout from "./layouts/RootLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import { AdminRoute, CustomerRoute, GuestRoute } from "./components/ProtectedRoute";

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
import UnauthorizedPage from "./pages/Unauthorized";

// Dashboard Pages (Protected - Customer Only)
import MyBooking from "./pages/dashboard/MyBooking";
import Progress from "./pages/dashboard/Progress";
import Account from "./pages/dashboard/Account";
import CustomerLogin from "./pages/dashboard/CustomerLogin";
import PaymentStatus from "./pages/dashboard/PaymentStatus";
import Help from "./pages/dashboard/Help";
import DashboardHome from "./pages/dashboard/DashboardHome";
import PhotoSelection from "./pages/dashboard/PhotoSelection";

// Admin Pages (Protected - Admin/Staff Only)
import AdminPanel from "./pages/admin/AdminPanel";

import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  // ============================================================================
  // Public Routes
  // ============================================================================
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
      { path: "packages", Component: PackageSelectionPage },
      { path: "checkout", Component: CheckoutPage },
      { path: "booking-review", Component: BookingReviewPage },
      { path: "booking-success", Component: BookingSuccessPage },
    ],
  },

  // ============================================================================
  // Auth Routes (Guest Only - redirect if logged in)
  // ============================================================================
  {
    path: "/login",
    Component: () => (
      <GuestRoute redirectPath="/">
        <LoginPage />
      </GuestRoute>
    ),
  },

  // ============================================================================
  // Dashboard Routes (Customer Only)
  // ============================================================================
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      {
        index: true,
        Component: () => (
          <CustomerRoute>
            <DashboardHome />
          </CustomerRoute>
        ),
      },
      { path: "login", Component: CustomerLogin },
      {
        path: "my-booking",
        Component: () => (
          <CustomerRoute>
            <MyBooking />
          </CustomerRoute>
        ),
      },
      {
        path: "payment-status",
        Component: () => (
          <CustomerRoute>
            <PaymentStatus />
          </CustomerRoute>
        ),
      },
      {
        path: "progress",
        Component: () => (
          <CustomerRoute>
            <Progress />
          </CustomerRoute>
        ),
      },
      {
        path: "photo-selection",
        Component: () => (
          <CustomerRoute>
            <PhotoSelection />
          </CustomerRoute>
        ),
      },
      {
        path: "help",
        Component: () => (
          <CustomerRoute>
            <Help />
          </CustomerRoute>
        ),
      },
      {
        path: "account",
        Component: () => (
          <CustomerRoute>
            <Account />
          </CustomerRoute>
        ),
      },
    ],
  },

  // ============================================================================
  // Admin Routes (Admin/Staff Only)
  // ============================================================================
  {
    path: "/admin/*",
    Component: () => (
      <AdminRoute>
        <AdminPanel />
      </AdminRoute>
    ),
  },

  // ============================================================================
  // Unauthorized Page
  // ============================================================================
  {
    path: "/unauthorized",
    Component: UnauthorizedPage,
  },

  // ============================================================================
  // 404 Not Found
  // ============================================================================
  {
    path: "*",
    Component: NotFound,
  },
]);
