import { normalizeVisualization, MAX_STEPS, MAX_ARRAY } from "@/lib/visualization";

describe("normalizeVisualization", () => {
  it("accepts a well-formed array visualization", () => {
    const v = normalizeVisualization({
      kind: "array",
      title: "Two pointers",
      input: [2, 7, 11, 15],
      steps: [{ array: [2, 7, 11, 15], highlight: [0, 3], pointers: [{ label: "lo", index: 0 }], note: "start" }],
    });
    expect(v?.kind).toBe("array");
    if (v?.kind === "array") {
      expect(v.input).toEqual([2, 7, 11, 15]);
      expect(v.steps[0].highlight).toEqual([0, 3]);
      expect(v.steps[0].pointers[0]).toEqual({ label: "lo", index: 0 });
    }
  });

  it("passes through an 'unsupported' result", () => {
    const v = normalizeVisualization({ kind: "unsupported", reason: "graph problem" });
    expect(v).toEqual({ kind: "unsupported", reason: "graph problem" });
  });

  it("drops out-of-range highlights and pointers", () => {
    const v = normalizeVisualization({
      kind: "array",
      input: [1, 2, 3],
      steps: [{ array: [1, 2, 3], highlight: [0, 9, -1], pointers: [{ label: "i", index: 5 }, { label: "j", index: 1 }], note: "" }],
    });
    if (v?.kind !== "array") throw new Error("expected array");
    expect(v.steps[0].highlight).toEqual([0]);
    expect(v.steps[0].pointers).toEqual([{ label: "j", index: 1 }]);
  });

  it("repairs a step whose array length mismatches the input", () => {
    const v = normalizeVisualization({
      kind: "array",
      input: [5, 6, 7, 8],
      steps: [{ array: [9], highlight: [], pointers: [], note: "bad length" }],
    });
    if (v?.kind !== "array") throw new Error("expected array");
    expect(v.steps[0].array).toHaveLength(4);
  });

  it("clamps oversized arrays and step counts", () => {
    const big = Array.from({ length: 50 }, (_, i) => i);
    const v = normalizeVisualization({
      kind: "array",
      input: big,
      steps: Array.from({ length: 100 }, () => ({ array: big, highlight: [], pointers: [], note: "x" })),
    });
    if (v?.kind !== "array") throw new Error("expected array");
    expect(v.input.length).toBeLessThanOrEqual(MAX_ARRAY);
    expect(v.steps.length).toBeLessThanOrEqual(MAX_STEPS);
  });

  it("returns null for junk or empty input", () => {
    expect(normalizeVisualization(null)).toBeNull();
    expect(normalizeVisualization({ kind: "array", input: [], steps: [] })).toBeNull();
    expect(normalizeVisualization({ kind: "array", input: [1], steps: [] })).toBeNull();
  });
});
