import { useLocation, useNavigate } from "react-router-dom";
import { PreloadLink } from "@/components/PreloadLink";
import { LayoutDashboard, Users, CheckCircle, Calendar, CalendarCheck, FileText, Ban, LogOut, Key, Database, AlertTriangle, MessageSquare, Heart } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/**
 * Simplified AdminSidebar - uses main AuthContext & PreloadLink
 */
const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin-panel/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Verification Queue",
      path: "/admin-panel/verifications",
      icon: CheckCircle,
    },
    {
      name: "Verification Codes",
      path: "/admin-panel/codes",
      icon: Key,
    },
    {
      name: "Alumni Database",
      path: "/admin-panel/alumni-database",
      icon: Database,
    },
    {
      name: "User Management",
      path: "/admin-panel/users",
      icon: Users,
    },
    {
      name: "Event Approvals",
      path: "/admin-panel/events",
      icon: Calendar,
    },
    {
      name: "Current Events",
      path: "/admin-panel/current-events",
      icon: CalendarCheck,
    },
    {
      name: "Posts Approval",
      path: "/admin-panel/posts-approval",
      icon: FileText,
    },
    {
      name: "Current Posts",
      path: "/admin-panel/current-posts",
      icon: FileText,
    },
    {
      name: "Query Management",
      path: "/admin-panel/queries",
      icon: MessageSquare,
    },
    {
      name: "Giving Management",
      path: "/admin-panel/givings",
      icon: Heart,
    },
    {
      name: "Reports",
      path: "/admin-panel/reports",
      icon: AlertTriangle,
    },
    {
      name: "Newsletters",
      path: "/admin-panel/newsletters",
      icon: FileText,
    },
    {
      name: "Banned Users",
      path: "/admin-panel/banned",
      icon: Ban,
    },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="w-64 bg-gray-900 text-white h-screen flex flex-col fixed left-0 top-0">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-800 flex-shrink-0">
        <h1 className="text-2xl font-bold">Nalum Admin</h1>
        <p className="text-sm text-gray-400 mt-1">{user?.name}</p>
        <span className="inline-block mt-2 px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
          ADMIN
        </span>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <PreloadLink
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </PreloadLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800 flex-shrink-0">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 w-full transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
