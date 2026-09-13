import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi, Mock } from "vitest";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/SignUp";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import ChangePassword from "@/pages/dashboard/ChangePassword";
import apiClient from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const navigateMock = vi.fn();
const setAuthMock = vi.fn();

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
  setAuthToken: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
  trackLogin: vi.fn(),
  trackSignUp: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("react-router-dom", async () => {
  const actual =
    await vi.importActual<typeof import("react-router-dom")>("react-router-dom");

  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

const mockedApi = vi.mocked(apiClient);
const mockedUseAuth = vi.mocked(useAuth);

const renderWithRouter = (ui: React.ReactElement, route = "/") => {
  window.history.pushState({}, "Test page", route);

  return render(
    <MemoryRouter
      initialEntries={[route]}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      {ui}
    </MemoryRouter>,
  );
};

beforeEach(() => {
  mockedUseAuth.mockReturnValue({
    accessToken: null,
    user: null,
    isLoading: false,
    isAuthenticated: false,
    isAdmin: false,
    isFaculty: false,
    isVerifiedAlumni: null,
    setAuth: setAuthMock,
    logout: vi.fn(),
    refreshUser: vi.fn(),
  });
});

describe("auth pages", () => {
  it("keeps student login on the client when the email is not an NSUT address", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Login />, "/login");

    await user.type(screen.getByLabelText(/email address/i), "student@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    expect(
      await screen.findByText("Students/Faculty must use their @nsut.ac.in email address"),
    ).toBeInTheDocument();
    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(setAuthMock).not.toHaveBeenCalled();
  });

  it("logs in and redirects completed profiles to the dashboard", async () => {
    const user = userEvent.setup();
    (mockedApi.post as Mock).mockResolvedValueOnce({
      data: {
        data: {
          access_token: "access-token",
          email: "student@nsut.ac.in",
          user: {
            id: "user-1",
            name: "Student User",
            email: "student@nsut.ac.in",
            role: "student",
            email_verified: true,
            profileCompleted: true,
            verified_alumni: true,
          },
        },
      },
    });
    (mockedApi.get as Mock).mockResolvedValueOnce({
      data: { profileCompleted: true },
    });

    renderWithRouter(<Login />, "/login");

    await user.type(screen.getByLabelText(/email address/i), "student@nsut.ac.in");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith("/auth/sign-in", {
        email: "student@nsut.ac.in",
        password: "password123",
        role: "student",
        rememberMe: false,
      });
    });
    expect(setAuthMock).toHaveBeenCalledWith(
      "access-token",
      expect.objectContaining({ id: "user-1" }),
    );
    expect(mockedApi.get).toHaveBeenCalledWith("/profile/status", {
      headers: { Authorization: "Bearer access-token" },
    });
    expect(navigateMock).toHaveBeenCalledWith("/dashboard");
  });

  it("validates signup fields before calling the API", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Signup />, "/signup");

    // Step 1: pick a role and continue to the details step
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    await user.type(screen.getByLabelText(/full name/i), "New Student");
    await user.type(screen.getByLabelText(/email address/i), "new@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "short");
    await user.type(screen.getByLabelText(/confirm password/i), "different");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    expect(
      await screen.findByText("Students/Faculty must use their @nsut.ac.in email address"),
    ).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 8 characters long")).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("signs up a valid student and sends them to OTP verification", async () => {
    const user = userEvent.setup();
    (mockedApi.post as Mock).mockResolvedValueOnce({
      data: {
        err: false,
        data: { email: "new@nsut.ac.in" },
      },
    });

    renderWithRouter(<Signup />, "/signup");

    // Step 1: pick a role and continue to the details step
    await user.click(screen.getByRole("button", { name: /^continue$/i }));

    await user.type(screen.getByLabelText(/full name/i), "New Student");
    await user.type(screen.getByLabelText(/email address/i), "new@nsut.ac.in");
    await user.type(screen.getByLabelText(/^password$/i), "password123");
    await user.type(screen.getByLabelText(/confirm password/i), "password123");
    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith("/auth/sign-up", {
        name: "New Student",
        email: "new@nsut.ac.in",
        role: "student",
        password: "password123",
      });
    });
    expect(navigateMock).toHaveBeenCalledWith("/otp-verification", {
      state: { email: "new@nsut.ac.in" },
    });
  });

  it("shows the forgot-password confirmation even when the API rejects", async () => {
    const user = userEvent.setup();
    vi.spyOn(console, "error").mockImplementation(() => {});
    (mockedApi.post as Mock).mockRejectedValueOnce(new Error("network down"));

    renderWithRouter(<ForgotPassword />, "/forgot-password");

    await user.type(screen.getByLabelText(/email address/i), "missing@example.com");
    await user.click(screen.getByRole("button", { name: /send reset link/i }));

    expect(mockedApi.post).toHaveBeenCalledWith("/auth/forget-password", {
      email: "missing@example.com",
    });
    expect(await screen.findAllByRole("heading", { name: /check your email/i })).toHaveLength(2);
    expect(screen.getByText(/missing@example.com/i)).toBeInTheDocument();
  });

  it("renders an invalid reset link state without a token", async () => {
    renderWithRouter(<ResetPassword />, "/reset-password");

    expect(
      await screen.findByRole("heading", { name: /invalid or expired link/i }),
    ).toBeInTheDocument();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it("submits a valid password reset token and shows success", async () => {
    const user = userEvent.setup();
    (mockedApi.get as Mock).mockResolvedValueOnce({ data: { valid: true } });
    (mockedApi.post as Mock).mockResolvedValueOnce({ data: { error: false } });

    renderWithRouter(<ResetPassword />, "/reset-password?token=reset-token");

    const newPasswordInput = await screen.findByLabelText(/^new password$/i);
    await user.type(newPasswordInput, "newPassword123");
    await user.type(
      screen.getByLabelText(/confirm new password/i),
      "newPassword123",
    );
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith("/auth/reset-password", {
        token: "reset-token",
        password: "newPassword123",
      });
    });
    expect(
      await screen.findByRole("heading", { name: /password reset successful/i }),
    ).toBeInTheDocument();
  });

  it("validates fields and submits ChangePassword form", async () => {
    const user = userEvent.setup();
    (mockedApi.post as Mock).mockResolvedValueOnce({
      data: { error: false, message: "Password changed successfully" },
    });

    renderWithRouter(<ChangePassword />, "/dashboard/change-password");

    await user.type(
      screen.getByLabelText(/^current password$/i),
      "oldPassword123",
    );
    await user.type(screen.getByLabelText(/^new password$/i), "newPassword456");
    await user.type(
      screen.getByLabelText(/confirm new password/i),
      "newPassword456",
    );
    await user.click(screen.getByRole("button", { name: /reset password/i }));

    await waitFor(() => {
      expect(mockedApi.post).toHaveBeenCalledWith("/auth/change-password", {
        currentPassword: "oldPassword123",
        newPassword: "newPassword456",
      });
    });
    expect(navigateMock).toHaveBeenCalledWith("/dashboard/profile");
  });
});

