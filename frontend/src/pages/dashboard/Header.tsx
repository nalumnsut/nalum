import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Bell, Home } from "lucide-react";
import { useProfile } from "@/context/ProfileContext";
import { useNotifications } from "@/context/NotificationContext";
import UserAvatar from "@/components/UserAvatar";
import NotificationsPopover from "@/components/NotificationsPopover";
import GlobalSearchModal from "@/components/GlobalSearchModal";
import ProfileMenu from "@/components/ProfileMenu";
import { PreloadLink } from "@/components/PreloadLink";
import { cn } from "@/lib/utils";
import nsutLogo from "@/assets/nsut-logo.svg";

// Static titles for the desktop header. Routes not listed here (dynamic
// detail pages, etc.) simply render without a title until they're mapped.
const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Overview",
  "/dashboard/alumni": "Directory",
  "/dashboard/chat": "Messages",
  "/dashboard/events": "Events",
  "/dashboard/queries": "Queries",
  "/dashboard/posts": "Posts",
  "/dashboard/posts/new": "Create Post",
  "/dashboard/giving": "Give",
  "/dashboard/profile": "Profile",
  "/dashboard/update-profile": "Account Settings",
  "/dashboard/change-password": "Reset Password",
  "/dashboard/host-event": "Host Event",
};

const Header = () => {
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname];
  const { profile } = useProfile();
  const { unreadCount: notificationUnreadCount } = useNotifications();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Close the search modal when switching routes
  useEffect(() => {
    setIsSearchOpen(false);
  }, [location.pathname]);

  // Cmd/Ctrl+K opens search from anywhere in the dashboard
  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  // min-h-0 on the header is required: as a flex item in the layout's column
  // flex container, its automatic minimum size (min-height: auto) resolves to
  // the min-content height and overrides the height class, stretching the bar.
  return (
    <header className="flex items-center gap-2 md:gap-4 h-20 min-h-0 max-h-20 px-4 md:px-8 border-b border-border bg-card sticky top-0 z-30 shrink-0">
      {/* Brand mark — sidebar (which carries the same mark) is hidden below md */}
      <PreloadLink to="/dashboard" className="flex items-center gap-2 md:hidden shrink-0">
        <img src={nsutLogo} alt="NSUT Alumni" width={24} height={24} className="h-6 w-6" />
        <span className="font-bold text-sm tracking-wide whitespace-nowrap">
          <span className="text-primary">N</span>
          <span className="text-foreground">SUT</span>
          <span className="text-primary"> ALUM</span>
          <span className="text-foreground">NI</span>
        </span>
      </PreloadLink>

      {/* Page title — only rendered for routes mapped in PAGE_TITLES above */}
      {pageTitle && (
        <h2 className="hidden md:block text-headline-md text-foreground shrink-0 truncate">
          {pageTitle}
        </h2>
      )}

      <div className="flex-1 min-w-0" />

      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Home — goes to the landing page without signing out */}
        <Link
          to="/"
          className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
          aria-label="Go to Home Page"
          title="Go to Home Page"
        >
          <Home className="h-5 w-5" />
        </Link>

        {/* Search — opens a centered command-palette style modal (⌘K / Ctrl+K also works) */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
          aria-label="Search"
        >
          <Search className="h-5 w-5" />
        </button>
        <GlobalSearchModal open={isSearchOpen} onOpenChange={setIsSearchOpen} />

        {/* Mobile: dedicated notifications page (bottom nav has no room for a popover) */}
        <Link
          to="/dashboard/notifications"
          className="md:hidden relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
        >
          <Bell className="h-5 w-5" />
          {notificationUnreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary ring-2 ring-card" />
          )}
        </Link>
        {/* Desktop: notification popover */}
        <div className="hidden md:block">
          <NotificationsPopover />
        </div>

        {/* Mobile: bottom nav is all primary destinations now, so the avatar opens
            the profile sheet (Logout, Queries, Giving, etc.) instead of linking out */}
        <button
          type="button"
          onClick={() => setIsProfileMenuOpen(true)}
          className="md:hidden"
          aria-label="Open profile menu"
        >
          <UserAvatar
            src={profile?.profile_picture}
            name={profile?.user?.name || "User"}
            size="sm"
            className={cn(
              "ring-2 transition-all",
              isProfileMenuOpen ? "ring-primary" : "ring-transparent"
            )}
          />
        </button>

        {/* Desktop: avatar links straight to the profile page (sidebar already carries Logout etc.) */}
        <Link to="/dashboard/profile" className="hidden md:block">
          <UserAvatar
            src={profile?.profile_picture}
            name={profile?.user?.name || "User"}
            size="sm"
            className="ring-2 ring-transparent hover:ring-primary transition-all"
          />
        </Link>
      </div>

      <ProfileMenu isOpen={isProfileMenuOpen} onClose={() => setIsProfileMenuOpen(false)} />
    </header>
  );
};

export default Header;
