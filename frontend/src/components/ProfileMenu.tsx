import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PreloadLink } from "@/components/PreloadLink";
import { X, FileText, Calendar, HelpCircle, Heart, LogOut, Settings } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface ProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileMenu = ({ isOpen, onClose }: ProfileMenuProps) => {
  const { profile } = useProfile();
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  if (!profile?.user) return null;

  const isAlumni = (profile.user as any)?.role === "alumni";

  const menuItems = [
    {
      icon: FileText,
      label: "My Posts",
      href: "/dashboard/my-posts",
      show: isAlumni,
      description: "Manage your posts",
    },
    {
      icon: Calendar,
      label: "My Events",
      href: "/dashboard/host-event",
      show: isAlumni,
      description: "Manage your events",
    },
    {
      icon: HelpCircle,
      label: "Queries",
      href: "/dashboard/queries",
      show: true,
      description: "Ask questions",
    },
    {
      icon: Heart,
      label: "Giving",
      href: "/dashboard/giving",
      show: true,
      description: "Support NSUT",
    },
  ];

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Slide-out Menu */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 z-[60] md:hidden transition-transform duration-300 ease-in-out rounded-t-3xl",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{ maxHeight: "85vh" }}
      >
        {/* Handle Bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 bg-gray-600 rounded-full" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-6 pb-6" style={{ maxHeight: "calc(85vh - 60px)" }}>
          {/* Profile Actions */}
          <div className="py-4 border-b border-white/10 space-y-2">
            {/* View Profile */}
            <PreloadLink
              to="/dashboard/profile"
              onClick={onClose}
              className="flex items-center gap-4 py-3 hover:bg-white/5 -mx-2 px-2 rounded-lg transition-colors group"
            >
              <UserAvatar
                src={profile.profile_picture}
                name={profile.user.name}
                size="lg"
                className="ring-2 ring-blue-500/50 group-hover:ring-blue-500 transition-all"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
                  {profile.user.name}
                </h3>
                <p className="text-sm text-gray-400 truncate">
                  {profile.user.email}
                </p>
                {profile.branch && profile.batch && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <span className="truncate">{profile.branch}</span>
                    <span>•</span>
                    <span>Class of {profile.batch}</span>
                  </div>
                )}
              </div>
            </PreloadLink>
            
            {/* Edit Profile Button */}
            <PreloadLink
              to="/dashboard/update-profile"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all group border border-white/10"
            >
              <Settings className="h-4 w-4 text-gray-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
              <span className="text-sm font-medium">Edit Profile</span>
            </PreloadLink>
          </div>

          {/* Menu Items */}
          <nav className="py-4 space-y-1">
            {menuItems.map((item) => {
              if (!item.show) return null;
              
              return (
                <PreloadLink
                  key={item.href}
                  to={item.href}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
                >
                  <item.icon className="h-5 w-5 text-gray-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{item.label}</div>
                    {item.description && (
                      <div className="text-xs text-gray-500">{item.description}</div>
                    )}
                  </div>
                </PreloadLink>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all group"
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">Logout</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/10 text-center">
            <p className="text-xs text-gray-500">
              NSUT Alumni Association
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Netaji Subhas University of Technology
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileMenu;
