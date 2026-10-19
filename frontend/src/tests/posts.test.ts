import { describe, it, expect } from "vitest";
import { authorHeadline } from "@/lib/posts";

const baseAuthor = {
  _id: "u1",
  name: "Test User",
};

describe("authorHeadline role fallback (Phase 3C)", () => {
  it("reads Faculty when no headline is set", () => {
    expect(authorHeadline({ ...baseAuthor, role: "faculty" })).toBe("Faculty");
  });

  it("keeps existing fallbacks for other roles", () => {
    expect(authorHeadline({ ...baseAuthor, role: "admin" })).toBe(
      "Administrator"
    );
    expect(authorHeadline({ ...baseAuthor, role: "alumni" })).toBe("Alumni");
    expect(authorHeadline({ ...baseAuthor, role: "student" })).toBe("Alumni");
  });

  it("prefers the headline over the role fallback", () => {
    expect(
      authorHeadline({
        ...baseAuthor,
        role: "faculty",
        current_role: "Professor",
        current_company: "NSUT",
      })
    ).toBe("Professor at NSUT");
  });
});
