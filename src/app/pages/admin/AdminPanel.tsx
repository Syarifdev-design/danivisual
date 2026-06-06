import { useState, useEffect } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router";
import AdminLayout from "../../admin/layout/AdminLayout";
import AdminPageHeader from "../../admin/components/AdminPageHeader";
import AdminPreviewCard from "../../admin/components/AdminPreviewCard";
import AdminStatusBadge from "../../admin/components/AdminStatusBadge";
import AdminDashboard from "../../admin/pages/AdminDashboard";
import FAQContentPage from "../../admin/pages/FAQContentPage";
import HomeContentPage from "../../admin/pages/HomeContentPage";
import AboutContentPage from "../../admin/pages/AboutContentPage";
import PortfolioContentPage from "../../admin/pages/PortfolioContentPage";
import ServicesContentPage from "../../admin/pages/ServicesContentPage";
import ContactContentPage from "../../admin/pages/ContactContentPage";
import InquiriesPage from "../../admin/pages/InquiriesPage";
import ProductionPage from "../../pages/admin/ProductionPage";
import PaymentsPage from "../../pages/admin/PaymentsPage";
import BookingsPage from "../../pages/admin/BookingsPage";
import FinanceReportPage from "../../pages/admin/FinanceReportPage";
import EmployeesPage from "./EmployeesPage";
import AttendancePage from "./AttendancePage";
import AnalyticsPage from "./AnalyticsPage";
import SettingsPage from "./SettingsPage";
import { useAuth } from "../../contexts/AuthContext";
import { canAccessAdminMenuItem, isAdminRole, isOperationalStaffRole } from "../../utils/permissions";
import PackagesPage from "./PackagesPage";
import CustomersPage from "./CustomersPage";
import UnauthorizedPage from "../Unauthorized";

const placeholderDescriptions: Record<string, string> = {
  "Website Content": "Manage public website copy, hero images, SEO, and editorial page sections.",
  Portfolio: "Curate portfolio albums, cover images, gallery order, and story metadata.",
  Services: "Edit service narratives, inclusions, highlights, and image previews.",
  About: "Edit about page content, story sections, team introductions, and company history.",
  FAQ: "Publish categorized client questions with clean accordion-ready content.",
  Contact: "Manage contact information, social links, studio address, and inquiry form settings.",
  Inquiries: "View and manage inquiry submissions from the contact form.",
  Packages: "Manage package categories, tiers, service types, benefits, and pricing.",
  Bookings: "Review reservations, client details, event schedule, and admin notes.",
  Payments: "Verify deposits and settlement proofs with minimal payment status tracking.",
  Production: "Track sorting, editing, printing, finishing, and delivery stages.",
  Customers: "Manage client records, contacts, booking history, and notes.",
  Employees: "Manage team members, roles, assignments, and production availability.",
  Attendance: "Review team attendance and field schedules.",
  Finance: "Review revenue, expenses, settlement, and monthly reports.",
  Traffic: "Review website visits, conversion sources, and content performance.",
  Settings: "Configure brand settings, navbar menu, users, and roles.",
};

// Route mapping for admin pages
const ROUTE_TO_PAGE: Record<string, string> = {
  "dashboard": "Dashboard",
  "content/home": "Website Content",
  "content/about": "About",
  "content/portfolio": "Portfolio",
  "content/services": "Services",
  "content/faq": "FAQ",
  "content/contact": "Contact",
  "content/inquiries": "Inquiries",
  "reservation/packages": "Packages",
  "payments": "Payments",
  "finance": "Finance",
  "production": "Production",
  "bookings": "Bookings",
  "customers": "Customers",
  "employees": "Employees",
  "my-kpi": "My KPI",
  "attendance": "Attendance",
  "traffic": "Traffic",
  "settings": "Settings",
};

export default function AdminPanel() {
  const { isAuthenticated, user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();

  // Determine the current page based on route
  const getCurrentPage = () => {
    // Remove leading slash and match route
    const path = location.pathname.replace(/^\/admin\/?/, "");
    const pageKey = path || "dashboard";
    const shouldUseStaffKpiLabel = user ? isOperationalStaffRole(user.role) : false;

    // Find matching page
    for (const [route, pageName] of Object.entries(ROUTE_TO_PAGE)) {
      if (pageKey === route || pageKey.startsWith(route + "/")) {
        if (route === "employees" && shouldUseStaffKpiLabel) return "My KPI";
        if (route === "production" && (user?.role === "photographer" || user?.role === "videographer")) return "Production Tasks";
        return pageName;
      }
    }

    // Check if it's a direct path like /admin/content/home or /admin/content/about
    if (location.pathname.includes("/content/home")) return "Website Content";
    if (location.pathname.includes("/content/about")) return "About";
    if (location.pathname.includes("/content/portfolio")) return "Portfolio";
    if (location.pathname.includes("/content/services")) return "Services";
    if (location.pathname.includes("/content/faq")) return "FAQ";
    if (location.pathname.includes("/content/contact")) return "Contact";
    if (location.pathname.includes("/content/inquiries")) return "Inquiries";
    if (location.pathname.includes("/reservation/packages")) return "Packages";
    if (location.pathname.includes("/payments")) return "Payments";
    if (location.pathname.includes("/finance")) return "Finance";
    if (location.pathname.includes("/production")) {
      return user?.role === "photographer" || user?.role === "videographer"
        ? "Production Tasks"
        : "Production";
    }

    return "Dashboard";
  };

  const [activeItem, setActiveItem] = useState(getCurrentPage);

  // Update active item when route changes
  useEffect(() => {
    setActiveItem(getCurrentPage());
  }, [location.pathname]);

  // Auth check
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Role check - allow all admin roles
  if (!user || !isAdminRole(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  const handleSelectItem = (item: string) => {
    if (!user || !canAccessAdminMenuItem(user.role, item)) return;
    setActiveItem(item);

    // Navigate to appropriate route
    const routeMap: Record<string, string> = {
      "Dashboard": "/admin",
      "Website Content": "/admin/content/home",
      "About": "/admin/content/about",
      "Portfolio": "/admin/content/portfolio",
      "Services": "/admin/content/services",
      "FAQ": "/admin/content/faq",
      "Contact": "/admin/content/contact",
      "Inquiries": "/admin/content/inquiries",
      "Packages": "/admin/reservation/packages",
      "Bookings": "/admin/bookings",
      "Payments": "/admin/payments",
      "Production": "/admin/production",
      "Production Tasks": "/admin/production",
      "Customers": "/admin/customers",
      "Employees": "/admin/employees",
      "My KPI": "/admin/my-kpi",
      "Attendance": "/admin/attendance",
      "Finance": "/admin/finance",
      "Traffic": "/admin/traffic",
      "Settings": "/admin/settings",
    };

    const route = routeMap[item];
    if (route) {
      navigate(route);
    }
  };

  // Determine which page to render
  const renderPage = () => {
    if (!user || !canAccessAdminMenuItem(user.role, activeItem)) {
      return (
        <UnauthorizedPage
          requiredRole="authorized staff management"
          message="Anda tidak memiliki akses ke halaman admin ini."
        />
      );
    }

    switch (activeItem) {
      case "Dashboard":
        return <AdminDashboard />;
      case "Website Content":
        return <HomeContentPage />;
      case "About":
        return <AboutContentPage />;
      case "Portfolio":
        return <PortfolioContentPage />;
      case "Services":
        return <ServicesContentPage />;
      case "FAQ":
        return <FAQContentPage />;
      case "Contact":
        return <ContactContentPage />;
      case "Inquiries":
        return <InquiriesPage />;
      case "Packages":
        return <PackagesPage />;
      case "Bookings":
        return <BookingsPage />;
      case "Payments":
        return <PaymentsPage />;
      case "Finance":
        return <FinanceReportPage />;
      case "Employees":
      case "My KPI":
        return <EmployeesPage />;
      case "Attendance":
        return <AttendancePage />;
      case "Traffic":
        return <AnalyticsPage />;
      case "Settings":
        return <SettingsPage />;
      case "Production":
      case "Production Tasks":
        return <ProductionPage />;
      case "Customers":
        return <CustomersPage />;
      default:
        return (
          <div>
            <AdminPageHeader
              eyebrow="Danivisual Admin"
              title={activeItem}
              description={placeholderDescriptions[activeItem] || "This admin section will be built in the next MVP step."}
              actions={
                <button className="min-h-11 bg-dark-premium px-5 text-sm text-white transition hover:bg-dark-premium/90">
                  Create New
                </button>
              }
            />
            <div className="grid gap-6 lg:grid-cols-3">
              <AdminPreviewCard eyebrow="MVP Placeholder" title={`${activeItem} Editor`}>
                <p className="mb-4">
                  This section is ready for the next build phase. The visual system is already aligned with the public frontend.
                </p>
                <AdminStatusBadge tone="gold">Design Shell Ready</AdminStatusBadge>
              </AdminPreviewCard>
              <AdminPreviewCard eyebrow="Style" title="Premium Editorial">
                <p>White background, thin borders, black actions, beige accents, clean tables, and calm status badges.</p>
              </AdminPreviewCard>
              <AdminPreviewCard eyebrow="Data" title="Ready to Connect">
                <p>Connect to Supabase for full functionality including user management and data persistence.</p>
              </AdminPreviewCard>
            </div>
          </div>
        );
    }
  };

  return (
    <AdminLayout activeItem={activeItem} onSelectItem={handleSelectItem} onLogout={logout}>
      {renderPage()}
    </AdminLayout>
  );
}
