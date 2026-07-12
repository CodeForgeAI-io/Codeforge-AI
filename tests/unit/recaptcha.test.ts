import { verifyRecaptcha } from "@/lib/recaptcha";

const ORIGINAL = process.env.RECAPTCHA_SECRET_KEY;
const realFetch = global.fetch;

function mockFetch(body: unknown, throws = false) {
  global.fetch = jest.fn(() =>
    throws ? Promise.reject(new Error("network")) : Promise.resolve({ json: () => Promise.resolve(body) } as Response),
  ) as unknown as typeof fetch;
}

afterEach(() => {
  process.env.RECAPTCHA_SECRET_KEY = ORIGINAL;
  global.fetch = realFetch;
  jest.restoreAllMocks();
});

describe("verifyRecaptcha", () => {
  it("skips (ok) when no secret is configured", async () => {
    delete process.env.RECAPTCHA_SECRET_KEY;
    expect(await verifyRecaptcha("tok")).toEqual({ ok: true, reason: "not-configured" });
  });

  it("blocks a missing token when configured", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "secret";
    expect((await verifyRecaptcha(undefined)).ok).toBe(false);
  });

  it("fails open when Google is unreachable", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "secret";
    mockFetch(null, true);
    expect((await verifyRecaptcha("tok")).ok).toBe(true);
  });

  it("blocks when verification is unsuccessful", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "secret";
    mockFetch({ success: false, "error-codes": ["invalid-input-response"] });
    const r = await verifyRecaptcha("tok");
    expect(r.ok).toBe(false);
    expect(r.reason).toContain("invalid-input-response");
  });

  it("blocks a low score and accepts a high one (v3)", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "secret";
    mockFetch({ success: true, score: 0.1 });
    expect((await verifyRecaptcha("tok", { minScore: 0.5 })).ok).toBe(false);
    mockFetch({ success: true, score: 0.9 });
    expect((await verifyRecaptcha("tok", { minScore: 0.5 })).ok).toBe(true);
  });

  it("rejects an action mismatch", async () => {
    process.env.RECAPTCHA_SECRET_KEY = "secret";
    mockFetch({ success: true, score: 0.9, action: "login" });
    expect((await verifyRecaptcha("tok", { action: "register" })).ok).toBe(false);
  });
});
