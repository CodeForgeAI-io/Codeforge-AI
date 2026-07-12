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

  it("coerces an invalid cell state to 'default'", () => {
    const v = normalizeVisualization({
      kind: "array", input: [1, 2],
      steps: [{ array: [1, 2], states: ["active", "nonsense"], highlight: [], pointers: [], note: "" }],
    });
    if (v?.kind !== "array") throw new Error("expected array");
    expect(v.steps[0].states).toEqual(["active", "default"]);
  });
});

describe("normalizeVisualization · grid", () => {
  it("accepts a matrix with per-cell states", () => {
    const v = normalizeVisualization({
      kind: "grid", title: "DP",
      steps: [{ grid: [[0, 1], [1, 0]], states: [["done", "active"], ["default", "compare"]], note: "fill" }],
    });
    expect(v?.kind).toBe("grid");
    if (v?.kind === "grid") expect(v.steps[0].grid).toEqual([[0, 1], [1, 0]]);
  });

  it("returns null when no step has a grid", () => {
    expect(normalizeVisualization({ kind: "grid", steps: [{ note: "x" }] })).toBeNull();
  });
});

describe("normalizeVisualization · linkedlist", () => {
  it("accepts nodes with pointers", () => {
    const v = normalizeVisualization({
      kind: "linkedlist",
      steps: [{ values: [1, 2, 3], states: ["visited", "active", "default"], pointers: [{ label: "slow", index: 1 }], note: "" }],
    });
    if (v?.kind !== "linkedlist") throw new Error("expected linkedlist");
    expect(v.steps[0].pointers[0]).toEqual({ label: "slow", index: 1 });
  });
});

describe("normalizeVisualization · graph", () => {
  it("keeps valid nodes/edges and drops dangling references", () => {
    const v = normalizeVisualization({
      kind: "graph", layout: "tree", directed: true,
      nodes: [{ id: "1", label: "1" }, { id: "2", label: "2" }],
      edges: [{ from: "1", to: "2" }, { from: "1", to: "99" }],
      steps: [{ states: { "1": "visited", "99": "active" }, activeEdges: [["1", "2"], ["1", "99"]], note: "bfs" }],
    });
    if (v?.kind !== "graph") throw new Error("expected graph");
    expect(v.edges).toHaveLength(1);
    expect(v.steps[0].states).toEqual({ "1": "visited" });
    expect(v.steps[0].activeEdges).toEqual([["1", "2"]]);
    expect(v.layout).toBe("tree");
  });

  it("maps kind 'tree' onto the graph normalizer", () => {
    const v = normalizeVisualization({
      kind: "tree",
      nodes: [{ id: "a", label: "a" }, { id: "b", label: "b" }],
      edges: [{ from: "a", to: "b" }],
      steps: [{ states: {}, note: "" }],
    });
    expect(v?.kind).toBe("graph");
  });

  it("returns null with fewer than two nodes", () => {
    expect(normalizeVisualization({ kind: "graph", nodes: [{ id: "1", label: "1" }], edges: [], steps: [{ note: "" }] })).toBeNull();
  });
});
