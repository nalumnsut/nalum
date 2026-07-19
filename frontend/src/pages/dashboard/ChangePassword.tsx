import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, KeyRound, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import axios from "axios";

const ChangePassword = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }
    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters long";
    } else if (formData.newPassword === formData.currentPassword) {
      newErrors.newPassword = "New password must be different from current password";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await api.post("/auth/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      toast.success("Password Changed", {
        description: "Your password has been updated successfully.",
        style: {
          background: "#800000",
          color: "white",
          border: "2px solid #FFD700",
          fontSize: "16px",
        },
      });

      setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      navigate("/dashboard/profile");
    } catch (error) {
      let message = "Failed to change password";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      toast.error("Change Failed", {
        description: message,
        style: {
          background: "#800000",
          color: "white",
          border: "2px solid #FFD700",
          fontSize: "16px",
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `pl-10 pr-10 h-12 text-base bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus-visible:ring-blue-500/50 ${
      hasError ? "border-red-500" : ""
    }`;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-gray-100">
      <div className="container mx-auto">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-white/10"
              onClick={() => navigate("/dashboard/profile")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Profile
            </Button>
          </div>

          {/* Header */}
          <div className="mb-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <KeyRound className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Change Password</h2>
                <p className="text-sm text-gray-400">
                  Update the password for your account
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-gray-300">
                  Current Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <Input
                    id="currentPassword"
                    type={showCurrent ? "text" : "password"}
                    placeholder="Enter your current password"
                    value={formData.currentPassword}
                    onChange={(e) => handleChange("currentPassword", e.target.value)}
                    className={inputClass(!!errors.currentPassword)}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                  >
                    {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-sm text-red-400">{errors.currentPassword}</p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-gray-300">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <Input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    placeholder="Enter new password (min 8 characters)"
                    value={formData.newPassword}
                    onChange={(e) => handleChange("newPassword", e.target.value)}
                    className={inputClass(!!errors.newPassword)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                  >
                    {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-red-400">{errors.newPassword}</p>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-300">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleChange("confirmPassword", e.target.value)}
                    className={inputClass(!!errors.confirmPassword)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                  >
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-400">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/20 font-semibold text-base"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Changing password...
                  </span>
                ) : (
                  "Change Password"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;