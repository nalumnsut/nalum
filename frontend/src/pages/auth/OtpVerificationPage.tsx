import EmailVerification from "@/components/signup/EmailVerification";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";
import nsutLogo from "@/assets/nsut-logo.svg";
import nsutCampusHero from "@/assets/hero.webp";
import { useAuth } from "@/context/AuthContext";

const OtpVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const [verified, setVerified] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { setAuth } = useAuth();

  const handleEmailVerified = (authData?: {
    access_token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
      email_verified: boolean;
      profileCompleted: boolean;
      verified_alumni: boolean;
    };
  }) => {
    setVerified(true);

    if (authData) {
      // Auto-login: set auth context with the tokens from verification
      setAuth(
        authData.access_token,
        authData.user.email,
        authData.user.verified_alumni,
        authData.user
      );

      // Auto-redirect to profile form after a brief success message
      setIsRedirecting(true);
      setTimeout(() => {
        navigate("/profile-form", { replace: true });
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 pt-16 lg:pt-0">
      {/* Left Column */}
      <div className="relative hidden lg:flex flex-col items-start justify-between p-10">
        <img
          src={nsutCampusHero}
          alt="NSUT Campus"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />

        <Link to="/" className="relative z-10 flex items-center gap-3 text-white">
          <img src={nsutLogo} alt="NSUT Logo" className="h-10 w-10" />
          <div className="flex flex-col items-start">
            <h1 className="text-xl md:text-2xl font-bold leading-none tracking-wide whitespace-nowrap">
              <span className="text-red-600">N</span>
              <span className="text-white">SUT</span>
              <span className="text-red-600"> ALUM</span>
              <span className="text-white">NI</span>
            </h1>
            <span className="block text-[8px] md:text-xs font-bold tracking-widest">
              ASSOCIATION
            </span>
          </div>
        </Link>

        <div className="relative z-10 text-white">
          <h1 className="text-4xl font-serif font-bold">Almost There!</h1>
          <p className="mt-2 max-w-md text-lg text-white/80">
            Verify your email address to complete your registration.
          </p>
        </div>
      </div>

      {/* Right Column */}
      <div className="relative flex items-center justify-center py-12 px-4 bg-gray-50 min-h-screen lg:min-h-full">
        <div className="relative z-10 w-full max-w-md space-y-8">
          {/* Mobile Header */}
          <Link
            to="/"
            className="lg:hidden flex items-center gap-3 text-nsut-maroon mb-6 justify-center"
          >
            <img src={nsutLogo} alt="NSUT Logo" className="h-8 w-8" />
            <div className="flex flex-col items-start">
              <h1 className="text-xl font-bold leading-none tracking-wide text-gray-800 whitespace-nowrap">
                <span className="text-red-600">N</span>SUT
                <span className="text-red-600"> ALUM</span>NI
              </h1>
              <span className="block text-[8px] font-bold tracking-widest text-gray-700">
                ASSOCIATION
              </span>
            </div>
          </Link>

          {/* Header */}
          {verified ? (
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900">
                Email Verified Successfully!
              </h2>
              {isRedirecting ? (
                <div className="mt-3 flex items-center justify-center gap-2 text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p>Setting up your profile...</p>
                </div>
              ) : (
                <p className="text-gray-600">
                  You can now sign in to your account.
                </p>
              )}
            </div>
          ) : (
            <>
              <h2 className="text-center text-3xl font-bold text-gray-900">
                Verify Your Email
              </h2>
              <p className="mt-2 text-center text-gray-600">
                Click Send OTP to receive a verification code at{" "}
                <span className="font-semibold text-nsut-maroon">{email}</span>
              </p>
            </>
          )}

          {/* Content */}
          {verified ? (
            !isRedirecting && (
              <Button
                onClick={() => navigate("/login")}
                className="w-full h-12 bg-nsut-maroon text-white font-semibold text-lg"
              >
                Go to Login
              </Button>
            )
          ) : (
            <EmailVerification
              email={email || ""}
              onEmailChange={() => { }}
              onVerified={handleEmailVerified}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OtpVerificationPage;
