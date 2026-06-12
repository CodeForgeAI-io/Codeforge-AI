import {
  normalizeOutput,
  outputsMatch,
} from "@/services/execution/normalize";

describe("normalizeOutput", () => {
  it("strips trailing whitespace per line and surrounding blank lines", () => {
    expect(normalizeOutput("hello  \nworld \n\n")).toBe("hello\nworld");
  });

  it("normalizes CRLF line endings", () => {
    expect(normalizeOutput("a\r\nb\r\n")).toBe("a\nb");
  });
});

describe("outputsMatch", () => {
  it("matches identical output", () => {
    expect(outputsMatch("42", "42")).toBe(true);
  });

  it("ignores trailing whitespace and newlines", () => {
    expect(outputsMatch("42\n", "42")).toBe(true);
    expect(outputsMatch("a b  \n", "a b")).toBe(true);
  });

  it("is JSON-aware: spacing inside arrays doesn't matter", () => {
    expect(outputsMatch("[0, 1]", "[0,1]")).toBe(true);
    expect(outputsMatch('{"a": 1}', '{"a":1}')).toBe(true);
  });

  it("rejects genuinely different output", () => {
    expect(outputsMatch("[0,1]", "[1,0]")).toBe(false);
    expect(outputsMatch("42", "43")).toBe(false);
    expect(outputsMatch("", "42")).toBe(false);
  });

  it("does not coerce different JSON types", () => {
    expect(outputsMatch("1", '"1"')).toBe(false);
  });
});
