/**
 * Shared dynamic import functions used by React.lazy() and route preloading.
 * Keeping a single import() per page ensures the bundler dedupes chunks correctly.
 */

// Public layout & pages
export const loadRoot = () => import("@/pages/Root");
export const loadHomePage = () => import("@/pages/HomePage");
export const loadNotableAlumni = () => import("@/pages/stories/notableAlumni");
export const loadAlumniStories = () => import("@/pages/stories/alumniStories");
export const loadGivingStories = () => import("@/pages/stories/givingStories");
export const loadCampusNews = () => import("@/pages/stories/campusNews");
export const loadClubsPage = () => import("@/pages/communities/clubs");
export const loadIndustriesPage = () => import("@/pages/communities/industries");
export const loadRecentGradsPage = () => import("@/pages/communities/recentGrads");
export const loadLearningPage = () => import("@/pages/benefits/learning");
export const loadCareerPage = () => import("@/pages/benefits/career");
export const loadAlumniDirectoryHome = () => import("@/pages/benefits/alumniDirectoryHome");
export const loadGivingHome = () => import("@/pages/benefits/givingHome");
export const loadAttendAnEvent = () => import("@/pages/events/attendAnEvent");
export const loadEventsHome = () => import("@/pages/events/EventsHome");
export const loadExploreCommunities = () => import("@/pages/communities/exploreCommunities");
export const loadAboutPage = () => import("@/pages/About");
export const loadAlumniMapPage = () => import("@/pages/AlumniMapPage");

// Auth pages
export const loadLogin = () => import("@/pages/auth/Login");
export const loadSignUp = () => import("@/pages/auth/SignUp");
export const loadOtpVerificationPage = () => import("@/pages/auth/OtpVerificationPage");
export const loadProfileForm = () => import("@/pages/auth/ProfileForm");
export const loadForgotPassword = () => import("@/pages/auth/ForgotPassword");
export const loadResetPassword = () => import("@/pages/auth/ResetPassword");

// Dashboard
export const loadDashboardLayout = () => import("@/pages/dashboard/DashboardLayout");
export const loadDashboardHome = () => import("@/pages/dashboard/DashboardHome");
export const loadShowProfile = () => import("@/pages/dashboard/showProfile");
export const loadUpdateProfile = () => import("@/pages/dashboard/updateProfile");
export const loadAlumniDirectory = () => import("@/pages/dashboard/alumniDirectory");
export const loadViewProfile = () => import("@/pages/dashboard/viewProfile");
export const loadConnectionsPage = () => import("@/pages/dashboard/ConnectionsPage");
export const loadVerifyAlumni = () => import("@/pages/dashboard/verifyAlumni");
export const loadChatPage = () =>
  import("@/pages/dashboard/chat/ChatPage").then((module) => ({ default: module.ChatPage }));
export const loadEvents = () => import("@/pages/dashboard/Events");
export const loadHostEvent = () => import("@/pages/dashboard/HostEvent");
export const loadMyPosts = () => import("@/pages/dashboard/MyPosts");
export const loadCreatePost = () => import("@/pages/dashboard/CreatePost");
export const loadViewPost = () => import("@/pages/dashboard/ViewPost");
export const loadQueries = () => import("@/pages/dashboard/Queries");
export const loadGiving = () => import("@/pages/dashboard/Giving");
export const loadMobileNotifications = () => import("@/pages/dashboard/MobileNotifications");

// Admin pages
export const loadAdminProtectedRoute = () => import("@/components/admin/AdminProtectedRoute");
export const loadAdminDashboard = () => import("@/pages/admin/AdminDashboard");
export const loadVerificationQueue = () => import("@/pages/admin/VerificationQueue");
export const loadUserManagement = () => import("@/pages/admin/UserManagement");
export const loadEventApprovals = () => import("@/pages/admin/EventApprovals");
export const loadCurrentEvents = () => import("@/pages/admin/CurrentEvents");
export const loadPostsApproval = () => import("@/pages/admin/PostsApproval");
export const loadCurrentPosts = () => import("@/pages/admin/CurrentPosts");
export const loadNewsletters = () => import("@/pages/admin/Newsletters");
export const loadBannedUsers = () => import("@/pages/admin/BannedUsers");
export const loadCodeManagement = () => import("@/pages/admin/CodeManagement");
export const loadAlumniDatabase = () => import("@/pages/admin/AlumniDatabase");
export const loadReports = () => import("@/pages/admin/Reports");
export const loadQueryManagement = () => import("@/pages/admin/QueryManagement");
export const loadGivingManagement = () => import("@/pages/admin/GivingManagement");

// Misc
export const loadNotFound = () => import("@/pages/NotFound");
