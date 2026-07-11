import { escapeRegex, stripHtml, sanitizeUserContent, cap } from "@/lib/sanitize";

describe("escapeRegex", () => {
  it("escapes every regex metacharacter", () => {
    expect(escapeRegex(".*+?^${}()|[]\\")).toBe(
      "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\",
    );
  });

  it("neutralizes a ReDoS/NoSQL-injection attempt so it matches literally", () => {
    const evil = ".*";
    const re = new RegExp(escapeRegex(evil));
    expect(re.test("anything")).toBe(false); // would be true if unescaped
    expect(re.test(".*")).toBe(true);
  });

  it("leaves ordinary text unchanged", () => {
    expect(escapeRegex("two sum")).toBe("two sum");
  });
});

describe("stripHtml", () => {
  it("removes tags, null bytes, javascript: URIs and event handlers", () => {
    expect(stripHtml("<b>hi</b>")).toBe("hi");
    expect(stripHtml("a\0b")).toBe("ab");
    expect(stripHtml("JavaScript:alert(1)")).toBe("alert(1)");
    // The entire <img …> is a tag, so it is removed wholesale.
    expect(stripHtml("<img src=x onerror=alert(1)>")).toBe("");
  });

  it("trims surrounding whitespace", () => {
    expect(stripHtml("  hello  ")).toBe("hello");
  });
});

describe("sanitizeUserContent", () => {
  it("strips dangerous URI schemes and handlers but keeps markdown text", () => {
    expect(sanitizeUserContent("Hello **world**")).toBe("Hello **world**");
    expect(sanitizeUserContent("data:text/html,<script>")).toBe(",<script>");
    expect(sanitizeUserContent("onclick =x")).toBe("x");
    expect(sanitizeUserContent("javascript:void(0)")).toBe("void(0)");
  });
});

describe("cap", () => {
  it("truncates to the max length", () => {
    expect(cap("abcdef", 3)).toBe("abc");
  });

  it("returns the string untouched when shorter than max", () => {
    expect(cap("ab", 10)).toBe("ab");
  });

  it("returns empty string for non-string input", () => {
    // @ts-expect-error — exercising the runtime guard
    expect(cap(null, 5)).toBe("");
    // @ts-expect-error — exercising the runtime guard
    expect(cap(undefined, 5)).toBe("");
  });
});
