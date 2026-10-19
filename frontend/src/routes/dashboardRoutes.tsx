import { lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
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
  loadVerifyAlumni,
  loadChatPage,
  loadEvents,
  loadEventDetails,
  loadEditEvent,
  loadHostEvent,
  loadPosts,
  loadPostEditor,
  loadViewPost,
  loadQueries,
  loadGiving,
  loadMobileNotifications,
  loadChangePassword,
} from "./loaders";

const DashboardLayout = lazy(loadDashboardLayout);
const DashboardHome = lazy(loadDashboardHome);
const ShowProfile = lazy(loadShowProfile);
const UpdateProfile = lazy(loadUpdateProfile);
const AlumniDirectory = lazy(loadAlumniDirectory);
const ViewProfile = lazy(loadViewProfile);
const VerifyAlumni = lazy(loadVerifyAlumni);
const ChatPage = lazy(loadChatPage);
const Events = lazy(loadEvents);
const EventDetails = lazy(loadEventDetails);
const EditEvent = lazy(loadEditEvent);
const HostEvent = lazy(loadHostEvent);
const Posts = lazy(loadPosts);
const PostEditor = lazy(loadPostEditor);
const ViewPost = lazy(loadViewPost);
const Queries = lazy(loadQueries);
const Giving = lazy(loadGiving);
const MobileNotifications = lazy(loadMobileNotifications);
const ChangePassword = lazy(loadChangePassword);

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
        {/* Connections used to be its own page; it's now the "My Connections" tab on Directory. */}
        <Route
          path="/dashboard/connections"
          element={<Navigate to="/dashboard/alumni?tab=my" replace />}
        />
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
        <Route path="/dashboard/events/:eventId" element={<EventDetails />} />
        <Route path="/dashboard/events/:eventId/edit" element={<EditEvent />} />
        <Route path="/dashboard/posts" element={<Posts />} />
        <Route path="/dashboard/posts/new" element={<PostEditor mode="create" />} />
        <Route path="/dashboard/posts/:postId" element={<ViewPost />} />
        <Route
          path="/dashboard/posts/:postId/edit"
          element={<PostEditor mode="edit" />}
        />
        {/* Posts used to live at its own URL; keep old links and bookmarks working. */}
        <Route
          path="/dashboard/my-posts"
          element={<Navigate to="/dashboard/posts?tab=my" replace />}
        />
        <Route path="/dashboard/host-event" element={<HostEvent />} />
        <Route path="/dashboard/queries" element={<Queries />} />
        <Route path="/dashboard/giving" element={<Giving />} />
      </Route>
    </>
  );
}
