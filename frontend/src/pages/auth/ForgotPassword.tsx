import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import nsutLogo from "@/assets/nsut-logo.svg";
import nsutCampusHero from "@/assets/hero.webp";
import apiClient from "@/lib/api";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cooldown, setCooldown] = useState(0);
  const navigate = useNavigate();

  // Countdown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;

    const interval = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [cooldown]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown}s before requesting another reset link.`);
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post("/auth/forget-password", { email });

      setCooldown(60);
      setEmailSent(true);
      toast.success("Reset Link Sent!", {
        description: "Check your email for the password reset link.",
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
    } catch (error) {
      console.error("Forgot password error:", error);

      // Always show success message to prevent email enumeration
      setCooldown(60);
      setEmailSent(true);
      toast.success("Reset Link Sent!", {
        description: "If this email exists in our system, you'll receive a reset link.",
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
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
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
              Check Your Email
            </h1>
            <p className="mt-2 max-w-md text-lg text-white/80">
              We've sent you instructions to reset your password.
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
                <Mail className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-gray-900">
                Check your email
              </h2>
              <p className="mt-4 text-base text-gray-600">
                We've sent password reset instructions to <span className="font-semibold text-gray-900">{email}</span>
              </p>
              <p className="mt-2 text-sm text-gray-500">
                The link will expire in 5 minutes for security reasons.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={() => navigate("/login")}
                className="w-full h-12 bg-nsut-maroon hover:bg-nsut-maroon/90 text-white font-semibold text-lg"
              >
                Back to Sign In
              </Button>

              <Button
                onClick={() => handleSubmit()}
                disabled={cooldown > 0 || isLoading}
                variant="outline"
                className="w-full h-12 border-nsut-maroon text-nsut-maroon hover:bg-nsut-maroon/10 font-semibold text-lg disabled:opacity-50"
              >
                {cooldown > 0 ? `Resend link in ${cooldown}s` : "Resend Reset Link"}
              </Button>

              <Button
                onClick={() => setEmailSent(false)}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-900"
              >
                Try Different Email
              </Button>
            </div>

            <div className="text-center text-sm text-gray-600">
              Didn't receive the email? Check your spam folder.
            </div>
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
            Forgot Your Password?
          </h1>
          <p className="mt-2 max-w-md text-lg text-white/80">
            No worries! Enter your email and we'll send you reset instructions.
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
              Reset your password
            </h2>
            <p className="mt-2 text-center text-base text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4 rounded-md">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-base">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`pl-10 h-12 text-base ${errors.email ? "border-red-500" : ""}`}
                    autoFocus
                  />
                </div>
                {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
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
                  Sending reset link...
                </span>
              ) : (
                "Send Reset Link"
              )}
            </Button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-base font-medium text-nsut-maroon hover:text-nsut-maroon/80"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
