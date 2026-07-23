import { useLocation } from "react-router-dom";
import { PreloadLink } from "@/components/PreloadLink";
import { useEffect } from "react";
import { Construction, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import nsutLogo from "@/assets/nsut-logo.svg";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white flex items-center justify-center px-4">
      {/* Plus Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23800000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="bg-white rounded-full p-4 shadow-lg">
            <img src={nsutLogo} alt="NSUT Logo" width="64" height="64" className="h-16 w-16" />
          </div>
        </div>

        {/* Construction Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-[#800000] blur-2xl opacity-20 rounded-full"></div>
            <Construction className="w-32 h-32 text-[#800000] relative animate-pulse" />
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-4">
          <h1 className="text-6xl md:text-7xl font-bold text-gray-900">
            <span className="bg-gradient-to-r from-[#800000] to-[#FFD700] bg-clip-text text-transparent">
              404
            </span>
          </h1>
          
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Page Under Construction
          </h2>
          
          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            Oops! This page is currently being built by our team. We're working hard to bring you an amazing experience. 
            Please check back soon!
          </p>

          <div className="bg-[#800000]/5 border-2 border-[#800000]/20 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-sm text-gray-700">
              <strong className="text-[#800000]">Note:</strong> If you believe this is an error, please contact our support team.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <PreloadLink to="/">
            <Button className="bg-[#800000] hover:bg-[#600000] text-white px-8 py-6 text-lg gap-2 shadow-lg">
              <Home className="w-5 h-5" />
              Back to Home
            </Button>
          </PreloadLink>
          
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="border-[#800000] text-[#800000] hover:bg-[#800000]/5 px-8 py-6 text-lg gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            NSUT Alumni Association
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
