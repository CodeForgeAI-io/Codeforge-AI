/**
 * Shared types + validation for the problem "algorithm visualizer".
 *
 * A visualization is a sequence of frames over one of several data structures
 * (array, grid/matrix, linked list, or graph/tree). Cells and nodes carry a
 * {@link CellState} that the renderer maps to a colour (comparing, swapping,
 * visited, done…). AI produces the raw JSON; {@link normalizeVisualization}
 * validates and clamps it so the client can trust it.
 */

export type VizCell = number | string;

/** Visual role of a cell/node on a given step → drives its colour + the legend. */
export type CellState = "default" | "active" | "compare" | "swap" | "visited" | "done";

export const CELL_STATES: CellState[] = ["default", "active", "compare", "swap", "visited", "done"];

export interface VizPointer {
  /** Short label shown by the cell, e.g. "i", "lo", "hi". */
  label: string;
  index: number;
}

// ── array ───────────────────────────────────────────────────────────────────
export interface ArrayStep {
  array: VizCell[];
  states?: CellState[];
  /** Back-compat: indices to mark as "compare" when `states` is absent. */
  highlight: number[];
  pointers: VizPointer[];
  note: string;
}
export interface ArrayVisualization {
  kind: "array";
  title: string;
  input: VizCell[];
  steps: ArrayStep[];
}

// ── grid / matrix ────────────────────────────────────────────────────────────
export interface GridStep {
  grid: VizCell[][];
  states?: CellState[][];
  note: string;
}
export interface GridVisualization {
  kind: "grid";
  title: string;
  steps: GridStep[];
}

// ── linked list ──────────────────────────────────────────────────────────────
export interface ListStep {
  values: VizCell[];
  states?: CellState[];
  pointers: VizPointer[];
  note: string;
}
export interface ListVisualization {
  kind: "linkedlist";
  title: string;
  steps: ListStep[];
}

// ── graph / tree ─────────────────────────────────────────────────────────────
export interface GraphNode {
  id: string;
  label: string;
}
export interface GraphEdge {
  from: string;
  to: string;
  weight?: number;
}
export interface GraphStep {
  states?: Record<string, CellState>;
  activeEdges?: [string, string][];
  note: string;
}
export interface GraphVisualization {
  kind: "graph";
  title: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed?: boolean;
  /** "tree" lays nodes out top-down by BFS level; "circle" spreads them evenly. */
  layout: "circle" | "tree";
  steps: GraphStep[];
}

export interface UnsupportedVisualization {
  kind: "unsupported";
  reason: string;
}

export type VizResult =
  | ArrayVisualization
  | GridVisualization
  | ListVisualization
  | GraphVisualization
  | UnsupportedVisualization;

/** Response for a "visualize this run" request. `verdict` is derived from the
 *  real test-run outcome (not the AI); `feedback` explains what the code does
 *  right, or what's wrong when it fails. */
export interface RunVizResponse {
  verdict: "correct" | "wrong";
  feedback: string;
  visualization: VizResult;
}

// ── guardrails ───────────────────────────────────────────────────────────────
export const MAX_STEPS = 48;
export const MAX_ARRAY = 24;
export const MAX_GRID = 12;
export const MAX_NODES = 24;
export const MAX_EDGES = 48;
const MAX_POINTERS = 6;

function toCell(v: unknown): VizCell | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") return v.slice(0, 12);
  return null;
}
function cleanCells(v: unknown, max = MAX_ARRAY): VizCell[] {
  if (!Array.isArray(v)) return [];
  return v.map(toCell).filter((c): c is VizCell => c !== null).slice(0, max);
}
function cleanState(v: unknown): CellState {
  return typeof v === "string" && (CELL_STATES as string[]).includes(v) ? (v as CellState) : "default";
}
function cleanStates(v: unknown, len: number): CellState[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const out = v.slice(0, len).map(cleanState);
  while (out.length < len) out.push("default");
  return out;
}
function cleanPointers(v: unknown, width: number): VizPointer[] {
  return (Array.isArray(v) ? v : [])
    .map((p) => {
      const po = (p ?? {}) as Record<string, unknown>;
      return {
        label: typeof po.label === "string" ? po.label.slice(0, 4) : "",
        index: typeof po.index === "number" ? Math.trunc(po.index) : NaN,
      };
    })
    .filter((p) => p.label && Number.isInteger(p.index) && p.index >= 0 && p.index < width)
    .slice(0, MAX_POINTERS);
}
function str(v: unknown, max: number, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.slice(0, max) : fallback;
}
function steps(obj: Record<string, unknown>): Record<string, unknown>[] {
  return (Array.isArray(obj.steps) ? obj.steps : [])
    .filter((s): s is Record<string, unknown> => !!s && typeof s === "object")
    .slice(0, MAX_STEPS);
}

function normArray(obj: Record<string, unknown>): ArrayVisualization | null {
  const input = cleanCells(obj.input);
  const width = input.length;
  if (!width) return null;
  const out: ArrayStep[] = [];
  for (const s of steps(obj)) {
    let array = cleanCells(s.array);
    if (array.length !== width) array = array.length ? array.slice(0, width) : input.slice();
    while (array.length < width) array.push(input[array.length]);
    const highlight = (Array.isArray(s.highlight) ? s.highlight : [])
      .map((n) => (typeof n === "number" ? Math.trunc(n) : NaN))
      .filter((n) => Number.isInteger(n) && n >= 0 && n < width);
    out.push({
      array,
      states: cleanStates(s.states, width),
      highlight,
      pointers: cleanPointers(s.pointers, width),
      note: str(s.note, 160),
    });
  }
  return out.length ? { kind: "array", title: str(obj.title, 120, "Walkthrough"), input, steps: out } : null;
}

function normGrid(obj: Record<string, unknown>): GridVisualization | null {
  const out: GridStep[] = [];
  let cols = 0;
  for (const s of steps(obj)) {
    if (!Array.isArray(s.grid)) continue;
    const grid = s.grid.slice(0, MAX_GRID).map((row) => cleanCells(row, MAX_GRID));
    if (!grid.length || !grid[0].length) continue;
    cols = Math.max(cols, ...grid.map((r) => r.length));
    const states = Array.isArray(s.states)
      ? s.states.slice(0, grid.length).map((row, r) => cleanStates(row, grid[r]?.length ?? 0) ?? [])
      : undefined;
    out.push({ grid, states, note: str(s.note, 160) });
  }
  return out.length && cols ? { kind: "grid", title: str(obj.title, 120, "Grid walkthrough"), steps: out } : null;
}

function normList(obj: Record<string, unknown>): ListVisualization | null {
  const out: ListStep[] = [];
  for (const s of steps(obj)) {
    const values = cleanCells(s.values);
    if (!values.length) continue;
    out.push({
      values,
      states: cleanStates(s.states, values.length),
      pointers: cleanPointers(s.pointers, values.length),
      note: str(s.note, 160),
    });
  }
  return out.length ? { kind: "linkedlist", title: str(obj.title, 120, "List walkthrough"), steps: out } : null;
}

function normGraph(obj: Record<string, unknown>): GraphVisualization | null {
  const nodes = (Array.isArray(obj.nodes) ? obj.nodes : [])
    .map((n) => {
      const no = (n ?? {}) as Record<string, unknown>;
      const id = typeof no.id === "string" ? no.id.slice(0, 16) : typeof no.id === "number" ? String(no.id) : "";
      return { id, label: str(no.label, 8, id) };
    })
    .filter((n) => n.id)
    .slice(0, MAX_NODES);
  if (nodes.length < 2) return null;
  const ids = new Set(nodes.map((n) => n.id));
  const edges = (Array.isArray(obj.edges) ? obj.edges : [])
    .map((e) => {
      const eo = (e ?? {}) as Record<string, unknown>;
      const from = typeof eo.from === "string" ? eo.from : typeof eo.from === "number" ? String(eo.from) : "";
      const to = typeof eo.to === "string" ? eo.to : typeof eo.to === "number" ? String(eo.to) : "";
      const weight = typeof eo.weight === "number" ? eo.weight : undefined;
      return { from, to, weight };
    })
    .filter((e) => ids.has(e.from) && ids.has(e.to))
    .slice(0, MAX_EDGES);

  const out: GraphStep[] = [];
  for (const s of steps(obj)) {
    const states: Record<string, CellState> = {};
    if (s.states && typeof s.states === "object") {
      for (const [k, v] of Object.entries(s.states as Record<string, unknown>)) {
        if (ids.has(k)) states[k] = cleanState(v);
      }
    }
    const activeEdges = (Array.isArray(s.activeEdges) ? s.activeEdges : [])
      .map((pair) => (Array.isArray(pair) ? [String(pair[0]), String(pair[1])] as [string, string] : null))
      .filter((p): p is [string, string] => !!p && ids.has(p[0]) && ids.has(p[1]))
      .slice(0, MAX_EDGES);
    out.push({ states, activeEdges, note: str(s.note, 160) });
  }
  if (!out.length) return null;
  const layout = obj.layout === "circle" ? "circle" : "tree";
  return { kind: "graph", title: str(obj.title, 120, "Graph walkthrough"), nodes, edges, directed: obj.directed === true, layout, steps: out };
}

/**
 * Validate and clamp raw (AI-produced) JSON into a safe {@link VizResult}.
 * Returns `null` if the input can't be salvaged into a usable visualization.
 */
export function normalizeVisualization(raw: unknown): VizResult | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  switch (obj.kind) {
    case "unsupported":
      return { kind: "unsupported", reason: str(obj.reason, 200, "Not visualizable.") };
    case "grid":
      return normGrid(obj);
    case "linkedlist":
      return normList(obj);
    case "graph":
    case "tree":
      return normGraph(obj);
    case "array":
    default:
      return normArray(obj);
  }
}
