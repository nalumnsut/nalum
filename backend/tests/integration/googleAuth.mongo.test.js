process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "google-auth-test-secret";

const WEB_CLIENT_ID = "web-client.apps.googleusercontent.com";
const ANDROID_CLIENT_ID = "android-client.apps.googleusercontent.com";
const IOS_CLIENT_ID = "ios-client.apps.googleusercontent.com";

const mockVerifyIdToken = jest.fn();
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
}));

const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const googleAuth = require("../../routes/auth/googleAuth");
const User = require("../../models/user/user.model");
const Session = require("../../models/auth/session.model");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth/google", googleAuth);
  return app;
};

const googlePayload = {
  email: "google-user@example.com",
  name: "Google User",
  sub: "google-sub-123",
};

describe("POST /api/auth/google", () => {
  let mongoServer;
  let app;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { ip: "127.0.0.1" } });
    await mongoose.connect(mongoServer.getUri());
    app = buildApp();
  });

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = WEB_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_IDS;
    mockVerifyIdToken.mockResolvedValue({ getPayload: () => googlePayload });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await Promise.all([User.deleteMany({}), Session.deleteMany({})]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer?.stop();
  });

  it("accepts only the website client ID when GOOGLE_CLIENT_IDS is unset", async () => {
    const res = await request(app)
      .post("/api/auth/google")
      .send({ credential: "id-token", role: "alumni" });

    expect(res.status).toBe(200);
    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: "id-token",
      audience: [WEB_CLIENT_ID],
    });
  });

  it("also accepts the app client IDs listed in GOOGLE_CLIENT_IDS", async () => {
    process.env.GOOGLE_CLIENT_IDS = ` ${ANDROID_CLIENT_ID}, ${IOS_CLIENT_ID} ,,${WEB_CLIENT_ID}`;

    await request(app)
      .post("/api/auth/google")
      .send({ credential: "id-token", role: "alumni" });

    expect(mockVerifyIdToken).toHaveBeenCalledWith({
      idToken: "id-token",
      audience: [WEB_CLIENT_ID, ANDROID_CLIENT_ID, IOS_CLIENT_ID],
    });
  });

  it("rejects a token Google's library refuses (e.g. unknown audience) without creating a session", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("Wrong recipient, payload audience != requiredAudience"));

    const res = await request(app)
      .post("/api/auth/google")
      .send({ credential: "id-token", role: "alumni" });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: true, message: "Authentication failed" });
    await expect(Session.countDocuments()).resolves.toBe(0);
    await expect(User.countDocuments()).resolves.toBe(0);
  });

  it("web Google sign-in still sets the refresh cookie and keeps it out of the body", async () => {
    const res = await request(app)
      .post("/api/auth/google")
      .send({ credential: "id-token", role: "alumni" });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"][0]).toContain("refresh_token=");
    expect(res.body.data.refresh_token).toBeUndefined();
    expect(res.body.data.user).toMatchObject({ email: googlePayload.email, role: "alumni" });
  });

  it("mobile Google sign-in returns the refresh token in the body and creates a device session", async () => {
    process.env.GOOGLE_CLIENT_IDS = `${ANDROID_CLIENT_ID},${IOS_CLIENT_ID}`;

    const res = await request(app)
      .post("/api/auth/google")
      .set({ "X-NALUM-Client": "mobile", "X-Device-Id": "ios-device-1", "X-Device-Platform": "ios" })
      .send({ credential: "id-token", role: "alumni" });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeUndefined();
    expect(res.body.data).toMatchObject({
      access_token: expect.any(String),
      refresh_token: expect.any(String),
    });
    await expect(
      Session.findOne({ refresh_token: res.body.data.refresh_token }),
    ).resolves.toMatchObject({ client_type: "mobile", device_id: "ios-device-1", platform: "ios" });
  });
});
