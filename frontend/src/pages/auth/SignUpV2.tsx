import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import api from "@/lib/api";
import { toast } from "sonner";
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
import { Mail, Lock, User, Briefcase, Eye, EyeOff, House, GraduationCap, BriefcaseBusiness } from "lucide-react";
import nsutLogo from "@/assets/nsut-logo.svg";
import nsutCampusHero from "@/assets/hero.webp";
import { useAuth } from "@/context/AuthContext";
import { resolvePostLoginPath } from "@/lib/roleConfig";
import { trackSignUp, trackEvent } from "@/lib/analytics";

const Signup = () => {
    const navigate = useNavigate();
    const { accessToken, user } = useAuth();
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
        if (!accessToken || !user) return;
        resolvePostLoginPath(user.role, accessToken).then(path =>
            navigate(path, { replace: true })
        );
    }, [accessToken, user]);
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
                toast("Account already exists", {
                    description: "Please verify your email to continue. Redirecting to verification page...",
                });
                navigate("/otp-verification", { state: { email: formData.email } });
                return;
            }

            toast.success("Registration successful! Please verify your email.");
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
                    toast.error("Email not verified", {
                        description: "This email is already registered but not verified.",
                    });
                } else if (errorCode === "USER_ALREADY_EXISTS" || error.response?.status === 409) {
                    toast.error("User already exists", {
                        description: "This email is already registered and verified. Please sign in instead.",
                    });
                } else {
                    toast.error(error.response?.data?.message || "An error occurred");
                }
            } else {
                toast.error("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6">

            <img
                src={nsutCampusHero}
                className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/65" />

            <div className="flex flex-row items-center z-30 mt-10">
                <img
                    src={nsutLogo}
                    alt="NSUT Logo"
                    className="h-20 w-auto mb-4"
                />

                <h1 className="text-4xl font-bold tracking-wide text-white ml-4">
                    NALUM
                </h1>
            </div>



            <Link
                to="/"
                className="absolute top-16 right-8 z-30 w-12 h-12"
            >
                <House className="h-6 w-6 text-nsut-maroon" />
            </Link>

            <div className="relative z-10 w-full max-w-3xl rounded-2xl bg-white/7 backdrop-blur-xl border border-white/20 shadow-2xl p-10 m-2">

                {/* Header */}
                <div>
                    <Link to="/" className="lg:hidden flex items-center gap-3 text-nsut-maroon justify-center">
                        <img src={nsutLogo} alt="Logo" className="h-12 w-auto object-contain" />
                        <div className="flex flex-col items-start">
                            <h1 className="text-4xl font-bold leading-none tracking-wide text-nsut-maroon whitespace-nowrap">
                                NALUM
                            </h1>
                        </div>
                    </Link>
                    <h2 className="text-center text-3xl lg:text-4xl font-bold tracking-tight text-white">
                        Create your account
                    </h2>
                    <p className="mt-2 text-center text-base text-gray-300">
                        Already have an account?{" "}
                        <Link to="/login" className="font-medium text-nsut-maroon hover:text-nsut-maroon/80">
                            Sign in
                        </Link>
                    </p>
                </div>

                <br />



                {/* Form */}

                {/*ROLE SELECTION*/}
                <div className="space-y-3">

                    <Label className="text-white">
                        Who are you?
                    </Label>

                    <div className="grid grid-cols-2 gap-4">

                        <button
                            type="button"
                            onClick={() => handleChange("role", "student")}
                            className={`rounded-3xl p-6 transition-all duration-300 ${formData.role === "student"
                                ? "bg-red-700 text-white scale-105 shadow-xl"
                                : "bg-white/10 text-gray-300 hover:bg-white/20 hover:-translate-y-1"
                                }`}
                        >
                            <GraduationCap className="mx-auto h-8 w-8 mb-3" />
                            <p className="font-semibold">
                                Student
                            </p>

                        </button>

                        <button
                            type="button"
                            onClick={() => handleChange("role", "alumni")}
                            className={`rounded-3xl p-6 transition-all duration-300 ${formData.role === "alumni"
                                ? "bg-red-700 text-white scale-105 shadow-xl"
                                : "bg-white/10 text-gray-300 hover:bg-white/20 hover:-translate-y-1"
                                }`}
                        >
                            <BriefcaseBusiness className="mx-auto h-8 w-8 mb-3" />
                            <p className="font-semibold">
                                Alumni
                            </p>
                        </button>

                    </div>

                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSignUp(); }} className="mt-8 space-y-6">
                    <div className="space-y-4 rounded-md">
                        {/* Full Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-white text-sm font-medium">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    id="name"
                                    placeholder="Enter your full name"
                                    value={formData.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                    className={`h-12 pl-10 bg-white/10 border-white/2 text-white placeholder:text-gray-400${errors.name ? "border-red-500" : ""}`}
                                />
                            </div>
                            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-white text-sm font-medium">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder={formData.role === "student" ? "Your student email ending with @nsut.ac.in" : "your.email@example.com"}
                                    value={formData.email}
                                    onChange={(e) => handleChange("email", e.target.value)}
                                    className={`h-12 pl-10 bg-white/10 border-white/2 text-white placeholder:text-gray-400${errors.email ? "border-red-500" : ""}`}
                                />
                            </div>
                            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-white text-sm font-medium">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Create a strong password"
                                    value={formData.password}
                                    onChange={(e) => handleChange("password", e.target.value)}
                                    className={`h-12 pl-10 bg-white/10 border-white/2 text-white placeholder:text-gray-400 ${errors.password ? "border-red-500" : ""}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-sm text-red-600">{errors.password}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-white text-sm font-medium">Confirm Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirm your password"
                                    value={confirmPassword}
                                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                                    className={`h-12 pl-10 bg-white/10 border-white/2 text-white placeholder:text-gray-400 ${errors.confirmPassword ? "border-red-300" : ""}`}
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-3 h-5 w-5 text-gray-400 hover:text-gray-300"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-sm text-red-300">{errors.confirmPassword}</p>}
                        </div>
                    </div>

                    {unverifiedEmail ? (
                        <div className="text-base text-center text-gray-300">
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
    );
};

export default Signup;
