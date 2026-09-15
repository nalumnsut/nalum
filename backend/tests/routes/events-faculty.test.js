const express = require("express");
const request = require("supertest");

// Role lookup keyed by the test user id sent via header
const usersById = {
  "faculty-1": {
    _id: "faculty-1",
    name: "Faculty User",
    email: "faculty@nsut.ac.in",
    role: "faculty",
    verified_alumni: true,
  },
  "alumni-1": {
    _id: "alumni-1",
    name: "Alumni User",
    email: "alumni@example.com",
    role: "alumni",
    verified_alumni: true,
  },
  "student-1": {
    _id: "student-1",
    name: "Student User",
    email: "student@nsut.ac.in",
    role: "student",
    verified_alumni: false,
  },
};

jest.mock("../../middleware/auth", () => ({
  protect: (req, res, next) => {
    req.user = { user_id: req.headers["x-test-user-id"] || "student-1" };
    next();
  },
}));

jest.mock("../../config/eventImage.multer", () => ({
  single: () => (req, res, next) => next(),
}));

jest.mock("../../middleware/imageCompression", () => ({
  compressionPresets: { eventImage: (req, res, next) => next() },
}));

jest.mock("../../models/admin/event.model", () => jest.fn());

jest.mock("../../models/admin/settings.model", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../models/user/user.model", () => ({
  findById: jest.fn(),
}));

jest.mock("../../services/mentionHelper", () => ({
  notifyMentions: jest.fn(),
}));

jest.mock("../../utils/deleteHelper", () => ({
  assertDeletePermission: jest.fn(),
  cleanupFile: jest.fn(),
}));

const Event = require("../../models/admin/event.model");
const Settings = require("../../models/admin/settings.model");
const User = require("../../models/user/user.model");
const eventsRoutes = require("../../routes/events");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/events", eventsRoutes);
  return app;
};

const eventPayload = () => ({
  title: "Tech Talk",
  description: "A talk about testing",
  event_date: "2026-10-01",
  event_time: "10:00",
  location: "Main Campus",
  event_type: "workshop",
});

describe("POST /api/events/create faculty gate (Phase 3A)", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
    // Hosting enabled (no restrictive setting), user resolved from header id
    Settings.findOne.mockResolvedValue(null);
    User.findById.mockImplementation((id) =>
      Promise.resolve(usersById[id] || null)
    );
    Event.mockImplementation((data) => ({
      ...data,
      _id: { toString: () => "event-123" },
      save: jest.fn().mockResolvedValue(true),
    }));
  });

  it("allows faculty to host events (201)", async () => {
    const response = await request(app)
      .post("/api/events/create")
      .set("x-test-user-id", "faculty-1")
      .send(eventPayload());

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      success: true,
      message: "Event submitted for approval",
    });
  });

  it("still allows alumni to host events (201) — existing behavior", async () => {
    const response = await request(app)
      .post("/api/events/create")
      .set("x-test-user-id", "alumni-1")
      .send(eventPayload());

    expect(response.status).toBe(201);
  });

  it("still rejects students with 403 — existing behavior", async () => {
    const response = await request(app)
      .post("/api/events/create")
      .set("x-test-user-id", "student-1")
      .send(eventPayload());

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "Only alumni and faculty can host events",
    });
  });
});
