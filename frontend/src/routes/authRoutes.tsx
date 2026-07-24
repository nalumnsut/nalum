import { lazy } from "react";
import { Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  loadLogin,
  loadSignUp,
  loadOtpVerificationPage,
  loadProfileForm,
  loadForgotPassword,
  loadResetPassword,
} from "./loaders";

const Login = lazy(loadLogin);
const SignUp = lazy(loadSignUp);
const OtpVerificationPage = lazy(loadOtpVerificationPage);
const ProfileForm = lazy(loadProfileForm);
const ForgotPassword = lazy(loadForgotPassword);
const ResetPassword = lazy(loadResetPassword);

export function AuthRoutes() {
  return (
    <>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/otp-verification" element={<OtpVerificationPage />} />
      <Route path="/profile-form" element={<ProtectedRoute><ProfileForm /></ProtectedRoute>} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </>
  );
}
