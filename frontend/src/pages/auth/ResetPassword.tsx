import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import nsutLogo from "@/assets/nsut-logo.svg";
import nsutCampusHero from "@/assets/hero.webp";
import apiClient from "@/lib/api";
import axios from "axios";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tokenError, setTokenError] = useState(false);
  const navigate = useNavigate();

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setTokenError(true);
      toast.error("Invalid Reset Link", {
        description: "This password reset link is invalid or has expired.",
        style: {
          background: "#800000",
          color: "white",
          border: "2px solid #FFD700",
          fontSize: "16px",
        },
      });
    }
  }, [token]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const password = formData.password;
      const minLength = 8;
      const hasUppercase = /[A-Z]/.test(password);
      const hasLowercase = /[a-z]/.test(password);
      const hasDigit = /[0-9]/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

      if (password.length < minLength) {
        newErrors.password = "Password must be at least 8 characters long";
      } else if (!hasUppercase) {
        newErrors.password = "Password must contain at least one uppercase letter (A-Z)";
      } else if (!hasLowercase) {
        newErrors.password = "Password must contain at least one lowercase letter (a-z)";
      } else if (!hasDigit) {
        newErrors.password = "Password must contain at least one number (0-9)";
      } else if (!hasSpecial) {
        newErrors.password = "Password must contain at least one special character (e.g. !@#$%)";
      }
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !token) return;

    setIsLoading(true);
    try {
      await apiClient.post("/auth/reset-password", {
        token,
        password: formData.password,
      });

      setResetSuccess(true);
      toast.success("Password Reset Successful!", {
        description: "Your password has been reset. You can now sign in.",
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

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      console.error("Reset password error:", error);
      
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || "Failed to reset password";
        
        if (errorMessage.includes("expired") || errorMessage.includes("Invalid")) {
          toast.error("Reset Link Expired", {
            description: "This password reset link has expired. Please request a new one.",
            style: {
              background: "#800000",
              color: "white",
              border: "2px solid #FFD700",
              fontSize: "16px",
            },
          });
          setTokenError(true);
        } else {
          toast.error("Reset Failed", {
            description: errorMessage,
            style: {
              background: "#800000",
              color: "white",
              border: "2px solid #FFD700",
              fontSize: "16px",
            },
          });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenError) {
    return (
      <div className="flex flex-col min-h-[100dvh] w-full bg-gray-50 lg:grid lg:grid-cols-2 lg:h-screen lg:overflow-hidden">
        {/* Left Column: Image */}
        <div className="relative hidden lg:flex flex-col items-start justify-between p-10 h-full">
          <img
            src={nsutCampusHero}
            alt="NSUT Campus"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <Link to="/" className="relative z-10 flex items-center gap-3">
            <img src={nsutLogo} alt="Logo" width="80" height="80" className="h-16 md:h-20 w-auto object-contain" />
            <div className="flex flex-col items-start">
              <h1 className="text-xl md:text-2xl font-bold leading-none tracking-wide text-white whitespace-nowrap">
                <span className="text-red-600">N</span>SUT
                <span className="text-red-600"> ALUM</span>NI
              </h1>
              <span className="block text-[8px] md:text-xs text-white/90 font-bold tracking-widest">
                ASSOCIATION
              </span>
            </div>
          </Link>
          <div className="relative z-10 text-white">
            <h1 className="text-4xl font-serif font-bold">
              Link Expired
            </h1>
            <p className="mt-2 max-w-md text-lg text-white/80">
              This password reset link is no longer valid.
            </p>
          </div>
        </div>

        {/* Right Column: Error Message */}
        <div className="flex-1 relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 lg:h-full lg:overflow-y-auto">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23800000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>
          <div className="relative z-10 w-full max-w-md space-y-8">
            <Link to="/" className="lg:hidden flex items-center gap-3 text-nsut-maroon mb-6 justify-center">
              <img src={nsutLogo} alt="Logo" className="h-12 w-auto object-contain" />
              <div className="flex flex-col items-start">
                <h1 className="text-lg font-bold leading-none tracking-wide text-nsut-maroon whitespace-nowrap">
                  <span className="text-red-600">N</span>SUT
                  <span className="text-red-600"> ALUM</span>NI
                </h1>
                <span className="block text-[7px] text-gray-700 font-bold tracking-widest">
                  ASSOCIATION
                </span>
              </div>
            </Link>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                <Lock className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
                Invalid or Expired Link
              </h2>
              <p className="mt-4 text-base text-gray-600">
                This password reset link is no longer valid. It may have expired or already been used.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Password reset links expire after 5 minutes for security reasons.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => navigate("/forgot-password")}
                className="w-full h-12 bg-nsut-maroon hover:bg-nsut-maroon/90 text-white font-semibold text-lg"
              >
                Request New Reset Link
              </Button>
              
              <Button
                onClick={() => navigate("/login")}
                variant="outline"
                className="w-full h-12 border-nsut-maroon text-nsut-maroon hover:bg-nsut-maroon/10 font-semibold text-lg"
              >
                Back to Sign In
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="flex flex-col min-h-[100dvh] w-full bg-gray-50 lg:grid lg:grid-cols-2 lg:h-screen lg:overflow-hidden">
        {/* Left Column: Image */}
        <div className="relative hidden lg:flex flex-col items-start justify-between p-10 h-full">
          <img
            src={nsutCampusHero}
            alt="NSUT Campus"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <Link to="/" className="relative z-10 flex items-center gap-3">
            <img src={nsutLogo} alt="Logo" width="80" height="80" className="h-16 md:h-20 w-auto object-contain" />
            <div className="flex flex-col items-start">
              <h1 className="text-xl md:text-2xl font-bold leading-none tracking-wide text-white whitespace-nowrap">
                <span className="text-red-600">N</span>SUT
                <span className="text-red-600"> ALUM</span>NI
              </h1>
              <span className="block text-[8px] md:text-xs text-white/90 font-bold tracking-widest">
                ASSOCIATION
              </span>
            </div>
          </Link>
          <div className="relative z-10 text-white">
            <h1 className="text-4xl font-serif font-bold">
              Password Reset!
            </h1>
            <p className="mt-2 max-w-md text-lg text-white/80">
              Your password has been successfully updated.
            </p>
          </div>
        </div>

        {/* Right Column: Success Message */}
        <div className="flex-1 relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 lg:h-full lg:overflow-y-auto">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23800000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </div>
          <div className="relative z-10 w-full max-w-md space-y-8">
            <Link to="/" className="lg:hidden flex items-center gap-3 text-nsut-maroon mb-6 justify-center">
              <img src={nsutLogo} alt="Logo" className="h-12 w-auto object-contain" />
              <div className="flex flex-col items-start">
                <h1 className="text-lg font-bold leading-none tracking-wide text-nsut-maroon whitespace-nowrap">
                  <span className="text-red-600">N</span>SUT
                  <span className="text-red-600"> ALUM</span>NI
                </h1>
                <span className="block text-[7px] text-gray-700 font-bold tracking-widest">
                  ASSOCIATION
                </span>
              </div>
            </Link>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
                Password Reset Successful!
              </h2>
              <p className="mt-4 text-base text-gray-600">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <p className="mt-2 text-sm text-gray-500">
                You will be redirected to the sign in page in a moment...
              </p>
            </div>

            <Button
              onClick={() => navigate("/login")}
              className="w-full h-12 bg-nsut-maroon hover:bg-nsut-maroon/90 text-white font-semibold text-lg"
            >
              Go to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-gray-50 lg:grid lg:grid-cols-2 lg:h-screen lg:overflow-hidden">
      {/* Left Column: Image */}
      <div className="relative hidden lg:flex flex-col items-start justify-between p-10 h-full">
        <img
          src={nsutCampusHero}
          alt="NSUT Campus"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <Link to="/" className="relative z-10 flex items-center gap-3">
          <img src={nsutLogo} alt="Logo" width="80" height="80" className="h-16 md:h-20 w-auto object-contain" />
          <div className="flex flex-col items-start">
            <h1 className="text-xl md:text-2xl font-bold leading-none tracking-wide text-white whitespace-nowrap">
              <span className="text-red-600">N</span>SUT
              <span className="text-red-600"> ALUM</span>NI
            </h1>
            <span className="block text-[8px] md:text-xs text-white/90 font-bold tracking-widest">
              ASSOCIATION
            </span>
          </div>
        </Link>
        <div className="relative z-10 text-white">
          <h1 className="text-4xl font-serif font-bold">
            Create New Password
          </h1>
          <p className="mt-2 max-w-md text-lg text-white/80">
            Choose a strong password to secure your account.
          </p>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex-1 relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 lg:h-full lg:overflow-y-auto">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23800000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
        </div>
        <div className="relative z-10 w-full max-w-md space-y-8">
          {/* Header */}
          <div>
            <Link to="/" className="lg:hidden flex items-center gap-3 text-nsut-maroon mb-6 justify-center">
              <img src={nsutLogo} alt="Logo" className="h-12 w-auto object-contain" />
              <div className="flex flex-col items-start">
                <h1 className="text-lg font-bold leading-none tracking-wide text-nsut-maroon whitespace-nowrap">
                  <span className="text-red-600">N</span>SUT
                  <span className="text-red-600"> ALUM</span>NI
                </h1>
                <span className="block text-[7px] text-gray-700 font-bold tracking-widest">
                  ASSOCIATION
                </span>
              </div>
            </Link>
            <h2 className="text-center text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
              Set new password
            </h2>
            <p className="mt-2 text-center text-base text-gray-600">
              Your new password must be different from previously used passwords.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4 rounded-md">
              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password (min 8 characters)"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`pl-10 pr-10 h-12 text-base ${errors.password ? "border-red-500" : ""}`}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-base">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    className={`pl-10 pr-10 h-12 text-base ${errors.confirmPassword ? "border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-gray-100 p-3 rounded-md">
              <p className="font-semibold mb-1">Password must contain:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>At least 8 characters</li>
                <li>One uppercase letter (A-Z)</li>
                <li>One lowercase letter (a-z)</li>
                <li>One number (0-9)</li>
                <li>One special character (e.g. !@#$%)</li>
                <li>Match in both fields</li>
              </ul>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-nsut-maroon hover:bg-nsut-maroon/90 text-white font-semibold text-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Resetting password...
                </span>
              ) : (
                "Reset Password"
              )}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-base font-medium text-nsut-maroon hover:text-nsut-maroon/80"
              >
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
