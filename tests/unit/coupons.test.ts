import { normalizeCode, computeDiscount } from "@/lib/coupon-math";

describe("normalizeCode", () => {
  it("uppercases and trims", () => {
    expect(normalizeCode("  launch50 ")).toBe("LAUNCH50");
  });

  it("caps length at 40 characters", () => {
    expect(normalizeCode("a".repeat(60))).toHaveLength(40);
  });

  it("coerces nullish input to an empty string", () => {
    // @ts-expect-error — exercising the runtime guard
    expect(normalizeCode(null)).toBe("");
    // @ts-expect-error — exercising the runtime guard
    expect(normalizeCode(undefined)).toBe("");
  });
});

describe("computeDiscount", () => {
  it("computes a percentage discount, rounded", () => {
    expect(computeDiscount({ type: "percent", value: 50 }, 1000)).toBe(500);
    expect(computeDiscount({ type: "percent", value: 33 }, 999)).toBe(330);
  });

  it("computes a flat discount", () => {
    expect(computeDiscount({ type: "flat", value: 200 }, 1000)).toBe(200);
  });

  it("never exceeds the order amount (no negative totals)", () => {
    expect(computeDiscount({ type: "percent", value: 150 }, 1000)).toBe(1000);
    expect(computeDiscount({ type: "flat", value: 5000 }, 1000)).toBe(1000);
  });

  it("returns 0 for a 0% or ₹0 coupon", () => {
    expect(computeDiscount({ type: "percent", value: 0 }, 1000)).toBe(0);
    expect(computeDiscount({ type: "flat", value: 0 }, 1000)).toBe(0);
  });
});
