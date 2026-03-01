import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import { PublicRoutes } from "./publicRoutes";
import { AuthRoutes } from "./authRoutes";
import { DashboardRoutes } from "./dashboardRoutes";
import { AdminRoutes } from "./adminRoutes";

// Lazy loaded 404 page
const NotFound = lazy(() => import("@/pages/NotFound"));

// Fallback loading component
const RouteLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-gray-200 border-t-red-600 rounded-full animate-spin" />
  </div>
);

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        {PublicRoutes()}

        {/* Auth Routes */}
        {AuthRoutes()}

        {/* Dashboard Routes */}
        {DashboardRoutes()}

        {/* Admin Routes */}
        {AdminRoutes()}

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
