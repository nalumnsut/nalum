process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "mobile-push-routes-test-secret";

jest.mock("../../mail/mailService", () => ({ send: jest.fn() }));

const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const notificationRoutes = require("../../routes/notifications");
const { generateAccessToken } = require("../../controllers/jwt.controller");
const User = require("../../models/user/user.model");
const MobilePushToken = require("../../models/mobilePushToken.model");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/notifications", notificationRoutes);
  return app;
};

const createUser = (email) =>
  User.create({
    name: "Push User",
    email,
    password: "hashed-password",
    role: "alumni",
    email_verified: true,
    email_verified_at: new Date(),
  });

const bearer = (user) =>
  `Bearer ${generateAccessToken({ user_id: user._id, email: user.email, session_id: new mongoose.Types.ObjectId() })}`;

const validBody = {
  token: "fcm-token-1",
  platform: "android",
  device_id: "device-a",
  app_version: "1.0.0",
};

describe("mobile push token routes", () => {
  let mongoServer;
  let app;
  let alice;
  let bob;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { ip: "127.0.0.1" } });
    await mongoose.connect(mongoServer.getUri());
    app = buildApp();
  });

  beforeEach(async () => {
    alice = await createUser("alice@example.com");
    bob = await createUser("bob@example.com");
  });

  afterEach(async () => {
    await Promise.all([User.deleteMany({}), MobilePushToken.deleteMany({})]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer?.stop();
  });

  const register = (user, body) =>
    request(app)
      .post("/api/notifications/push/mobile/register")
      .set("Authorization", bearer(user))
      .send(body);

  const unregister = (user, body) =>
    request(app)
      .post("/api/notifications/push/mobile/unregister")
      .set("Authorization", bearer(user))
      .send(body);

  it("requires authentication", async () => {
    const res = await request(app).post("/api/notifications/push/mobile/register").send(validBody);
    expect(res.status).toBe(401);
  });

  it("registers a token for the signed-in user", async () => {
    const res = await register(alice, validBody);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, message: "Mobile push token saved" });
    await expect(MobilePushToken.findOne({ token: "fcm-token-1" })).resolves.toMatchObject({
      platform: "android",
      device_id: "device-a",
      app_version: "1.0.0",
      active: true,
    });
  });

  it("re-registering the same token updates it instead of duplicating", async () => {
    await register(alice, validBody);
    await MobilePushToken.updateOne({ token: "fcm-token-1" }, { active: false });

    await register(alice, { ...validBody, app_version: "1.1.0" });

    const tokens = await MobilePushToken.find({});
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ app_version: "1.1.0", active: true });
  });

  it("a refreshed token replaces the device's old one", async () => {
    await register(alice, validBody);
    await register(alice, { ...validBody, token: "fcm-token-2" });

    const tokens = await MobilePushToken.find({ user: alice._id });
    expect(tokens.map((t) => t.token)).toEqual(["fcm-token-2"]);
  });

  it("a token registered by another account moves to that account", async () => {
    await register(alice, validBody);
    await register(bob, validBody);

    const token = await MobilePushToken.findOne({ token: "fcm-token-1" });
    expect(token.user.toString()).toBe(bob._id.toString());
    await expect(MobilePushToken.countDocuments()).resolves.toBe(1);
  });

  it.each([
    ["missing token", { ...validBody, token: undefined }],
    ["unknown platform", { ...validBody, platform: "windows" }],
    ["missing device_id", { ...validBody, device_id: undefined }],
    ["non-string token", { ...validBody, token: { $gt: "" } }],
  ])("rejects %s", async (_label, body) => {
    const res = await register(alice, body);
    expect(res.status).toBe(400);
    await expect(MobilePushToken.countDocuments()).resolves.toBe(0);
  });

  it("unregister removes the caller's own token", async () => {
    await register(alice, validBody);

    const res = await unregister(alice, { token: "fcm-token-1" });

    expect(res.status).toBe(200);
    await expect(MobilePushToken.countDocuments()).resolves.toBe(0);
  });

  it("unregister cannot remove another user's token", async () => {
    await register(alice, validBody);

    const res = await unregister(bob, { token: "fcm-token-1" });

    expect(res.status).toBe(200);
    await expect(MobilePushToken.countDocuments()).resolves.toBe(1);
  });
});
