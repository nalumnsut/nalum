import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProtectedVerificationRoute from "@/components/ProtectedVerificationRoute";
import { ChatProvider } from "@/context/ChatContext";
import { ProfileProvider } from "@/context/ProfileContext";

// Lazy loaded dashboard components
const DashboardLayout = lazy(() => import("@/pages/dashboard/DashboardLayout"));
const DashboardHome = lazy(() => import("@/pages/dashboard/DashboardHome"));
const ShowProfile = lazy(() => import("@/pages/dashboard/showProfile"));
const UpdateProfile = lazy(() => import("@/pages/dashboard/updateProfile"));
const ChangePassword = lazy(() => import("@/pages/dashboard/ChangePassword"));
const AlumniDirectory = lazy(() => import("@/pages/dashboard/alumniDirectory"));
const ViewProfile = lazy(() => import("@/pages/dashboard/viewProfile"));
const ConnectionsPage = lazy(() => import("@/pages/dashboard/ConnectionsPage"));
const VerifyAlumni = lazy(() => import("@/pages/dashboard/verifyAlumni"));
const ChatPage = lazy(() => import("@/pages/dashboard/chat/ChatPage").then(module => ({ default: module.ChatPage })));
const Events = lazy(() => import("@/pages/dashboard/Events"));
const HostEvent = lazy(() => import("@/pages/dashboard/HostEvent"));
const MyPosts = lazy(() => import("@/pages/dashboard/MyPosts"));
const CreatePost = lazy(() => import("@/pages/dashboard/CreatePost"));
const ViewPost = lazy(() => import("@/pages/dashboard/ViewPost"));
const Queries = lazy(() => import("@/pages/dashboard/Queries"));
const Giving = lazy(() => import("@/pages/dashboard/Giving"));
const MobileNotifications = lazy(() => import("@/pages/dashboard/MobileNotifications"));

export function DashboardRoutes() {
  return (
    <>
      {/* Verification Route - requires auth but not verification */}
      <Route
        path="/dashboard/verify-alumni"
        element={
          <ProtectedRoute>
            <ProfileProvider>
              <VerifyAlumni />
            </ProfileProvider>
          </ProtectedRoute>
        }
      />

      {/* Protected Dashboard Routes - require verification */}
      <Route
        element={
          <ProtectedRoute>
            <ProtectedVerificationRoute>
              <ChatProvider>
                <DashboardLayout />
              </ChatProvider>
            </ProtectedVerificationRoute>
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardHome />} />
        <Route path="/dashboard/profile" element={<ShowProfile />} />
        <Route path="/dashboard/update-profile" element={<UpdateProfile />} />
        <Route path="/dashboard/change-password" element={<ChangePassword />} />
        <Route path="/dashboard/alumni" element={<AlumniDirectory />} />
        <Route path="/dashboard/alumni/:userId" element={<ViewProfile />} />
        <Route path="/dashboard/connections" element={<ConnectionsPage />} />
        <Route path="/dashboard/notifications" element={<MobileNotifications />} />
        
        {/* Chat routes */}
        <Route
          path="/dashboard/chat/*"
          element={
            <Routes>
              <Route index element={<ChatPage />} />
              <Route path=":conversationId" element={<ChatPage />} />
            </Routes>
          }
        />
        
        <Route path="/dashboard/events" element={<Events />} />
        <Route path="/dashboard/posts" element={<CreatePost />} />
        <Route path="/dashboard/posts/:postId" element={<ViewPost />} />
        <Route path="/dashboard/my-posts" element={<MyPosts />} />
        <Route path="/dashboard/host-event" element={<HostEvent />} />
        <Route path="/dashboard/queries" element={<Queries />} />
        <Route path="/dashboard/giving" element={<Giving />} />
      </Route>
    </>
  );
}
