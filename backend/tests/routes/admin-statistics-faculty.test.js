jest.mock("../../models/user/user.model", () => ({
  countDocuments: jest.fn(),
}));

jest.mock("../../models/admin/ban.model", () => ({
  countDocuments: jest.fn().mockResolvedValue(0),
}));

jest.mock("../../models/admin/event.model", () => ({
  countDocuments: jest.fn().mockResolvedValue(0),
}));

jest.mock("../../models/admin/newsletter.model", () => ({
  countDocuments: jest.fn().mockResolvedValue(0),
  aggregate: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../models/verificationQueue.model", () => ({
  countDocuments: jest.fn().mockResolvedValue(0),
}));

jest.mock("../../models/admin/adminActivity.model", () => ({
  find: jest.fn(),
}));

jest.mock("../../models/posts/post.model", () => ({
  countDocuments: jest.fn().mockResolvedValue(0),
  aggregate: jest.fn().mockResolvedValue([]),
}));

jest.mock("../../models/pageVisit.model", () => ({
  countDocuments: jest.fn().mockResolvedValue(0),
}));

const User = require("../../models/user/user.model");
const AdminActivity = require("../../models/admin/adminActivity.model");
const { getDashboardStats } = require("../../controllers/admin/statistics.controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe("getDashboardStats faculty counter (Phase 3C)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AdminActivity.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        limit: jest.fn().mockResolvedValue([]),
      }),
    });
    User.countDocuments.mockImplementation((query) =>
      Promise.resolve(query && query.role === "faculty" ? 7 : 0)
    );
  });

  it("counts non-banned faculty and exposes them as stats.users.faculty", async () => {
    const res = mockRes();
    await getDashboardStats({}, res);

    expect(User.countDocuments).toHaveBeenCalledWith({
      role: "faculty",
      banned: { $ne: true },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        stats: expect.objectContaining({
          users: expect.objectContaining({ faculty: 7 }),
        }),
      })
    );
  });
});
