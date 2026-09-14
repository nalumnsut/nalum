import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import axios from "axios";
import { validatePassword, PASSWORD_REQUIREMENTS } from "@/lib/passwordPolicy";
import { cn } from "@/lib/utils";

import { useAuth } from "@/context/AuthContext";

const ChangePassword = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasPassword = user?.hasPassword;
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

    if (hasPassword && !formData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else {
      const passwordError = validatePassword(formData.newPassword);
      if (passwordError) {
        newErrors.newPassword = passwordError;
      } else if (formData.newPassword === formData.currentPassword) {
        newErrors.newPassword =
          "New password must be different from current password";
      }
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
        currentPassword: hasPassword ? formData.currentPassword : "",
        newPassword: formData.newPassword,
      });

      toast.success("Password Updated", {
        description: "Your password has been updated successfully.",
      });

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      navigate("/dashboard/profile");
    } catch (error) {
      let message = "Failed to update password";
      if (axios.isAxiosError(error)) {
        message = error.response?.data?.message || message;
      }
      toast.error("Password Update Failed", {
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    cn(
      "pl-10 pr-10 h-11 bg-background border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-primary focus-visible:border-primary",
      hasError && "border-destructive focus-visible:ring-destructive"
    );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-foreground pb-12 md:pb-16">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          type="button"
          variant="ghost"
          onClick={() => navigate("/dashboard/profile")}
          className="h-8 -ml-3 px-3 text-label-sm text-muted-foreground hover:text-primary hover:bg-primary/5"
        >
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Back to Profile
        </Button>

        {/* Page Header */}
        <div>
          <h1 className="text-headline-lg-mobile md:text-headline-xl text-primary">
            {hasPassword ? "Reset Password" : "Set Password"}
          </h1>
          <p className="text-body-md text-muted-foreground mt-1">
            {hasPassword ? "Update your password to keep your alumni portal account secure." : "Choose a strong password to secure your account."}
          </p>
        </div>

        {/* Main Card */}
        <div className="rounded-card border border-border bg-card shadow-card p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-4 pb-5 border-b border-border">
            <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-headline-md text-foreground">
                {hasPassword ? "Change Your Password" : "Set Your Password"}
              </h2>
              <p className="text-body-sm text-muted-foreground mt-0.5">
                {hasPassword ? "Enter your current password and choose a strong new one." : "Choose a strong password to secure your account."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            {hasPassword && (
              <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="currentPassword" className="text-foreground">
                  Current Password
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-label-sm text-primary hover:underline"
                >
                  Forgot current password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="currentPassword"
                  type={showCurrent ? "text" : "password"}
                  placeholder="Enter your current password"
                  value={formData.currentPassword}
                  onChange={(e) =>
                    handleChange("currentPassword", e.target.value)
                  }
                  className={inputClass(!!errors.currentPassword)}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                  aria-label={
                    showCurrent ? "Hide current password" : "Show current password"
                  }
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-body-sm text-destructive mt-1">
                  {errors.currentPassword}
                </p>
              )}
            </div>
            )}

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-foreground">
                New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="newPassword"
                  type={showNew ? "text" : "password"}
                  placeholder="Enter a new password"
                  value={formData.newPassword}
                  onChange={(e) => handleChange("newPassword", e.target.value)}
                  className={inputClass(!!errors.newPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                  aria-label={
                    showNew ? "Hide new password" : "Show new password"
                  }
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-body-sm text-destructive mt-1">
                  {errors.newPassword}
                </p>
              )}
            </div>

            {/* Confirm New Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">
                Confirm New Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your new password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleChange("confirmPassword", e.target.value)
                  }
                  className={inputClass(!!errors.confirmPassword)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-muted-foreground hover:text-foreground p-0.5 rounded transition-colors"
                  aria-label={
                    showConfirm
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-body-sm text-destructive mt-1">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Requirements Box */}
            <div className="rounded-lg border border-border bg-surface-low p-4 text-body-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2 font-medium text-foreground">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span>Password Requirements</span>
              </div>
              <ul className="space-y-1.5 pl-6 list-disc">
                {PASSWORD_REQUIREMENTS.map((req) => (
                  <li key={req}>{req}</li>
                ))}
                <li>Must match in both new password fields</li>
                <li>Must be different from your current password</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/dashboard/profile")}
                className="border-border bg-card text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-primary hover:bg-primary-hover text-primary-foreground font-semibold px-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;