import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
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
import { Mail, Lock, User, Briefcase, Eye, EyeOff } from "lucide-react";
import nsutLogo from "@/assets/nsut-logo.svg";
import nsutCampusHero from "@/assets/hero.webp";
import { useAuth } from "@/context/AuthContext";
import { trackSignUp, trackEvent } from "@/lib/analytics";

const Signup = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "student",
    password: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in
  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (accessToken) {
        try {
          const profileStatusResponse = await api.get("/profile/status", {
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
  const [unverifiedEmail, setUnverifiedEmail] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Real-time password match validation
    if (field === "password" && confirmPassword) {
      if (value !== confirmPassword) {
        setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
      } else {
        setErrors((prev) => {
          const { confirmPassword: _, ...rest } = prev;
          return rest;
        });
      }
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    // Real-time password match validation
    if (value && formData.password !== value) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else if (value && formData.password === value) {
      setErrors((prev) => {
        const { confirmPassword: _, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Full name is required";
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (formData.role === "student" && !formData.email.endsWith("@nsut.ac.in")) {
      newErrors.email = "Students must use their @nsut.ac.in email address";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await api.post('/auth/sign-up', formData);

      // Check if user exists but needs verification
      if (response.data.needsVerification) {
        toast({
          title: "Account already exists",
          description: "Please verify your email to continue. Redirecting to verification page..."
        });
        navigate("/otp-verification", { state: { email: formData.email } });
        return;
      }

      toast({ title: "Registration successful! Please verify your email." });
      trackSignUp(formData.role);
      navigate("/otp-verification", { state: { email: formData.email } });
    } catch (error: unknown) {
      trackEvent('signup_error', {
        error_code: axios.isAxiosError(error) ? error.response?.data?.code : 'unknown',
        error_status: axios.isAxiosError(error) ? String(error.response?.status) : 'unknown',
      });
      if (axios.isAxiosError(error)) {
        const errorCode = error.response?.data?.code;
        if (errorCode === "USER_NOT_VERIFIED") {
          setUnverifiedEmail(true);
          toast({
            title: "Email not verified",
            description: "This email is already registered but not verified.",
            variant: "destructive",
          });
        } else if (errorCode === "USER_ALREADY_EXISTS" || error.response?.status === 409) {
          toast({
            title: "User already exists",
            description: "This email is already registered and verified. Please sign in instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: error.response?.data?.message || "An error occurred",
            variant: "destructive",
          });
        }
      } else {
        toast({ title: "An unexpected error occurred", variant: "destructive" });
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
            Begin Your Journey.
          </h1>
          <p className="mt-2 max-w-md text-lg text-white/80">
            Create your account to unlock exclusive resources and connect with a global network of peers.
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
              Create your account
            </h2>
            <p className="mt-2 text-center text-base text-gray-600">
              Already have an account?{" "}
              <Link to="/login" className="font-medium text-nsut-maroon hover:text-nsut-maroon/80">
                Sign in
              </Link>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="mt-8 space-y-6">
            <div className="space-y-4 rounded-md">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-base">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className={`pl-10 h-12 text-base ${errors.name ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
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
                    onChange={(e) => handleChange("email", e.target.value)}
                    className={`pl-10 h-12 text-base ${errors.email ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-base">I am a...</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-5 w-5 text-gray-400 z-10" />
                  <Select onValueChange={(value) => handleChange("role", value)} defaultValue={formData.role}>
                    <SelectTrigger id="role" className={`pl-10 h-12 text-base ${errors.role ? "border-red-500" : ""}`}>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="alumni">Alumni</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {errors.role && <p className="text-sm text-red-600">{errors.role}</p>}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-base">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    className={`pl-10 pr-10 h-12 text-base ${errors.password ? "border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-base">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    className={`pl-10 pr-10 h-12 text-base ${errors.confirmPassword ? "border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword}</p>}
              </div>
            </div>

            {unverifiedEmail ? (
              <div className="text-base text-center text-gray-600">
                This email is already registered but not verified.{" "}
                <Link
                  to="/otp-verification"
                  state={{ email: formData.email }}
                  className="font-medium text-nsut-maroon hover:text-nsut-maroon/80"
                >
                  Verify now
                </Link>
              </div>
            ) : (
              <Button
                type="submit"
                className="w-full h-12 bg-nsut-maroon hover:bg-nsut-maroon/90 text-white font-semibold text-lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                    Creating account...
                  </span>
                ) : (
                  "Create Account"
                )}
              </Button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
