import { useLocation } from "react-router-dom";
import { PreloadLink } from "@/components/PreloadLink";
import {
  LayoutGrid,
  Users,
  LogOut,
  MessageSquare,
  Calendar,
  FileText,
  HelpCircle,
  Heart,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import nsutLogo from "@/assets/nsut-logo.svg";
import { useConversations } from "@/hooks/useConversations";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onNavigate?: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  badge?: number;
}

const Sidebar = ({ onNavigate }: SidebarProps) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const { conversations } = useConversations();

  const unreadCount = conversations.reduce(
    (acc: number, conv: any) => acc + (conv.unreadCount || 0),
    0,
  );

  const isActive = (path: string) =>
    path === "/dashboard"
      ? location.pathname === "/dashboard"
      : location.pathname === path || location.pathname.startsWith(path + "/");

  const isAlumni = user?.role === "alumni";

  const navItems: NavItem[] = [
    { to: "/dashboard", label: "Overview", icon: LayoutGrid },
    { to: "/dashboard/alumni", label: "Directory", icon: Users },
    {
      to: "/dashboard/chat",
      label: "Messages",
      icon: MessageSquare,
      badge: unreadCount,
    },
    { to: "/dashboard/events", label: "Events", icon: Calendar },
    { to: "/dashboard/posts", label: "Posts", icon: FileText },
    { to: "/dashboard/resources", label: "Resources", icon: BookOpen },
    { to: "/dashboard/queries", label: "Queries", icon: HelpCircle },
  ];

  return (
    <aside className="h-screen w-64 flex flex-col bg-card border-r border-border sticky top-0">
      {/* Header — h-20 is the single source of truth for this app's header
          height; the page Header component (Header.tsx) is pinned to the
          same value so the two borders line up exactly. */}
      <div className="h-20 max-h-20 px-4 border-b border-border flex items-center gap-3 shrink-0">
        <img src={nsutLogo} alt="NSUT Alumni" className="h-9 w-9" />
        <h1 className="text-xl font-bold tracking-wide">
          <span className="text-primary">N</span>
          <span className="text-foreground">SUT</span>
          <span className="text-primary"> ALUM</span>
          <span className="text-foreground">NI</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon, badge }) => {
          const active = isActive(to);
          return (
            <PreloadLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200",
                active
                  ? "text-primary before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-6 before:w-1 before:rounded-full before:bg-primary before:content-['']"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {!!badge && badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-card" />
                )}
              </div>
              <span>{label}</span>
            </PreloadLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-3">
        {isAlumni && (
          <PreloadLink
            to="/dashboard/giving"
            onClick={onNavigate}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors"
          >
            <Heart className="h-4 w-4" />
            <span>Give</span>
          </PreloadLink>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
