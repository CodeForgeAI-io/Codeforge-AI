import { slugify, uniqueSlug } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Two Sum")).toBe("two-sum");
  });

  it("strips special characters", () => {
    expect(slugify("What's the K-th Largest? (Hard!)")).toBe(
      "whats-the-k-th-largest-hard",
    );
  });

  it("collapses repeated separators", () => {
    expect(slugify("a   b___c")).toBe("a-b-c");
  });
});

describe("uniqueSlug", () => {
  it("returns the base slug when it is free", async () => {
    const slug = await uniqueSlug("Two Sum", async () => false);
    expect(slug).toBe("two-sum");
  });

  it("appends a suffix on collision", async () => {
    const slug = await uniqueSlug("Two Sum", async (s) => s === "two-sum");
    expect(slug).toMatch(/^two-sum-[a-z0-9]{5}$/);
  });
});
