jest.mock("../../models/posts/post.model", () => ({
  create: jest.fn(),
}));

jest.mock("../../models/posts/comment.model", () => ({
  aggregate: jest.fn(),
}));

jest.mock("../../models/user/user.model", () => ({
  findById: jest.fn(),
}));

jest.mock("../../models/user/profile.model", () => ({
  find: jest.fn(),
}));

jest.mock("../../models/admin/settings.model", () => ({
  findOne: jest.fn(),
}));

jest.mock("../../services/mentionHelper", () => ({
  notifyMentions: jest.fn(),
  extractSpecialMentionGroups: jest.fn(() => []),
}));

jest.mock("../../queues/emailQueue", () => ({
  queueAdminPostBroadcast: jest.fn(),
}));

jest.mock("../../services/notificationService", () => ({}));

jest.mock("../../utils/deleteHelper", () => ({
  assertDeletePermission: jest.fn(),
}));

jest.mock("../../utils/cascadeDelete", () => ({
  cascadeDeletePost: jest.fn(),
}));

const Post = require("../../models/posts/post.model");
const User = require("../../models/user/user.model");
const Settings = require("../../models/admin/settings.model");
const { notifyMentions } = require("../../services/mentionHelper");
const { createPost } = require("../../controllers/posts.controller");
const {
  visibilityFilter,
  isVisibleTo,
} = require("../../utils/postHelpers");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockReq = (userId) => ({
  user: { user_id: userId },
  body: { title: "Test post", content: "Hello world" },
});

const dbUser = (overrides = {}) => ({
  _id: "user-123",
  name: "Test User",
  email: "test@nsut.ac.in",
  role: "alumni",
  verified_alumni: true,
  ...overrides,
});

describe("createPost faculty gate (Phase 3A)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Manual-approval mode by default so notifyMentions stays out of the way
    Settings.findOne.mockResolvedValue(null);
    Post.create.mockImplementation((data) => ({
      _id: { toString: () => "post-123" },
      ...data,
    }));
  });

  it("allows faculty to create posts (201)", async () => {
    User.findById.mockResolvedValue(
      dbUser({ role: "faculty", verified_alumni: true })
    );

    const res = mockRes();
    await createPost(mockReq("faculty-1"), res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(Post.create).toHaveBeenCalledTimes(1);
  });

  it("allows verified alumni to create posts (201) — existing behavior", async () => {
    User.findById.mockResolvedValue(
      dbUser({ role: "alumni", verified_alumni: true })
    );

    const res = mockRes();
    await createPost(mockReq("alumni-1"), res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(Post.create).toHaveBeenCalledTimes(1);
  });

  it("allows admins to create posts (201) — existing behavior", async () => {
    User.findById.mockResolvedValue(dbUser({ role: "admin" }));

    const res = mockRes();
    await createPost(mockReq("admin-1"), res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(Post.create).toHaveBeenCalledTimes(1);
  });

  it("rejects students with 403 — existing behavior", async () => {
    User.findById.mockResolvedValue(dbUser({ role: "student" }));

    const res = mockRes();
    await createPost(mockReq("student-1"), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: "Only verified alumni and faculty can create posts",
    });
    expect(Post.create).not.toHaveBeenCalled();
  });

  it("rejects unverified alumni with 403 — existing behavior", async () => {
    User.findById.mockResolvedValue(
      dbUser({ role: "alumni", verified_alumni: false })
    );

    const res = mockRes();
    await createPost(mockReq("alumni-2"), res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(Post.create).not.toHaveBeenCalled();
  });

  it("faculty posts inherit the alumni auto-approval path", async () => {
    User.findById.mockResolvedValue(
      dbUser({ role: "faculty", verified_alumni: true })
    );
    Settings.findOne.mockResolvedValue({ value: 1 });

    const res = mockRes();
    await createPost(mockReq("faculty-1"), res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(Post.create).toHaveBeenCalledWith(
      expect.objectContaining({ status: "approved" })
    );
    expect(notifyMentions).toHaveBeenCalled();
  });
});

describe("postHelpers faculty visibility (Phase 3A, D6=A)", () => {
  it('routes faculty into the ["everyone","alumni"] filter branch', () => {
    expect(visibilityFilter("faculty")).toEqual({
      $or: [
        { visibility: { $exists: false } },
        { visibility: { $in: ["everyone", "alumni"] } },
      ],
    });
  });

  it("lets faculty open alumni-visibility posts (no list/detail mismatch)", () => {
    expect(isVisibleTo({ visibility: "alumni" }, "faculty")).toBe(true);
  });

  it("keeps existing visibility behavior for other roles", () => {
    expect(isVisibleTo({ visibility: "alumni" }, "alumni")).toBe(true);
    expect(isVisibleTo({ visibility: "alumni" }, "student")).toBe(false);
    expect(isVisibleTo({ visibility: "students" }, "faculty")).toBe(false);
    expect(isVisibleTo({ visibility: "students" }, "student")).toBe(true);
    expect(isVisibleTo({ visibility: "everyone" }, "faculty")).toBe(true);
    expect(isVisibleTo({}, "faculty")).toBe(true);
  });
});
