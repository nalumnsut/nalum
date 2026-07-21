import { lazy } from "react";
import { Route, Routes } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import ProtectedVerificationRoute from "@/components/ProtectedVerificationRoute";
import { ChatProvider } from "@/context/ChatContext";
import { ProfileProvider } from "@/context/ProfileContext";
import {
  loadDashboardLayout,
  loadDashboardHome,
  loadShowProfile,
  loadUpdateProfile,
  loadAlumniDirectory,
  loadViewProfile,
  loadConnectionsPage,
  loadVerifyAlumni,
  loadChatPage,
  loadEvents,
  loadHostEvent,
  loadMyPosts,
  loadCreatePost,
  loadViewPost,
  loadQueries,
  loadGiving,
  loadMobileNotifications,
} from "./loaders";

const DashboardLayout = lazy(loadDashboardLayout);
const DashboardHome = lazy(loadDashboardHome);
const ShowProfile = lazy(loadShowProfile);
const UpdateProfile = lazy(loadUpdateProfile);
const AlumniDirectory = lazy(loadAlumniDirectory);
const ViewProfile = lazy(loadViewProfile);
const ConnectionsPage = lazy(loadConnectionsPage);
const VerifyAlumni = lazy(loadVerifyAlumni);
const ChatPage = lazy(loadChatPage);
const Events = lazy(loadEvents);
const HostEvent = lazy(loadHostEvent);
const MyPosts = lazy(loadMyPosts);
const CreatePost = lazy(loadCreatePost);
const ViewPost = lazy(loadViewPost);
const Queries = lazy(loadQueries);
const Giving = lazy(loadGiving);
const MobileNotifications = lazy(loadMobileNotifications);

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
