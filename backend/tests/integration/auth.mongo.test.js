process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "auth-integration-test-secret";

jest.mock("../../mail/transporter.js", () => ({
  sendMail: jest.fn().mockResolvedValue({ error: false }),
}));

const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const authRoutes = require("../../routes/auth");
const mailer = require("../../mail/transporter.js");
const User = require("../../models/user/user.model");
const Session = require("../../models/auth/session.model");
const OTP = require("../../models/auth/otp.model");
const VerificationToken = require("../../models/auth/verificationToken.model");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRoutes);
  return app;
};

const cookieValue = (headers, name) => {
  const cookie = headers["set-cookie"]?.find((value) =>
    value.startsWith(`${name}=`),
  );
  return cookie?.split(";")[0].split("=")[1];
};

const createUser = async (overrides = {}) => {
  const plainPassword = overrides.plainPassword || "password123";
  const password = await bcrypt.hash(plainPassword, 10);

  const user = await User.create({
    name: "Mongo Auth User",
    email: "mongo-auth-user@example.com",
    password,
    role: "alumni",
    email_verified: true,
    email_verified_at: new Date(),
    ...overrides,
  });

  return { user, plainPassword };
};

describe("auth Mongo integration", () => {
  let mongoServer;
  let app;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({
      instance: { ip: "127.0.0.1", port: 27019 },
    });
    await mongoose.connect(mongoServer.getUri());
    app = buildApp();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    await Promise.all([
      User.deleteMany({}),
      Session.deleteMany({}),
      OTP.deleteMany({}),
      VerificationToken.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer?.stop();
  });

  it("POST /api/auth/sign-up registers a user and stores a hashed password", async () => {
    const plainPassword = "password123";
    const email = "mongo-auth-user@example.com";

    const signupResponse = await request(app).post("/api/auth/sign-up").send({
      name: "Mongo Auth User",
      email,
      password: plainPassword,
      role: "alumni",
    });

    expect(signupResponse.status).toBe(201);
    expect(signupResponse.body).toMatchObject({
      err: false,
      code: 201,
      message: "User created successfully",
      data: {
        name: "Mongo Auth User",
        email,
        role: "alumni",
      },
    });

    const user = await User.findOne({ email });

    expect(user).not.toBeNull();
    expect(user.name).toBe("Mongo Auth User");
    expect(user.email).toBe(email);
    expect(user.role).toBe("alumni");
    expect(user.email_verified).toBe(false);
    expect(user.password).not.toBe(plainPassword);
    await expect(bcrypt.compare(plainPassword, user.password)).resolves.toBe(true);
  });

  it("POST /api/auth/send-verification-link and GET /api/auth/verify-account-link verify an account", async () => {
    const { user } = await createUser({
      email: "link-user@example.com",
      email_verified: false,
      email_verified_at: null,
    });

    const sendResponse = await request(app)
      .post("/api/auth/send-verification-link")
      .send({ email: "Link-User@Example.com" });

    expect(sendResponse.status).toBe(200);
    expect(sendResponse.body).toEqual({
      error: false,
      message: "Verification link sent to email.",
    });
    expect(mailer.sendMail).toHaveBeenCalledWith(
      "link-user@example.com",
      "Verify Your Account - NSUT AlumniNet",
      expect.any(String),
      expect.any(String),
    );

    const token = await VerificationToken.findOne({
      email: "link-user@example.com",
    });
    expect(token).not.toBeNull();

    const verifyResponse = await request(app)
      .get("/api/auth/verify-account-link")
      .query({ email: user.email, token: token.token });

    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body).toEqual({
      error: false,
      message: "Email verified successfully",
    });

    await expect(User.findById(user._id)).resolves.toMatchObject({
      email_verified: true,
    });
    await expect(
      VerificationToken.findOne({ email: user.email }),
    ).resolves.toBeNull();
  });

  it("POST /api/auth/send-otp and POST /api/auth/verify-account-otp verify an account", async () => {
    const { user } = await createUser({
      email: "otp-user@example.com",
      email_verified: false,
      email_verified_at: null,
    });

    const sendResponse = await request(app)
      .post("/api/auth/send-otp")
      .send({ email: user.email });

    expect(sendResponse.status).toBe(200);
    expect(sendResponse.body).toEqual({
      error: false,
      message: "Verification code sent successfully to your registered email",
      code: 200,
    });
    expect(mailer.sendMail).toHaveBeenCalledWith(
      user.email,
      "Your Alumni Portal Access Code",
      expect.any(String),
      expect.any(String),
    );

    const otp = await OTP.findOne({ email: user.email });
    expect(otp).not.toBeNull();

    const verifyResponse = await request(app)
      .post("/api/auth/verify-account-otp")
      .send({ email: user.email, otp: otp.otp });

    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body).toEqual({
      error: false,
      code: 200,
      message: "Account verified successfully",
    });

    const verifiedUser = await User.findById(user._id);
    expect(verifiedUser.email_verified).toBe(true);
    expect(verifiedUser.email_verified_at).toBeInstanceOf(Date);
    await expect(OTP.findOne({ email: user.email })).resolves.toBeNull();
  });

  it("POST /api/auth/sign-in logs in a verified user and creates a session", async () => {
    const { user, plainPassword } = await createUser({
      email: "signin-user@example.com",
    });

    const loginResponse = await request(app).post("/api/auth/sign-in").send({
      email: user.email,
      password: plainPassword,
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.headers["set-cookie"][0]).toContain("refresh_token=");
    expect(loginResponse.body).toMatchObject({
      error: false,
      data: {
        email: user.email,
        access_token: expect.any(String),
        user: {
          id: user._id.toString(),
          name: "Mongo Auth User",
          email: user.email,
          role: "alumni",
          email_verified: true,
          profileCompleted: false,
          verified_alumni: false,
        },
      },
    });
    expect(loginResponse.body.data.refresh_token).toBeUndefined();

    const session = await Session.findOne({ email: user.email });
    expect(session).not.toBeNull();
    expect(session.user_id.toString()).toBe(user._id.toString());
  });

  it("POST /api/auth/refresh rotates the refresh token cookie", async () => {
    const { user, plainPassword } = await createUser({
      email: "refresh-user@example.com",
    });

    const loginResponse = await request(app).post("/api/auth/sign-in").send({
      email: user.email,
      password: plainPassword,
    });
    const oldRefreshToken = cookieValue(loginResponse.headers, "refresh_token");

    const refreshResponse = await request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [`refresh_token=${oldRefreshToken}`])
      .send();

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body).toMatchObject({
      error: false,
      data: {
        access_token: expect.any(String),
        email: user.email,
        user: {
          id: user._id.toString(),
          email: user.email,
        },
      },
    });
    expect(refreshResponse.body.data.refresh_token).toBeUndefined();

    const newRefreshToken = cookieValue(refreshResponse.headers, "refresh_token");
    expect(newRefreshToken).toBeTruthy();
    expect(newRefreshToken).not.toBe(oldRefreshToken);
    await expect(
      Session.findOne({ refresh_token: oldRefreshToken }),
    ).resolves.toBeNull();
    await expect(
      Session.findOne({ refresh_token: newRefreshToken }),
    ).resolves.not.toBeNull();
  });

  it("POST /api/auth/revoke-token deletes a refresh token session", async () => {
    const { user, plainPassword } = await createUser({
      email: "revoke-user@example.com",
    });

    const loginResponse = await request(app).post("/api/auth/sign-in").send({
      email: user.email,
      password: plainPassword,
    });
    const refreshToken = cookieValue(loginResponse.headers, "refresh_token");

    const response = await request(app).post("/api/auth/revoke-token").send({
      refresh_token: refreshToken,
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      error: false,
      message: "Session deleted successfully",
    });
    await expect(
      Session.findOne({ refresh_token: refreshToken }),
    ).resolves.toBeNull();
  });

  it("POST /api/auth/logout clears the cookie and deletes the current session", async () => {
    const { user, plainPassword } = await createUser({
      email: "logout-user@example.com",
    });

    const loginResponse = await request(app).post("/api/auth/sign-in").send({
      email: user.email,
      password: plainPassword,
    });
    const refreshToken = cookieValue(loginResponse.headers, "refresh_token");

    const logoutResponse = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", [`refresh_token=${refreshToken}`])
      .send();

    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.headers["set-cookie"][0]).toContain("refresh_token=");
    expect(logoutResponse.body).toEqual({
      error: false,
      message: "Logged out successfully",
    });
    await expect(
      Session.findOne({ refresh_token: refreshToken }),
    ).resolves.toBeNull();
  });

  it("POST /api/auth/forget-password and POST /api/auth/reset-password reset a password", async () => {
    const { user, plainPassword } = await createUser({
      email: "reset-user@example.com",
    });

    const forgetResponse = await request(app)
      .post("/api/auth/forget-password")
      .send({ email: "Reset-User@Example.com" });

    expect(forgetResponse.status).toBe(200);
    expect(forgetResponse.body).toEqual({
      error: false,
      message: "If this email exists, a reset link has been sent.",
    });
    expect(mailer.sendMail).toHaveBeenCalledWith(
      user.email,
      "Reset Your Password - NSUT AlumniNet",
      expect.any(String),
      expect.any(String),
    );

    const textBody = mailer.sendMail.mock.calls[0][2];
    const token = textBody.match(/token=([^ \n]+)/)[1];
    expect(jwt.verify(token, process.env.JWT_SECRET)).toMatchObject({
      email: user.email,
    });

    const resetResponse = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "newPassword123" });

    expect(resetResponse.status).toBe(200);
    expect(resetResponse.body).toEqual({
      error: false,
      message: "Password reset successfully",
    });

    const changedUser = await User.findById(user._id);
    await expect(
      bcrypt.compare("newPassword123", changedUser.password),
    ).resolves.toBe(true);
    await expect(bcrypt.compare(plainPassword, changedUser.password)).resolves.toBe(
      false,
    );
  });
});
