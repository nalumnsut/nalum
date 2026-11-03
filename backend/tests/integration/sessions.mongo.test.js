process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "sessions-test-secret";

jest.mock("../../mail/mailService.js", () => ({
  send: jest.fn().mockResolvedValue({ error: false }),
}));

const express = require("express");
const cookieParser = require("cookie-parser");
const request = require("supertest");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const authRoutes = require("../../routes/auth");
const User = require("../../models/user/user.model");
const Session = require("../../models/auth/session.model");
const OTP = require("../../models/auth/otp.model");

const PASSWORD = "password123";

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

const mobileHeaders = (deviceId) => ({
  "X-NALUM-Client": "mobile",
  "X-Device-Id": deviceId,
  "X-Device-Name": "Pixel 9",
  "X-Device-Platform": "android",
  "X-App-Version": "1.0.0",
});

const createUser = async (overrides = {}) =>
  User.create({
    name: "Mobile Session User",
    email: "mobile-user@example.com",
    password: await bcrypt.hash(PASSWORD, 10),
    role: "alumni",
    email_verified: true,
    email_verified_at: new Date(),
    authProvider: "local",
    ...overrides,
  });

// Pretend every session was last rotated well outside the 20 s grace window
const expireGraceWindows = () =>
  Session.updateMany(
    { consumed_at: { $exists: true } },
    { consumed_at: new Date(Date.now() - 60 * 1000) },
  );

describe("per-browser and per-device sessions", () => {
  let mongoServer;
  let app;
  let user;

  // A browser that still holds its refresh cookie sends it along on sign-in
  const webSignIn = (cookieToken) => {
    const req = request(app).post("/api/auth/sign-in");
    if (cookieToken) req.set("Cookie", [`refresh_token=${cookieToken}`]);
    return req.send({ email: user.email, password: PASSWORD });
  };

  const mobileSignIn = (deviceId) =>
    request(app)
      .post("/api/auth/sign-in")
      .set(mobileHeaders(deviceId))
      .send({ email: user.email, password: PASSWORD });

  const mobileRefresh = (refreshToken) =>
    request(app)
      .post("/api/auth/refresh")
      .set({ "X-NALUM-Client": "mobile" })
      .send({ refresh_token: refreshToken });

  const webRefresh = (refreshToken) =>
    request(app)
      .post("/api/auth/refresh")
      .set("Cookie", [`refresh_token=${refreshToken}`])
      .send();

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { ip: "127.0.0.1" } });
    await mongoose.connect(mongoServer.getUri());
    await Session.syncIndexes();
    app = buildApp();
  });

  beforeEach(async () => {
    user = await createUser();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await Promise.all([User.deleteMany({}), Session.deleteMany({}), OTP.deleteMany({})]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer?.stop();
  });

  it("web sign-in keeps the token in the cookie, never in the body", async () => {
    const res = await webSignIn();

    expect(res.status).toBe(200);
    expect(cookieValue(res.headers, "refresh_token")).toBeTruthy();
    expect(res.body.data.refresh_token).toBeUndefined();

    const session = await Session.findOne({ user_id: user._id });
    expect(session.client_type).toBe("web");
  });

  it("two browsers get separate sessions and refreshing in turn never logs either out", async () => {
    let laptop = cookieValue((await webSignIn()).headers, "refresh_token");
    let phoneBrowser = cookieValue((await webSignIn()).headers, "refresh_token");
    expect(phoneBrowser).not.toBe(laptop);

    for (let round = 0; round < 3; round += 1) {
      const a = await webRefresh(laptop);
      const b = await webRefresh(phoneBrowser);
      expect([a.status, b.status]).toEqual([200, 200]);
      laptop = cookieValue(a.headers, "refresh_token");
      phoneBrowser = cookieValue(b.headers, "refresh_token");
      await expireGraceWindows();
    }

    await expect(Session.countDocuments({ user_id: user._id })).resolves.toBe(2);
  });

  it("signing in again from the same browser replaces its session's token", async () => {
    const first = cookieValue((await webSignIn()).headers, "refresh_token");
    const second = cookieValue((await webSignIn(first)).headers, "refresh_token");

    expect(second).not.toBe(first);
    await expect(Session.countDocuments({ user_id: user._id })).resolves.toBe(1);

    // The replaced token just stops working; it is not treated as reuse
    expect((await webRefresh(first)).status).toBe(401);
    expect((await webRefresh(second)).status).toBe(200);
  });

  it("a browser on a legacy shared session gets its own and leaves the old one to other browsers", async () => {
    const legacy = await Session.create({
      email: user.email,
      user_id: user._id,
      refresh_token: "legacy-shared-token",
    });

    const res = await webSignIn("legacy-shared-token");
    const own = cookieValue(res.headers, "refresh_token");

    expect(own).not.toBe("legacy-shared-token");
    await expect(Session.findById(legacy._id)).resolves.not.toBeNull();
    expect((await webRefresh("legacy-shared-token")).status).toBe(200);
  });

  it("a cookie from another user's session is never reused", async () => {
    const other = await createUser({ email: "other@example.com" });
    await Session.create({
      email: other.email,
      user_id: other._id,
      client_type: "web",
      refresh_token: "other-users-token",
    });

    await webSignIn("other-users-token");

    await expect(Session.findOne({ refresh_token: "other-users-token" })).resolves.toMatchObject({
      user_id: other._id,
    });
    await expect(Session.countDocuments({ user_id: user._id })).resolves.toBe(1);
  });

  it("keeps at most 10 sessions per user, dropping the least recently used", async () => {
    const tokens = [];
    for (let i = 0; i < 11; i += 1) {
      tokens.push(cookieValue((await webSignIn()).headers, "refresh_token"));
    }

    await expect(Session.countDocuments({ user_id: user._id })).resolves.toBe(10);
    await expect(Session.findOne({ refresh_token: tokens[0] })).resolves.toBeNull();
    await expect(Session.findOne({ refresh_token: tokens[10] })).resolves.not.toBeNull();
  });

  it("mobile sign-in returns the refresh token in the body and sets no cookie", async () => {
    const res = await mobileSignIn("device-a");

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeUndefined();
    expect(res.body.data).toMatchObject({
      access_token: expect.any(String),
      refresh_token: expect.any(String),
      user: { id: user._id.toString(), email: user.email },
    });

    const session = await Session.findOne({ refresh_token: res.body.data.refresh_token });
    expect(session).toMatchObject({
      client_type: "mobile",
      device_id: "device-a",
      device_name: "Pixel 9",
      platform: "android",
      app_version: "1.0.0",
    });
  });

  it("web and each mobile device get their own session", async () => {
    const phone = await mobileSignIn("device-a");
    const tablet = await mobileSignIn("device-b");
    const web = await webSignIn();

    const webToken = cookieValue(web.headers, "refresh_token");
    const tokens = new Set([phone.body.data.refresh_token, tablet.body.data.refresh_token, webToken]);

    expect(tokens.size).toBe(3);
    await expect(Session.countDocuments({ user_id: user._id })).resolves.toBe(3);
  });

  it("signing in again on the same device replaces that device's session", async () => {
    const first = await mobileSignIn("device-a");
    const second = await mobileSignIn("device-a");

    expect(second.body.data.refresh_token).not.toBe(first.body.data.refresh_token);
    await expect(Session.countDocuments({ user_id: user._id, device_id: "device-a" })).resolves.toBe(1);

    const stale = await mobileRefresh(first.body.data.refresh_token);
    expect(stale.status).toBe(401);
  });

  it("mobile refresh via the body rotates the token and returns it in the body", async () => {
    const login = await mobileSignIn("device-a");
    const oldToken = login.body.data.refresh_token;

    const res = await mobileRefresh(oldToken);

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeUndefined();
    expect(res.body.data).toMatchObject({
      access_token: expect.any(String),
      refresh_token: expect.any(String),
      user: { id: user._id.toString() },
    });
    expect(res.body.data.refresh_token).not.toBe(oldToken);

    // A retry with the old token inside the grace window gets the current token
    const retry = await mobileRefresh(oldToken);
    expect(retry.status).toBe(200);
    expect(retry.body.data.refresh_token).toBe(res.body.data.refresh_token);
  });

  it("web and two devices refreshing in turn never log each other out", async () => {
    let webToken = cookieValue((await webSignIn()).headers, "refresh_token");
    let phoneToken = (await mobileSignIn("device-a")).body.data.refresh_token;
    let tabletToken = (await mobileSignIn("device-b")).body.data.refresh_token;

    for (let round = 0; round < 3; round += 1) {
      const web = await webRefresh(webToken);
      const phone = await mobileRefresh(phoneToken);
      const tablet = await mobileRefresh(tabletToken);

      expect([web.status, phone.status, tablet.status]).toEqual([200, 200, 200]);

      webToken = cookieValue(web.headers, "refresh_token");
      phoneToken = phone.body.data.refresh_token;
      tabletToken = tablet.body.data.refresh_token;
      await expireGraceWindows();
    }

    await expect(Session.countDocuments({ user_id: user._id })).resolves.toBe(3);
  });

  it("reusing a token after the grace window revokes only that session", async () => {
    const webToken = cookieValue((await webSignIn()).headers, "refresh_token");
    const phoneToken = (await mobileSignIn("device-a")).body.data.refresh_token;

    await mobileRefresh(phoneToken);
    await expireGraceWindows();

    const replay = await mobileRefresh(phoneToken);
    expect(replay.status).toBe(401);

    await expect(Session.countDocuments({ user_id: user._id, device_id: "device-a" })).resolves.toBe(0);
    const web = await webRefresh(webToken);
    expect(web.status).toBe(200);
  });

  it("mobile logout with the body token deletes only that device's session", async () => {
    const webToken = cookieValue((await webSignIn()).headers, "refresh_token");
    const phoneToken = (await mobileSignIn("device-a")).body.data.refresh_token;
    const tabletToken = (await mobileSignIn("device-b")).body.data.refresh_token;

    const res = await request(app)
      .post("/api/auth/logout")
      .set({ "X-NALUM-Client": "mobile" })
      .send({ refresh_token: phoneToken });

    expect(res.status).toBe(200);
    await expect(Session.findOne({ refresh_token: phoneToken })).resolves.toBeNull();
    await expect(Session.findOne({ refresh_token: tabletToken })).resolves.not.toBeNull();
    await expect(Session.findOne({ refresh_token: webToken })).resolves.not.toBeNull();
  });

  it("refresh with no cookie and no body token is still rejected", async () => {
    const res = await request(app).post("/api/auth/refresh").send();
    expect(res.status).toBe(401);
  });

  it("mobile OTP verification auto-login returns tokens in the body without cookies", async () => {
    await User.updateOne({ _id: user._id }, { email_verified: false });
    await request(app).post("/api/auth/send-otp").send({ email: user.email });
    const otp = await OTP.findOne({ email: user.email });

    const res = await request(app)
      .post("/api/auth/verify-account-otp")
      .set(mobileHeaders("device-a"))
      .send({ email: user.email, otp: otp.otp });

    expect(res.status).toBe(200);
    expect(res.headers["set-cookie"]).toBeUndefined();
    expect(res.body.data).toMatchObject({
      access_token: expect.any(String),
      refresh_token: expect.any(String),
    });
    await expect(
      Session.findOne({ refresh_token: res.body.data.refresh_token, client_type: "mobile" }),
    ).resolves.not.toBeNull();
  });

  it("invalid device headers are ignored rather than stored", async () => {
    const res = await request(app)
      .post("/api/auth/sign-in")
      .set({ "X-NALUM-Client": "mobile", "X-Device-Id": "<script>alert(1)</script>" })
      .send({ email: user.email, password: PASSWORD });

    expect(res.status).toBe(200);
    const session = await Session.findOne({ refresh_token: res.body.data.refresh_token });
    expect(session.client_type).toBe("mobile");
    expect(session.device_id).toBeUndefined();
  });
});
