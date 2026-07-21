import { useLocation } from "react-router-dom";
import { PreloadLink } from "@/components/PreloadLink";
import { Home, Users, LogOut, MessageSquare, Calendar, Sparkles, FileText, Heart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import UserAvatar from "@/components/UserAvatar";
import nsutLogo from "@/assets/nsut-logo.svg";
import { useConversations } from "@/hooks/useConversations";

interface SidebarProps {
  onNavigate?: () => void;
}

const Sidebar = ({ onNavigate }: SidebarProps) => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const { profile } = useProfile();
  const { conversations } = useConversations();

  const unreadCount = conversations.reduce((acc: number, conv: any) => acc + (conv.unreadCount || 0), 0);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <aside className="h-screen w-64 flex flex-col bg-slate-950/50 backdrop-blur-xl border-r border-white/10 shadow-xl sticky top-0">
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img src={nsutLogo} alt="NSUT Alumni" className="h-8 w-8" />
          <h1 className="text-lg font-bold tracking-wide">
            <span className="text-red-600">N</span>
            <span className="text-white">SUT</span>
            <span className="text-red-600"> ALUM</span>
            <span className="text-white">NI</span>
          </h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <PreloadLink
          to="/dashboard"
          onClick={onNavigate}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border ${
            location.pathname === "/dashboard"
              ? "bg-blue-500/20 text-blue-200 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
              : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Home className="h-5 w-5" />
          <span className="font-medium">Dashboard</span>
        </PreloadLink>

        <PreloadLink
          to="/dashboard/alumni"
          onClick={onNavigate}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border ${
            isActive("/dashboard/alumni")
              ? "bg-blue-500/20 text-blue-200 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
              : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Users className="h-5 w-5" />
          <span className="font-medium">Directory</span>
        </PreloadLink>

        <PreloadLink
          to="/dashboard/chat"
          onClick={onNavigate}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border ${
            isActive("/dashboard/chat")
              ? "bg-blue-500/20 text-blue-200 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
              : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <div className="relative">
            <MessageSquare className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-slate-900" />
            )}
          </div>
          <span className="font-medium">Messages</span>
        </PreloadLink>

        <PreloadLink
          to="/dashboard/events"
          onClick={onNavigate}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border ${
            isActive("/dashboard/events")
              ? "bg-blue-500/20 text-blue-200 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
              : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Calendar className="h-5 w-5" />
          <span className="font-medium">Events</span>
        </PreloadLink>

        <PreloadLink
          to="/dashboard/queries"
          onClick={onNavigate}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border ${
            isActive("/dashboard/queries")
              ? "bg-blue-500/20 text-blue-200 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
              : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
          }`}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="font-medium">Queries</span>
        </PreloadLink>

        {user?.role === "alumni" && (
          <>
            <PreloadLink
              to="/dashboard/my-posts"
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border ${
                isActive("/dashboard/my-posts")
                  ? "bg-blue-500/20 text-blue-200 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="font-medium">My Posts</span>
            </PreloadLink>

            <PreloadLink
              to="/dashboard/host-event"
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border ${
                isActive("/dashboard/host-event")
                  ? "bg-blue-500/20 text-blue-200 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Sparkles className="h-5 w-5" />
              <span className="font-medium">Host Event</span>
            </PreloadLink>

            <PreloadLink
              to="/dashboard/giving"
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 border ${
                isActive("/dashboard/giving")
                  ? "bg-blue-500/20 text-blue-200 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                  : "border-transparent text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Heart className="h-5 w-5" />
              <span className="font-medium">Giving</span>
            </PreloadLink>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 space-y-3">
        {profile && (
          <PreloadLink
            to="/dashboard/profile"
            onClick={onNavigate}
            className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
          >
            <UserAvatar
              src={profile.profile_picture}
              name={profile.user.name}
              size="sm"
              className="flex-shrink-0"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-gray-200 truncate">{profile.user.name}</span>
              <span className="text-xs text-gray-500 truncate">View Profile</span>
            </div>
          </PreloadLink>
        )}

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;