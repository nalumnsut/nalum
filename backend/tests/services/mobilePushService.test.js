process.env.NODE_ENV = "test";

const mockSendEachForMulticast = jest.fn();
const mockInitializeApp = jest.fn((options, name) => ({ name }));
jest.mock("firebase-admin/app", () => ({
  initializeApp: mockInitializeApp,
  cert: jest.fn((json) => ({ cert: json })),
  applicationDefault: jest.fn(() => ({ applicationDefault: true })),
  getApps: jest.fn(() => []),
}));
jest.mock("firebase-admin/messaging", () => ({
  getMessaging: jest.fn(() => ({ sendEachForMulticast: mockSendEachForMulticast })),
}));

const mockWebPushSend = jest.fn();
jest.mock("web-push", () => ({
  setVapidDetails: jest.fn(),
  sendNotification: (...args) => mockWebPushSend(...args),
}));

jest.mock("../../mail/mailService", () => ({ send: jest.fn() }));

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const mobilePushService = require("../../services/mobilePushService");
const notificationService = require("../../services/notificationService");
const MobilePushToken = require("../../models/mobilePushToken.model");
const PushSubscription = require("../../models/pushSubscription.model");
const Session = require("../../models/auth/session.model");

const SERVICE_ACCOUNT = JSON.stringify({ project_id: "nalum-test", client_email: "x@y", private_key: "k" });

const userId = new mongoose.Types.ObjectId();

const notification = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  recipient: userId,
  type: "new_message",
  title: "New message",
  message: "Hi there",
  actionUrl: "/dashboard/chat/conv-1?messageId=m1",
  metadata: { conversationId: "conv-1" },
  ...overrides,
});

const signInDevice = (deviceId) =>
  Session.create({
    email: "push-user@example.com",
    user_id: userId,
    client_type: "mobile",
    device_id: deviceId,
    refresh_token: `refresh-${deviceId}`,
  });

const addToken = (deviceId, token = `fcm-${deviceId}`) =>
  MobilePushToken.create({ user: userId, token, platform: "android", device_id: deviceId });

const allSucceed = ({ tokens }) =>
  Promise.resolve({
    successCount: tokens.length,
    failureCount: 0,
    responses: tokens.map(() => ({ success: true })),
  });

describe("mobile push", () => {
  let mongoServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create({ instance: { ip: "127.0.0.1" } });
    await mongoose.connect(mongoServer.getUri());
  });

  beforeEach(() => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = SERVICE_ACCOUNT;
    delete process.env.GOOGLE_APPLICATION_CREDENTIALS;
    mobilePushService.resetForTests();
    mockSendEachForMulticast.mockImplementation(allSucceed);
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await Promise.all([
      MobilePushToken.deleteMany({}),
      PushSubscription.deleteMany({}),
      Session.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer?.stop();
  });

  it("does nothing (and does not crash) without Firebase credentials", async () => {
    delete process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    mobilePushService.resetForTests();
    await signInDevice("phone");
    await addToken("phone");

    await expect(mobilePushService.sendToUser(notification())).resolves.toBe(false);
    expect(mockInitializeApp).not.toHaveBeenCalled();
    expect(mockSendEachForMulticast).not.toHaveBeenCalled();
  });

  it("accepts base64-encoded service account JSON", async () => {
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON = Buffer.from(SERVICE_ACCOUNT).toString("base64");
    await signInDevice("phone");
    await addToken("phone");

    await expect(mobilePushService.sendToUser(notification())).resolves.toBe(true);
    expect(mockInitializeApp).toHaveBeenCalledWith(
      { credential: { cert: JSON.parse(SERVICE_ACCOUNT) } },
      "nalum-mobile-push",
    );
  });

  it("sends to every signed-in device with string data and per-conversation grouping", async () => {
    await signInDevice("phone");
    await signInDevice("tablet");
    await addToken("phone");
    await addToken("tablet");
    const n = notification();

    await expect(mobilePushService.sendToUser(n)).resolves.toBe(true);

    const message = mockSendEachForMulticast.mock.calls[0][0];
    expect(message.tokens.sort()).toEqual(["fcm-phone", "fcm-tablet"]);
    expect(message.notification).toEqual({ title: "New message", body: "Hi there" });
    expect(message.data).toEqual({
      url: "/dashboard/chat/conv-1?messageId=m1",
      notificationId: String(n._id),
      type: "new_message",
      conversationId: "conv-1",
    });
    expect(Object.values(message.data).every((v) => typeof v === "string")).toBe(true);
    expect(message.android).toMatchObject({
      priority: "high",
      collapseKey: "conv-1",
      notification: { channelId: "messages", tag: "conv-1" },
    });
    expect(message.apns.payload.aps["thread-id"]).toBe("conv-1");
  });

  it("uses the right channel and no grouping for non-chat notifications", () => {
    const message = mobilePushService.buildMessage(
      notification({ type: "event_reminder", metadata: {}, actionUrl: null }),
    );

    expect(message.data).toEqual(expect.objectContaining({ url: "/", type: "event_reminder" }));
    expect(message.data.conversationId).toBeUndefined();
    expect(message.android.collapseKey).toBeUndefined();
    expect(message.android.notification).toEqual({ channelId: "updates" });
    expect(message.apns.payload.aps["thread-id"]).toBeUndefined();
  });

  it("skips and deactivates tokens whose device is no longer signed in", async () => {
    await signInDevice("phone");
    await addToken("phone");
    await addToken("old-phone"); // logged out: no session for this device

    await mobilePushService.sendToUser(notification());

    expect(mockSendEachForMulticast.mock.calls[0][0].tokens).toEqual(["fcm-phone"]);
    await expect(MobilePushToken.findOne({ device_id: "old-phone" })).resolves.toMatchObject({ active: false });
  });

  it("returns false without calling FCM when no device is signed in", async () => {
    await addToken("phone");

    await expect(mobilePushService.sendToUser(notification())).resolves.toBe(false);
    expect(mockSendEachForMulticast).not.toHaveBeenCalled();
  });

  it("deactivates tokens FCM reports as unregistered and keeps the rest", async () => {
    await signInDevice("phone");
    await signInDevice("tablet");
    await addToken("phone");
    await addToken("tablet");
    mockSendEachForMulticast.mockImplementation(({ tokens }) =>
      Promise.resolve({
        successCount: 1,
        failureCount: 1,
        responses: tokens.map((t) =>
          t === "fcm-phone"
            ? { success: false, error: { code: "messaging/registration-token-not-registered" } }
            : { success: true },
        ),
      }),
    );

    await expect(mobilePushService.sendToUser(notification())).resolves.toBe(true);
    await expect(MobilePushToken.findOne({ token: "fcm-phone" })).resolves.toMatchObject({ active: false });
    await expect(MobilePushToken.findOne({ token: "fcm-tablet" })).resolves.toMatchObject({ active: true });
  });

  it("keeps tokens on temporary FCM errors and reports failure", async () => {
    await signInDevice("phone");
    await addToken("phone");
    mockSendEachForMulticast.mockResolvedValue({
      successCount: 0,
      failureCount: 1,
      responses: [{ success: false, error: { code: "messaging/internal-error" } }],
    });

    await expect(mobilePushService.sendToUser(notification())).resolves.toBe(false);
    await expect(MobilePushToken.findOne({ token: "fcm-phone" })).resolves.toMatchObject({ active: true });
  });

  describe("notificationService.sendPushNotification", () => {
    it("pushes to a mobile-only user (no web subscriptions)", async () => {
      await signInDevice("phone");
      await addToken("phone");

      await expect(notificationService.sendPushNotification(notification())).resolves.toBe(true);
      expect(mockSendEachForMulticast).toHaveBeenCalledTimes(1);
      expect(mockWebPushSend).not.toHaveBeenCalled();
    });

    it("pushes to both the browser and the phone", async () => {
      mockWebPushSend.mockResolvedValue({});
      await PushSubscription.create({
        user: userId,
        endpoint: "https://push.example.com/abc",
        keys: { p256dh: "p", auth: "a" },
      });
      await signInDevice("phone");
      await addToken("phone");

      await expect(notificationService.sendPushNotification(notification())).resolves.toBe(true);
      expect(mockWebPushSend).toHaveBeenCalledTimes(1);
      expect(mockSendEachForMulticast).toHaveBeenCalledTimes(1);
    });

    it("still returns false when the user has no browser or phone", async () => {
      await expect(notificationService.sendPushNotification(notification())).resolves.toBe(false);
    });
  });
});
