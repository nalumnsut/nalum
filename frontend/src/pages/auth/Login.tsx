import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Mail, Lock, Briefcase } from "lucide-react";
import { toast } from "sonner";
import nsutLogo from "@/assets/nsut-logo.svg";
import nsutCampusHero from "@/assets/hero.webp";
import apiClient from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { trackLogin, trackEvent } from "@/lib/analytics";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "student",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { setAuth, accessToken } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (accessToken) {
        try {
          const profileStatusResponse = await apiClient.get("/profile/status", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (!profileStatusResponse.data.profileCompleted) {
            navigate('/profile-form', { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } catch (error) {
          console.error("Error checking profile status:", error);
          // If there's an error checking profile, just go to dashboard
          navigate('/dashboard', { replace: true });
        }
      }
    };

    checkProfileAndRedirect();
  }, [accessToken, navigate]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (formData.role === "student" && !formData.email.endsWith("@nsut.ac.in")) {
      newErrors.email = "Students must use their @nsut.ac.in email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await apiClient.post("/auth/sign-in", formData);
      const { access_token, email, user } = response.data.data;
      const verified_alumni = user?.verified_alumni || false;

      // Set full user data in auth context
      setAuth(access_token, email, verified_alumni, user);

      trackLogin(formData.role);

      toast.success("Login Successful!", {
        description: "Welcome back to the NSUT Alumni Portal 🎉",
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

      // Redirect admin users to admin panel
      if (user?.role === 'admin') {
        navigate("/admin-panel/dashboard");
        return;
      }

      // Regular user flow - check profile completion
      const profileStatusResponse = await apiClient.get("/profile/status", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!profileStatusResponse.data.profileCompleted) {
        navigate("/profile-form");
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      trackEvent('login_error', {
        error_status: axios.isAxiosError(error) ? String(error.response?.status) : 'unknown',
        error_code: axios.isAxiosError(error) ? error.response?.data?.code : undefined,
      });
      if (
        axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        error.response?.data?.message === "Email not verified"
      ) {
        toast.error("Email Not Verified", {
          description: "Please verify your email before logging in.",
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
        navigate("/otp-verification", { state: { email: formData.email } });
      } else if (
        axios.isAxiosError(error) &&
        error.response?.status === 403 &&
        error.response?.data?.banned
      ) {
        // Handle banned user
        const banMessage = error.response.data.message || "Your account has been banned.";
        toast.error("Account Banned", {
          description: banMessage,
          duration: 8000,
          style: {
            background: "#dc2626",
            color: "white",
            border: "2px solid #991b1b",
            fontSize: "16px",
          },
          classNames: {
            title: "text-xl font-bold text-white",
            description: "text-base text-white",
          },
        });
      } else if (
        axios.isAxiosError(error) &&
        error.response?.status === 401 &&
        error.response?.data?.message === "No User"
      ) {
        toast.error("Account Not Found", {
          description: "No account exists with this email address",
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
      } else {
        const errorMessage = axios.isAxiosError(error) 
          ? error.response?.data?.message || "Invalid email or password"
          : "Invalid email or password";
        
        toast.error("Login Failed", {
          description: errorMessage,
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
      }
    } finally {
      setIsLoading(false);
    }
  };

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
            Reconnect. Rediscover.
          </h1>
          <p className="mt-2 max-w-md text-lg text-white/80">
            Join the vibrant community of Netaji Subhas University of Technology alumni.
          </p>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="flex-1 relative flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 lg:h-full lg:overflow-y-auto">
        {/* Subtle Pattern Background */}
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
              Sign in to your account
            </h2>
            <p className="mt-2 text-center text-base text-gray-600">
              Or{" "}
              <Link to="/signup" className="font-medium text-nsut-maroon hover:text-nsut-maroon/80">
                create your account
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4 rounded-md">
              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-base">I am a...</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
                  <Select onValueChange={(value) => handleInputChange("role", value)} defaultValue={formData.role}>
                    <SelectTrigger id="role" className="pl-10 h-12 text-base">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="alumni">Alumni</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={formData.role === "student" ? "Your student email ending with @nsut.ac.in" : "your.email@example.com"}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`pl-10 h-12 text-base ${errors.email ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    className={`pl-10 pr-10 h-12 text-base ${errors.password ? "border-red-500" : ""}`}
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
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-nsut-maroon focus:ring-nsut-maroon"
                />
                <Label htmlFor="remember-me" className="ml-2 block text-base text-gray-900">
                  Remember me
                </Label>
              </div>
              <div className="text-base">
                <Link to="/forgot-password" className="font-medium text-nsut-maroon hover:text-nsut-maroon/80">
                  Forgot your password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-nsut-maroon hover:bg-nsut-maroon/90 text-white font-semibold text-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
