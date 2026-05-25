import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

// Auth Error Handler Component
export function AuthErrorHandler() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const handleAuthError = () => {
      logout();
      toast.error("Session Expired", {
        id: "session-expired",
        description: "Your session has expired. Please log in again.",
        style: {
          background: "#800000",
          color: "white",
          border: "2px solid #FFD700",
          fontSize: "16px",
        },
        classNames: {
          title: "text-xl font-bold text-white",
          description: "text-base text-white",
        },
      });
      navigate("/login");
    };

    window.addEventListener("auth-error", handleAuthError);
    return () => window.removeEventListener("auth-error", handleAuthError);
  }, [logout, navigate]);

  return null;
}

// Loading Screen Component (Shown during session restoration)
export function SessionLoadingScreen() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#800000] border-t-transparent mb-4"></div>
        <p className="text-gray-600 text-lg">Restoring your session...</p>
      </div>
    </div>
  );
}
