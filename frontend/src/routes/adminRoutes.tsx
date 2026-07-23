import { lazy } from "react";
import { Navigate, Route } from "react-router-dom";
import {
  loadAdminProtectedRoute,
  loadAdminDashboard,
  loadVerificationQueue,
  loadUserManagement,
  loadEventApprovals,
  loadCurrentEvents,
  loadPostsApproval,
  loadCurrentPosts,
  loadNewsletters,
  loadBannedUsers,
  loadCodeManagement,
  loadAlumniDatabase,
  loadReports,
  loadQueryManagement,
  loadGivingManagement,
} from "./loaders";

// Lazy loaded admin components with shared loaders
const AdminProtectedRoute = lazy(loadAdminProtectedRoute);
const AdminDashboard = lazy(loadAdminDashboard);
const VerificationQueue = lazy(loadVerificationQueue);
const UserManagement = lazy(loadUserManagement);
const EventApprovals = lazy(loadEventApprovals);
const CurrentEvents = lazy(loadCurrentEvents);
const PostsApproval = lazy(loadPostsApproval);
const CurrentPosts = lazy(loadCurrentPosts);
const Newsletters = lazy(loadNewsletters);
const BannedUsers = lazy(loadBannedUsers);
const CodeManagement = lazy(loadCodeManagement);
const AlumniDatabase = lazy(loadAlumniDatabase);
const Reports = lazy(loadReports);
const QueryManagement = lazy(loadQueryManagement);
const GivingManagement = lazy(loadGivingManagement);

export function AdminRoutes() {
  return (
    <>
      <Route element={<AdminProtectedRoute />}>
        <Route path="/admin-panel/dashboard" element={<AdminDashboard />} />
        <Route path="/admin-panel/verification" element={<VerificationQueue />} />
        <Route path="/admin-panel/verifications" element={<VerificationQueue />} />
        <Route path="/admin-panel/users" element={<UserManagement />} />
        <Route path="/admin-panel/events" element={<EventApprovals />} />
        <Route path="/admin-panel/current-events" element={<CurrentEvents />} />
        <Route path="/admin-panel/posts-approval" element={<PostsApproval />} />
        <Route path="/admin-panel/current-posts" element={<CurrentPosts />} />
        <Route path="/admin-panel/newsletters" element={<Newsletters />} />
        <Route path="/admin-panel/banned" element={<BannedUsers />} />
        <Route path="/admin-panel/codes" element={<CodeManagement />} />
        <Route path="/admin-panel/alumni-database" element={<AlumniDatabase />} />
        <Route path="/admin-panel/reports" element={<Reports />} />
        <Route path="/admin-panel/queries" element={<QueryManagement />} />
        <Route path="/admin-panel/givings" element={<GivingManagement />} />
      </Route>
      
      <Route path="/admin-panel" element={<Navigate to="/admin-panel/dashboard" replace />} />
      <Route path="/admin-panel/login" element={<Navigate to="/login" replace />} />
    </>
  );
}
