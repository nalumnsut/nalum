import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, CheckCircle, Calendar, CalendarCheck, FileText, Ban, LogOut, Key, Database, AlertTriangle, MessageSquare, Heart } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

/**
 * Simplified AdminSidebar - uses main AuthContext
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
    <div className="w-64 bg-slate-50 dark:bg-gray-900 text-gray-900 dark:text-white h-screen flex flex-col fixed left-0 top-0 border-r border-gray-200 dark:border-gray-800/80 transition-all duration-300">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800/80 flex-shrink-0 transition-colors duration-300">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">Nalum Admin</h1>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1.5 transition-colors duration-300">{user?.name}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 transition-colors duration-300">{user?.email}</p>
        <span className="inline-block mt-2.5 px-2.5 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
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
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                    }`}
                >
                  <Icon size={20} className="shrink-0" />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800/80 flex-shrink-0 transition-colors duration-300">
        <button
          onClick={handleLogout}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold text-sm shadow-sm w-full transition-all duration-200"
        >
          <LogOut size={18} className="shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
