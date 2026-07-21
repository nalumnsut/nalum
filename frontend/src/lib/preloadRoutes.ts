import * as loaders from "@/routes/loaders";

// Use a Set of functions/strings so function references are checked directly
const preloadCache = new Set<unknown>();

/** Normalize a path for routeImportMap lookup (strip hash, query, trailing slash). */
export function normalizePath(path: string): string {
  const withoutHashOrQuery = path.split(/[#?]/)[0];
  const trimmed = withoutHashOrQuery.replace(/\/+$/, "") || "/";
  return trimmed;
}

/** Preload a chunk by calling its import() once (idempotent). */
export function preloadRoute(importFn: () => Promise<unknown>) {
  if (!importFn) return;
  if (preloadCache.has(importFn)) return;

  const key = importFn.name || importFn.toString();
  if (key && preloadCache.has(key)) return;

  preloadCache.add(importFn);
  if (key) preloadCache.add(key);

  importFn().catch((error) => {
    if (import.meta.env.DEV) {
      console.warn("[preload] Failed to preload chunk:", error);
    }
  });
}

function preloadPublicPage(...pageLoaders: Array<() => Promise<unknown>>) {
  return () => {
    preloadRoute(loaders.loadRoot);
    pageLoaders.forEach(preloadRoute);
  };
}

function preloadDashboardPage(...pageLoaders: Array<() => Promise<unknown>>) {
  return () => {
    preloadRoute(loaders.loadDashboardLayout);
    pageLoaders.forEach(preloadRoute);
  };
}

function preloadAdminPage(...pageLoaders: Array<() => Promise<unknown>>) {
  return () => {
    preloadRoute(loaders.loadAdminProtectedRoute);
    pageLoaders.forEach(preloadRoute);
  };
}

function preloadAuthPage(pageLoader: () => Promise<unknown>) {
  return () => preloadRoute(pageLoader);
}

/** Preload core dashboard chunks (layout + home + profile). Called e.g. on login. */
export function preloadDashboard() {
  preloadRoute(loaders.loadDashboardLayout);
  preloadRoute(loaders.loadDashboardHome);
  preloadRoute(loaders.loadShowProfile);
}

// Every navigation link should have an entry here.
export const routeImportMap: Record<string, () => void> = {
  // Public pages (under Root layout)
  "/": () => {
    preloadRoute(loaders.loadRoot);
    preloadRoute(loaders.loadHomePage);
  },
  "/stories/notable-alumni": preloadPublicPage(loaders.loadNotableAlumni),
  "/stories/alumni-stories": preloadPublicPage(loaders.loadAlumniStories),
  "/stories/giving-stories": preloadPublicPage(loaders.loadGivingStories),
  "/stories/campus-news": preloadPublicPage(loaders.loadCampusNews),
  "/communities/clubs": preloadPublicPage(loaders.loadClubsPage),
  "/communities/industries": preloadPublicPage(loaders.loadIndustriesPage),
  "/communities/recent-grads": preloadPublicPage(loaders.loadRecentGradsPage),
  "/communities/explore": preloadPublicPage(loaders.loadExploreCommunities),
  "/benefits/learning": preloadPublicPage(loaders.loadLearningPage),
  "/benefits/career": preloadPublicPage(loaders.loadCareerPage),
  "/benefits/alumni-directory": preloadPublicPage(loaders.loadAlumniDirectoryHome),
  "/giving": preloadPublicPage(loaders.loadGivingHome),
  "/events": preloadPublicPage(loaders.loadEventsHome),
  "/events/attend": preloadPublicPage(loaders.loadAttendAnEvent),
  "/about": preloadPublicPage(loaders.loadAboutPage),
  "/map": preloadPublicPage(loaders.loadAlumniMapPage),

  // Auth pages (standalone layout)
  "/login": preloadAuthPage(loaders.loadLogin),
  "/signup": preloadAuthPage(loaders.loadSignUp),
  "/otp-verification": preloadAuthPage(loaders.loadOtpVerificationPage),
  "/profile-form": preloadAuthPage(loaders.loadProfileForm),
  "/forgot-password": preloadAuthPage(loaders.loadForgotPassword),
  "/reset-password": preloadAuthPage(loaders.loadResetPassword),

  // Dashboard pages (including dynamic parameter routes)
  "/dashboard": preloadDashboardPage(loaders.loadDashboardHome),
  "/dashboard/profile": preloadDashboardPage(loaders.loadShowProfile),
  "/dashboard/update-profile": preloadDashboardPage(loaders.loadUpdateProfile),
  "/dashboard/alumni": preloadDashboardPage(loaders.loadAlumniDirectory),
  "/dashboard/alumni/:userId": preloadDashboardPage(loaders.loadViewProfile),
  "/dashboard/connections": preloadDashboardPage(loaders.loadConnectionsPage),
  "/dashboard/notifications": preloadDashboardPage(loaders.loadMobileNotifications),
  "/dashboard/chat": preloadDashboardPage(loaders.loadChatPage),
  "/dashboard/chat/:conversationId": preloadDashboardPage(loaders.loadChatPage),
  "/dashboard/events": preloadDashboardPage(loaders.loadEvents),
  "/dashboard/posts": preloadDashboardPage(loaders.loadCreatePost),
  "/dashboard/posts/:postId": preloadDashboardPage(loaders.loadViewPost),
  "/dashboard/my-posts": preloadDashboardPage(loaders.loadMyPosts),
  "/dashboard/host-event": preloadDashboardPage(loaders.loadHostEvent),
  "/dashboard/queries": preloadDashboardPage(loaders.loadQueries),
  "/dashboard/giving": preloadDashboardPage(loaders.loadGiving),
  "/dashboard/verify-alumni": () => preloadRoute(loaders.loadVerifyAlumni),

  // Admin pages
  "/admin-panel/dashboard": preloadAdminPage(loaders.loadAdminDashboard),
  "/admin-panel/verification": preloadAdminPage(loaders.loadVerificationQueue),
  "/admin-panel/verifications": preloadAdminPage(loaders.loadVerificationQueue),
  "/admin-panel/users": preloadAdminPage(loaders.loadUserManagement),
  "/admin-panel/events": preloadAdminPage(loaders.loadEventApprovals),
  "/admin-panel/current-events": preloadAdminPage(loaders.loadCurrentEvents),
  "/admin-panel/posts-approval": preloadAdminPage(loaders.loadPostsApproval),
  "/admin-panel/current-posts": preloadAdminPage(loaders.loadCurrentPosts),
  "/admin-panel/newsletters": preloadAdminPage(loaders.loadNewsletters),
  "/admin-panel/banned": preloadAdminPage(loaders.loadBannedUsers),
  "/admin-panel/codes": preloadAdminPage(loaders.loadCodeManagement),
  "/admin-panel/alumni-database": preloadAdminPage(loaders.loadAlumniDatabase),
  "/admin-panel/reports": preloadAdminPage(loaders.loadReports),
  "/admin-panel/queries": preloadAdminPage(loaders.loadQueryManagement),
  "/admin-panel/givings": preloadAdminPage(loaders.loadGivingManagement),
};

/** Preload route chunks for a normalized or raw path. */
export function preloadPath(path: string) {
  const normalized = normalizePath(path);
  
  // 1. Direct match
  const directMatch = routeImportMap[normalized];
  if (directMatch) {
    directMatch();
    return;
  }

  // 2. Dynamic route pattern matching (e.g. /dashboard/alumni/123 -> /dashboard/alumni/:userId)
  for (const [pattern, loader] of Object.entries(routeImportMap)) {
    if (pattern.includes(":")) {
      const regexStr = "^" + pattern.replace(/:[^\/]+/g, "[^/]+") + "$";
      if (new RegExp(regexStr).test(normalized)) {
        loader();
        return;
      }
    }
  }

  if (import.meta.env.DEV) {
    console.debug(`[preload] No loader registered for path: ${normalized}`);
  }
}

/** Preload multiple paths at once (e.g. when a nav dropdown opens). */
export function preloadPaths(paths: string[]) {
  paths.forEach(preloadPath);
}

/** Nav dropdown child paths keyed by section title. */
export const navDropdownPaths: Record<string, string[]> = {
  Communities: ["/communities/clubs", "/communities/industries"],
  Benefits: ["/benefits/career", "/benefits/learning", "/benefits/alumni-directory"],
  Stories: [
    "/stories/notable-alumni",
    "/stories/alumni-stories",
    "/stories/giving-stories",
    "/stories/campus-news",
  ],
};
