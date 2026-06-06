import { Outlet, Navigate } from "react-router";
import DashboardSidebar from "../components/DashboardSidebar";
import DashboardHeader from "../components/DashboardHeader";
import { useAuth } from "../contexts/AuthContext";

export default function DashboardLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-surface min-h-screen">
      <div className="flex flex-col lg:block lg:pl-60">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col">
          <DashboardHeader />
          <main className="flex-1 px-5 py-6 pb-28 transition-opacity duration-300 lg:p-6 lg:pt-28">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
