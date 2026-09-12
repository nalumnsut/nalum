const express = require("express");
const request = require("supertest");

jest.mock("../../models/user/user.model", () => ({
  find: jest.fn(),
}));

jest.mock("../../models/user/profile.model", () => ({
  find: jest.fn(),
}));

jest.mock("../../services/notificationService", () => ({
  createNotification: jest.fn(),
}));

jest.mock("../../middleware/auth", () => ({
  protect: (req, res, next) => {
    req.user = { user_id: "sender-1" };
    next();
  },
}));

const User = require("../../models/user/user.model");
const Profile = require("../../models/user/profile.model");
const notificationService = require("../../services/notificationService");
const {
  notifyMentions,
  extractSpecialMentionGroups,
} = require("../../services/mentionHelper");
const mentionRoutes = require("../../routes/mention");

const buildApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/mention", mentionRoutes);
  return app;
};

describe("mentionHelper special groups (Phase 3B)", () => {
  it("extracts @Faculty as the faculty group", () => {
    expect(extractSpecialMentionGroups("@Faculty please review")).toEqual([
      "faculty",
    ]);
  });

  it("is case-insensitive and keeps existing groups working", () => {
    expect(extractSpecialMentionGroups("@faculty FYI")).toEqual(["faculty"]);
    expect(extractSpecialMentionGroups("@All hands")).toEqual(["all"]);
    expect(extractSpecialMentionGroups("@Alumni and @Student")).toEqual(
      expect.arrayContaining(["alumni", "students"])
    );
  });
});

describe("notifyMentions faculty inclusion (Phase 3B)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("looks up faculty users alongside alumni/student", async () => {
    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([
        { _id: "faculty-9", name: "Jane Smith" },
      ]),
    });

    await notifyMentions({
      text: "@Jane Smith check this",
      senderId: "sender-1",
      senderName: "Sender",
      contextType: "post",
      contextTitle: "Hello",
      actionUrl: "/dashboard/posts/1",
    });

    expect(User.find).toHaveBeenCalledTimes(1);
    expect(User.find.mock.calls[0][0]).toMatchObject({
      role: { $in: ["alumni", "student", "faculty"] },
    });
    expect(notificationService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({ recipientId: "faculty-9" })
    );
  });
});

describe("GET /api/mention faculty autocomplete (Phase 3B)", () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = buildApp();
  });

  it("returns matching faculty users", async () => {
    const facultyUser = {
      _id: "faculty-1",
      name: "Faculty User",
      role: "faculty",
    };
    User.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([facultyUser]),
        }),
      }),
    });
    Profile.find.mockReturnValue({
      select: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const response = await request(app).get("/api/mention?q=Fac");

    expect(response.status).toBe(200);
    expect(User.find).toHaveBeenCalledWith(
      expect.objectContaining({
        role: { $in: ["alumni", "student", "faculty"] },
      })
    );
    expect(response.body.users).toEqual([
      {
        _id: facultyUser._id,
        name: "Faculty User",
        role: "faculty",
        profile_picture: null,
      },
    ]);
  });
});
