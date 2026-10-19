jest.mock("../../models/user/profile.model", () => ({
  find: jest.fn(),
  countDocuments: jest.fn(),
}));

jest.mock("../../models/user/user.model", () => ({
  find: jest.fn(),
}));

jest.mock("../../models/chat/connections.model", () => ({
  find: jest.fn(),
}));

const Profile = require("../../models/user/profile.model");
const User = require("../../models/user/user.model");
const { searchProfiles } = require("../../controllers/search.controller");

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

// Profile.find(...).populate(...).limit(...).skip(...).exec() chain
const mockProfileFind = (rows = []) => {
  const exec = jest.fn().mockResolvedValue(rows);
  const skip = jest.fn().mockReturnValue({ exec });
  const limit = jest.fn().mockReturnValue({ skip });
  const populate = jest.fn().mockReturnValue({ limit });
  Profile.find.mockReturnValue({ populate });
};

describe("searchProfiles role filter (Phase 3A)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProfileFind([]);
    Profile.countDocuments.mockResolvedValue(0);
    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: "u1" }]),
    });
  });

  const runSearch = (role) =>
    searchProfiles(
      { query: { role }, user: { user_id: "me" } },
      mockRes()
    );

  it('forwards role=faculty to the user query', async () => {
    await runSearch("faculty");

    expect(User.find).toHaveBeenCalledTimes(1);
    expect(User.find.mock.calls[0][0]).toMatchObject({ role: "faculty" });
  });

  it("keeps forwarding role=alumni and role=student — existing behavior", async () => {
    await runSearch("alumni");
    expect(User.find.mock.calls[0][0]).toMatchObject({ role: "alumni" });

    jest.clearAllMocks();
    mockProfileFind([]);
    Profile.countDocuments.mockResolvedValue(0);
    User.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ _id: "u1" }]),
    });

    await runSearch("student");
    expect(User.find.mock.calls[0][0]).toMatchObject({ role: "student" });
  });

  it("never forwards role=admin — existing behavior", async () => {
    await runSearch("admin");

    expect(User.find).toHaveBeenCalledTimes(1);
    expect(User.find.mock.calls[0][0]).not.toHaveProperty("role");
  });
});
