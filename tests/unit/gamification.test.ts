import {
  levelForXp,
  totalXpForLevel,
  XP_REWARDS,
  getLanguage,
  LANGUAGES,
} from "@/lib/constants";

describe("XP and level curve", () => {
  it("level 1 starts at 0 XP", () => {
    expect(totalXpForLevel(1)).toBe(0);
    expect(levelForXp(0)).toBe(1);
  });

  it("level thresholds increase monotonically", () => {
    for (let level = 1; level < 30; level++) {
      expect(totalXpForLevel(level + 1)).toBeGreaterThan(
        totalXpForLevel(level),
      );
    }
  });

  it("levelForXp is consistent with totalXpForLevel", () => {
    for (const xp of [0, 50, 99, 100, 250, 1000, 5000]) {
      const level = levelForXp(xp);
      expect(totalXpForLevel(level)).toBeLessThanOrEqual(xp);
      expect(totalXpForLevel(level + 1)).toBeGreaterThan(xp);
    }
  });

  it("harder problems award more XP", () => {
    expect(XP_REWARDS.Easy).toBeLessThan(XP_REWARDS.Medium);
    expect(XP_REWARDS.Medium).toBeLessThan(XP_REWARDS.Hard);
  });
});

describe("language registry", () => {
  it("supports all 12 required languages", () => {
    expect(LANGUAGES).toHaveLength(12);
  });

  it("every language has provider mappings", () => {
    for (const language of LANGUAGES) {
      expect(language.piston).toBeTruthy();
      expect(language.judge0).toBeGreaterThan(0);
      expect(language.monaco).toBeTruthy();
      expect(language.extension).toBeTruthy();
    }
  });

  it("getLanguage finds by id and rejects unknowns", () => {
    expect(getLanguage("python")?.label).toBe("Python");
    expect(getLanguage("cobol")).toBeUndefined();
  });
});
