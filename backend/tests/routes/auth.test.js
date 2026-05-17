const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");

jest.mock("bcrypt", () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock("../../controllers/user.controller.js", () => ({
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../../controllers/session.controller.js", () => ({
  getOrCreate: jest.fn(),
  updateAccessToken: jest.fn(),
  delete: jest.fn(),
}));

jest.mock("../../controllers/verificationToken.controller.js", () => ({
  create: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
}));

jest.mock("../../controllers/otp.controller.js", () => ({
  create: jest.fn(),
  find: jest.fn(),
  remove: jest.fn(),
}));

jest.mock("../../mail/transporter.js", () => ({
  sendMail: jest.fn(),
}));

jest.mock("../../models/user/user.model.js", () => ({
  findById: jest.fn(),
}));

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const users = require("../../controllers/user.controller.js");
const sessions = require("../../controllers/session.controller.js");
const verificationTokens = require("../../controllers/verificationToken.controller.js");
const otpController = require("../../controllers/otp.controller.js");
const mailer = require("../../mail/transporter.js");
const User = require("../../models/user/user.model.js");
const authRoutes = require("../../routes/auth");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRoutes);
  return app;
};

const verifiedUser = (overrides = {}) => ({
  _id: "user-123",
  name: "Test User",
  email: "test@example.com",
  password: "hashed-password",
  role: "alumni",
  email_verified: true,
  profileCompleted: false,
  verified_alumni: false,
  banned: false,
  ban_expires_at: null,
  ban_reason: null,
  isStudentVerificationExpired: jest.fn().mockReturnValue(false),
  ...overrides,
});

describe("auth routes", () => {
  let app;

  beforeEach(() => {
    jest.resetAllMocks();
    delete process.env.DEBUG_MAIL;
    process.env.NODE_ENV = "test";
    app = buildApp();
  });

  describe("POST /api/auth/sign-up", () => {
    it("creates a user with valid signup data", async () => {
      users.findOne.mockResolvedValue({ error: false, data: null });
      bcrypt.hash.mockResolvedValue("hashed-password");
      users.create.mockResolvedValue({
        error: false,
        data: {
          _id: "new-user-123",
          name: "New User",
          email: "new@example.com",
          role: "alumni",
        },
      });

      const response = await request(app).post("/api/auth/sign-up").send({
        name: "New User",
        email: "new@example.com",
        password: "password123",
        role: "alumni",
      });

      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        err: false,
        code: 201,
        message: "User created successfully",
        data: {
          id: "new-user-123",
          name: "New User",
          email: "new@example.com",
          role: "alumni",
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith("password123", 10);
      expect(users.create).toHaveBeenCalledWith({
        name: "New User",
        email: "new@example.com",
        password: "hashed-password",
        role: "alumni",
      });
    });

    it("rejects signup when required fields are missing", async () => {
      const response = await request(app).post("/api/auth/sign-up").send({
        email: "new@example.com",
      });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        err: true,
        code: 400,
        message: "Required fields not provided",
      });
      expect(users.findOne).not.toHaveBeenCalled();
    });

    it("rejects admin signup", async () => {
      const response = await request(app).post("/api/auth/sign-up").send({
        name: "Admin User",
        email: "admin@example.com",
        password: "password123",
        role: "admin",
      });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        err: true,
        code: 403,
        message:
          "Admin accounts cannot be created via signup. Contact system administrator.",
      });
    });

    it("requires student signups to use an nsut email", async () => {
      const response = await request(app).post("/api/auth/sign-up").send({
        name: "Student User",
        email: "student@example.com",
        password: "password123",
        role: "student",
      });

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        err: true,
        code: 400,
        message: "Students must use their @nsut.ac.in email address",
      });
    });

    it("returns verification prompt when an existing user is not verified", async () => {
      users.findOne.mockResolvedValue({
        error: false,
        data: verifiedUser({ email_verified: false, email: "new@example.com" }),
      });

      const response = await request(app).post("/api/auth/sign-up").send({
        name: "New User",
        email: "new@example.com",
        password: "password123",
        role: "alumni",
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        err: false,
        code: 200,
        message: "Account exists but not verified. Please verify your email.",
        needsVerification: true,
        email: "new@example.com",
      });
    });

    it("rejects signup when a verified user already exists", async () => {
      users.findOne.mockResolvedValue({
        error: false,
        data: verifiedUser({ email: "existing@example.com" }),
      });

      const response = await request(app).post("/api/auth/sign-up").send({
        name: "Existing User",
        email: "existing@example.com",
        password: "password123",
        role: "alumni",
      });

      expect(response.status).toBe(409);
      expect(response.body).toMatchObject({
        err: true,
        code: 409,
        message:
          "User with this email already exists and is verified. Please login instead.",
      });
    });
  });

  describe("POST /api/auth/sign-in", () => {
    it("logs in with valid credentials and sets a refresh token cookie", async () => {
      users.findOne.mockResolvedValue({
        error: false,
        data: verifiedUser(),
      });
      bcrypt.compare.mockResolvedValue(true);
      sessions.getOrCreate.mockResolvedValue({
        error: false,
        data: {
          _id: "session-123",
          email: "test@example.com",
          user_id: "user-123",
          refresh_token: "refresh-token-123",
          access_token: "access-token-123",
        },
      });

      const response = await request(app).post("/api/auth/sign-in").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.headers["set-cookie"][0]).toContain(
        "refresh_token=refresh-token-123",
      );
      expect(response.body).toMatchObject({
        error: false,
        data: {
          _id: "session-123",
          email: "test@example.com",
          user_id: "user-123",
          access_token: "access-token-123",
          user: {
            id: "user-123",
            name: "Test User",
            email: "test@example.com",
            role: "alumni",
            email_verified: true,
            profileCompleted: false,
            verified_alumni: false,
          },
        },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashed-password",
      );
      expect(sessions.getOrCreate).toHaveBeenCalledWith(
        "test@example.com",
        "user-123",
      );
    });

    it("rejects login when credentials are missing", async () => {
      const response = await request(app).post("/api/auth/sign-in").send({
        email: "test@example.com",
      });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        err: true,
        code: 401,
        message: "Required credentials not provided",
      });
    });

    it("rejects login when the user does not exist", async () => {
      users.findOne.mockResolvedValue({ error: false, data: null });

      const response = await request(app).post("/api/auth/sign-in").send({
        email: "missing@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        err: true,
        code: 401,
        message: "No User",
      });
    });

    it("rejects login for an unverified email", async () => {
      users.findOne.mockResolvedValue({
        error: false,
        data: verifiedUser({ email_verified: false }),
      });

      const response = await request(app).post("/api/auth/sign-in").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        err: true,
        code: 401,
        message: "Email not verified",
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("rejects login with an incorrect password", async () => {
      users.findOne.mockResolvedValue({
        error: false,
        data: verifiedUser(),
      });
      bcrypt.compare.mockResolvedValue(false);

      const response = await request(app).post("/api/auth/sign-in").send({
        email: "test@example.com",
        password: "wrong-password",
      });

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        err: true,
        code: 401,
        user: "Unauthorized: Incorrect Password",
      });
      expect(sessions.getOrCreate).not.toHaveBeenCalled();
    });

    it("rejects login for banned users", async () => {
      users.findOne.mockResolvedValue({
        error: false,
        data: verifiedUser({
          banned: true,
          ban_reason: "Policy violation",
        }),
      });

      const response = await request(app).post("/api/auth/sign-in").send({
        email: "test@example.com",
        password: "password123",
      });

      expect(response.status).toBe(403);
      expect(response.body).toMatchObject({
        err: true,
        code: 403,
        banned: true,
        ban_reason: "Policy violation",
      });
      expect(response.body.message).toContain(
        "Your account has been permanently banned.",
      );
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("refreshes access data and rotates the refresh token cookie", async () => {
      sessions.updateAccessToken.mockResolvedValue({
        error: false,
        data: {
          _id: "session-456",
          user_id: "user-123",
          refresh_token: "new-refresh-token",
          access_token: "new-access-token",
        },
      });
      User.findById.mockResolvedValue(verifiedUser());

      const response = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", ["refresh_token=old-refresh-token"])
        .send();

      expect(response.status).toBe(200);
      expect(sessions.updateAccessToken).toHaveBeenCalledWith(
        "old-refresh-token",
      );
      expect(response.headers["set-cookie"][0]).toContain(
        "refresh_token=new-refresh-token",
      );
      expect(response.body).toMatchObject({
        error: false,
        data: {
          _id: "session-456",
          user_id: "user-123",
          access_token: "new-access-token",
          email: "test@example.com",
          user: {
            id: "user-123",
            name: "Test User",
            email: "test@example.com",
            role: "alumni",
          },
        },
      });
      expect(response.body.data.refresh_token).toBeUndefined();
    });

    it("rejects refresh without a refresh token cookie", async () => {
      const response = await request(app).post("/api/auth/refresh").send();

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        err: true,
        code: 401,
        message: "No refresh token provided",
      });
    });

    it("rejects refresh when the session cannot be updated", async () => {
      sessions.updateAccessToken.mockResolvedValue({
        error: true,
        message: "Session not found",
      });

      const response = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", ["refresh_token=bad-refresh-token"])
        .send();

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        error: true,
        message: "Session not found",
      });
    });
  });

  describe("POST /api/auth/revoke-token", () => {
    it("revokes a refresh token", async () => {
      sessions.delete.mockResolvedValue({
        error: false,
        message: "Session deleted successfully",
      });

      const response = await request(app).post("/api/auth/revoke-token").send({
        refresh_token: "refresh-token-123",
      });

      expect(response.status).toBe(200);
      expect(sessions.delete).toHaveBeenCalledWith("refresh-token-123");
      expect(response.body).toEqual({
        error: false,
        message: "Session deleted successfully",
      });
    });

    it("rejects revoke-token without a refresh token", async () => {
      const response = await request(app).post("/api/auth/revoke-token").send({});

      expect(response.status).toBe(401);
      expect(response.body).toMatchObject({
        err: true,
        code: 400,
        message: "Required details are not provided",
      });
    });
  });

  describe("POST /api/auth/logout", () => {
    it("deletes the session from the refresh token cookie and clears the cookie", async () => {
      sessions.delete.mockResolvedValue({
        error: false,
        message: "Session deleted successfully",
      });

      const response = await request(app)
        .post("/api/auth/logout")
        .set("Cookie", ["refresh_token=refresh-token-123"])
        .send();

      expect(response.status).toBe(200);
      expect(sessions.delete).toHaveBeenCalledWith("refresh-token-123");
      expect(response.headers["set-cookie"][0]).toContain("refresh_token=");
      expect(response.body).toEqual({
        error: false,
        message: "Logged out successfully",
      });
    });

    it("logs out successfully even without a refresh token cookie", async () => {
      const response = await request(app).post("/api/auth/logout").send();

      expect(response.status).toBe(200);
      expect(sessions.delete).not.toHaveBeenCalled();
      expect(response.body).toEqual({
        error: false,
        message: "Logged out successfully",
      });
    });
  });

  describe("POST /api/auth/forget-password", () => {
    it("sends a reset link when the email belongs to a user", async () => {
      users.findOne.mockResolvedValue({
        error: false,
        data: verifiedUser({ email: "test@example.com" }),
      });
      jwt.sign.mockReturnValue("reset-token-123");
      mailer.sendMail.mockResolvedValue({ error: false });

      const response = await request(app).post("/api/auth/forget-password").send({
        email: "Test@Example.com",
      });

      expect(response.status).toBe(200);
      expect(users.findOne).toHaveBeenCalledWith("test@example.com");
      expect(jwt.sign).toHaveBeenCalledWith(
        { email: "test@example.com" },
        expect.any(String),
        { expiresIn: "5m" },
      );
      expect(mailer.sendMail).toHaveBeenCalledWith(
        "test@example.com",
        "Reset Your Password - NSUT AlumniNet",
        expect.stringContaining("reset-token-123"),
        expect.stringContaining("reset-token-123"),
      );
      expect(response.body).toEqual({
        error: false,
        message: "If this email exists, a reset link has been sent.",
      });
    });

    it("rejects forget-password without an email", async () => {
      const response = await request(app).post("/api/auth/forget-password").send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: true,
        message: "Email is required",
      });
    });

    it("does not reveal when the reset email does not exist", async () => {
      users.findOne.mockResolvedValue({ error: false, data: null });

      const response = await request(app).post("/api/auth/forget-password").send({
        email: "missing@example.com",
      });

      expect(response.status).toBe(200);
      expect(mailer.sendMail).not.toHaveBeenCalled();
      expect(response.body).toEqual({
        error: false,
        message: "If this email exists, a reset link has been sent.",
      });
    });
  });

  describe("POST /api/auth/reset-password", () => {
    it("resets a password with a valid token", async () => {
      jwt.verify.mockReturnValue({ email: "test@example.com" });
      bcrypt.hash.mockResolvedValue("new-hashed-password");
      users.update.mockResolvedValue({
        error: false,
        message: "User updated successfully",
      });

      const response = await request(app).post("/api/auth/reset-password").send({
        token: "reset-token-123",
        password: "newPassword123",
      });

      expect(response.status).toBe(200);
      expect(jwt.verify).toHaveBeenCalledWith("reset-token-123", expect.any(String));
      expect(bcrypt.hash).toHaveBeenCalledWith("newPassword123", 10);
      expect(users.update).toHaveBeenCalledWith("test@example.com", {
        password: "new-hashed-password",
      });
      expect(response.body).toEqual({
        error: false,
        message: "Password reset successfully",
      });
    });

    it("rejects reset-password when token or password is missing", async () => {
      const response = await request(app).post("/api/auth/reset-password").send({
        token: "reset-token-123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: true,
        message: "Token and password are required",
      });
    });

    it("rejects reset-password with an invalid token", async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error("invalid token");
      });

      const response = await request(app).post("/api/auth/reset-password").send({
        token: "bad-token",
        password: "newPassword123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: true,
        message: "Invalid or expired token",
      });
    });

    it("rejects reset-password with a short password", async () => {
      jwt.verify.mockReturnValue({ email: "test@example.com" });

      const response = await request(app).post("/api/auth/reset-password").send({
        token: "reset-token-123",
        password: "short",
      });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: true,
        message: "Password must be at least 8 characters long",
      });
      expect(users.update).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/auth/send-verification-link", () => {
    it("sends a verification link for an existing user", async () => {
      users.findOne.mockResolvedValue({
        error: false,
        data: verifiedUser({ email: "test@example.com" }),
      });
      verificationTokens.create.mockResolvedValue({
        error: false,
        data: {
          token: "verify-token-123",
          expires_at: new Date("2030-01-01T00:00:00.000Z"),
        },
      });
      mailer.sendMail.mockResolvedValue({ error: false });

      const response = await request(app)
        .post("/api/auth/send-verification-link")
        .send({ email: "Test@Example.com" });

      expect(response.status).toBe(200);
      expect(users.findOne).toHaveBeenCalledWith("test@example.com");
      expect(verificationTokens.create).toHaveBeenCalledWith("test@example.com");
      expect(mailer.sendMail).toHaveBeenCalledWith(
        "test@example.com",
        "Verify Your Account - NSUT AlumniNet",
        expect.stringContaining("verify-token-123"),
        expect.stringContaining("verify-token-123"),
      );
      expect(response.body).toEqual({
        error: false,
        message: "Verification link sent to email.",
      });
    });

    it("rejects send-verification-link without an email", async () => {
      const response = await request(app)
        .post("/api/auth/send-verification-link")
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: true,
        message: "Email is required",
      });
    });

    it("does not reveal when the verification email does not exist", async () => {
      users.findOne.mockResolvedValue({ error: false, data: null });

      const response = await request(app)
        .post("/api/auth/send-verification-link")
        .send({ email: "missing@example.com" });

      expect(response.status).toBe(200);
      expect(verificationTokens.create).not.toHaveBeenCalled();
      expect(mailer.sendMail).not.toHaveBeenCalled();
      expect(response.body).toEqual({
        error: false,
        message: "Verification link sent to email.",
      });
    });
  });

  describe("POST /api/auth/send-otp", () => {
    it("sends an OTP email", async () => {
      otpController.create.mockResolvedValue({
        error: false,
        data: { otp: "123456" },
      });
      mailer.sendMail.mockResolvedValue({ error: false });

      const response = await request(app).post("/api/auth/send-otp").send({
        email: "test@example.com",
      });

      expect(response.status).toBe(200);
      expect(otpController.create).toHaveBeenCalledWith("test@example.com");
      expect(mailer.sendMail).toHaveBeenCalledWith(
        "test@example.com",
        "Your Alumni Portal Access Code",
        expect.stringContaining("123456"),
        expect.stringContaining("123456"),
      );
      expect(response.body).toEqual({
        error: false,
        message: "Verification code sent successfully to your registered email",
        code: 200,
      });
    });

    it("rejects send-otp without an email", async () => {
      const response = await request(app).post("/api/auth/send-otp").send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: true,
        code: 400,
        message: "Email is required",
      });
    });

    it("returns a server error when OTP creation fails", async () => {
      otpController.create.mockResolvedValue({
        error: true,
        message: "Please wait before requesting another OTP",
      });

      const response = await request(app).post("/api/auth/send-otp").send({
        email: "test@example.com",
      });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: true,
        code: 500,
        message: "Please wait before requesting another OTP",
      });
    });
  });

  describe("GET /api/auth/verify-account-link", () => {
    it("verifies an account using a valid verification link token", async () => {
      verificationTokens.find.mockResolvedValue({
        error: false,
        data: { token: "verify-token-123" },
      });
      users.update.mockResolvedValue({
        error: false,
        message: "User updated successfully",
      });
      verificationTokens.remove.mockResolvedValue({
        error: false,
        message: "Token deleted successfully",
      });

      const response = await request(app)
        .get("/api/auth/verify-account-link")
        .query({ email: "test@example.com", token: "verify-token-123" });

      expect(response.status).toBe(200);
      expect(verificationTokens.find).toHaveBeenCalledWith(
        "test@example.com",
        "verify-token-123",
      );
      expect(users.update).toHaveBeenCalledWith("test@example.com", {
        email_verified: true,
      });
      expect(verificationTokens.remove).toHaveBeenCalledWith(
        "test@example.com",
        "verify-token-123",
      );
      expect(response.body).toEqual({
        error: false,
        message: "Email verified successfully",
      });
    });

    it("rejects verification link requests missing email or token", async () => {
      const response = await request(app)
        .get("/api/auth/verify-account-link")
        .query({ email: "test@example.com" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: true,
        code: 400,
        message: "Email and token are required",
      });
    });

    it("returns 404 when a verification token is not found", async () => {
      verificationTokens.find.mockResolvedValue({
        error: true,
        message: "Verification token not found",
      });

      const response = await request(app)
        .get("/api/auth/verify-account-link")
        .query({ email: "test@example.com", token: "missing-token" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: true,
        message: "Verification token not found",
      });
    });
  });

  describe("POST /api/auth/verify-account-otp", () => {
    it("verifies an account using a valid OTP", async () => {
      users.findOne.mockResolvedValue({
        error: false,
        data: verifiedUser({ email_verified: false }),
      });
      otpController.find.mockResolvedValue({
        error: false,
        data: { otp: "123456" },
      });
      users.update.mockResolvedValue({
        error: false,
        message: "User updated successfully",
      });
      otpController.remove.mockResolvedValue({
        error: false,
        message: "OTP removed successfully",
      });

      const response = await request(app)
        .post("/api/auth/verify-account-otp")
        .send({ email: "test@example.com", otp: "123456" });

      expect(response.status).toBe(200);
      expect(users.findOne).toHaveBeenCalledWith("test@example.com");
      expect(otpController.find).toHaveBeenCalledWith("test@example.com", "123456");
      expect(users.update).toHaveBeenCalledWith("test@example.com", {
        email_verified: true,
        email_verified_at: expect.any(Date),
      });
      expect(otpController.remove).toHaveBeenCalledWith(
        "test@example.com",
        "123456",
      );
      expect(response.body).toEqual({
        error: false,
        code: 200,
        message: "Account verified successfully",
      });
    });

    it("rejects OTP verification without email or OTP", async () => {
      const response = await request(app)
        .post("/api/auth/verify-account-otp")
        .send({ email: "test@example.com" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: true,
        code: 400,
        message: "Email and OTP are required",
      });
    });

    it("rejects OTP verification when the user does not exist", async () => {
      users.findOne.mockResolvedValue({ error: false, data: null });

      const response = await request(app)
        .post("/api/auth/verify-account-otp")
        .send({ email: "missing@example.com", otp: "123456" });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: true,
        code: 404,
        message: "User not found",
      });
    });

    it("rejects OTP verification when the account is already verified", async () => {
      users.findOne.mockResolvedValue({
        error: false,
        data: verifiedUser({ email_verified: true }),
      });

      const response = await request(app)
        .post("/api/auth/verify-account-otp")
        .send({ email: "test@example.com", otp: "123456" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: true,
        code: 400,
        message: "Account already verified",
      });
      expect(otpController.find).not.toHaveBeenCalled();
    });

    it("rejects OTP verification when the OTP is invalid", async () => {
      users.findOne.mockResolvedValue({
        error: false,
        data: verifiedUser({ email_verified: false }),
      });
      otpController.find.mockResolvedValue({
        error: true,
        message: "OTP not found",
      });

      const response = await request(app)
        .post("/api/auth/verify-account-otp")
        .send({ email: "test@example.com", otp: "000000" });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: true,
        code: 400,
        message: "OTP not found",
      });
    });
  });
});
