/**
 * Shared types + validation for the problem "algorithm visualizer".
 *
 * A visualization is a sequence of frames over an array-like structure. Each
 * step captures the array's current values, which indices are active
 * (highlighted), any named pointers (e.g. `i`, `lo`, `hi`), and a short note.
 * The animation player steps through these frames. AI produces the raw JSON;
 * {@link normalizeVisualization} validates and clamps it so the client can
 * trust it.
 */

export type VizCell = number | string;

export interface VizPointer {
  /** Short label shown above the cell, e.g. "i", "lo", "hi". */
  label: string;
  /** Zero-based index the pointer sits on. */
  index: number;
}

export interface VizStep {
  array: VizCell[];
  /** Indices currently being compared/acted on. */
  highlight: number[];
  pointers: VizPointer[];
  /** One short sentence describing what happens on this step. */
  note: string;
}

export interface ArrayVisualization {
  kind: "array";
  title: string;
  input: VizCell[];
  steps: VizStep[];
}

export interface UnsupportedVisualization {
  kind: "unsupported";
  reason: string;
}

export type VizResult = ArrayVisualization | UnsupportedVisualization;

/** Response for a "visualize this run" request. `verdict` is derived from the
 *  real test-run outcome (not the AI); `feedback` explains what the code does
 *  right, or what's wrong when it fails. */
export interface RunVizResponse {
  verdict: "correct" | "wrong";
  feedback: string;
  visualization: VizResult;
}

// Guardrails so a runaway AI response can't produce a huge/unrenderable payload.
export const MAX_STEPS = 40;
export const MAX_ARRAY = 20;
const MAX_POINTERS = 6;

function toCell(v: unknown): VizCell | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") return v.slice(0, 12);
  return null;
}

function cleanCells(v: unknown): VizCell[] {
  if (!Array.isArray(v)) return [];
  return v.map(toCell).filter((c): c is VizCell => c !== null).slice(0, MAX_ARRAY);
}

/**
 * Validate and clamp raw (AI-produced) JSON into a safe {@link VizResult}.
 * Returns `null` if the input can't be salvaged into a usable visualization.
 */
export function normalizeVisualization(raw: unknown): VizResult | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  if (obj.kind === "unsupported") {
    return { kind: "unsupported", reason: typeof obj.reason === "string" ? obj.reason.slice(0, 200) : "Not visualizable." };
  }

  const input = cleanCells(obj.input);
  const width = input.length;
  if (width === 0) return null;

  const rawSteps = Array.isArray(obj.steps) ? obj.steps : [];
  const steps: VizStep[] = [];
  for (const s of rawSteps.slice(0, MAX_STEPS)) {
    if (!s || typeof s !== "object") continue;
    const so = s as Record<string, unknown>;
    // Fall back to the input array length when a step omits/mismatches values.
    let array = cleanCells(so.array);
    if (array.length !== width) array = array.length ? array.slice(0, width) : input.slice();
    while (array.length < width) array.push(input[array.length]);

    const highlight = (Array.isArray(so.highlight) ? so.highlight : [])
      .map((n) => (typeof n === "number" ? Math.trunc(n) : NaN))
      .filter((n) => Number.isInteger(n) && n >= 0 && n < width)
      .slice(0, width);

    const pointers = (Array.isArray(so.pointers) ? so.pointers : [])
      .map((p) => {
        const po = (p ?? {}) as Record<string, unknown>;
        const index = typeof po.index === "number" ? Math.trunc(po.index) : NaN;
        const label = typeof po.label === "string" ? po.label.slice(0, 4) : "";
        return { label, index };
      })
      .filter((p) => p.label && Number.isInteger(p.index) && p.index >= 0 && p.index < width)
      .slice(0, MAX_POINTERS);

    steps.push({
      array,
      highlight,
      pointers,
      note: typeof so.note === "string" ? so.note.slice(0, 160) : "",
    });
  }

  if (steps.length === 0) return null;
  return {
    kind: "array",
    title: typeof obj.title === "string" ? obj.title.slice(0, 120) : "Walkthrough",
    input,
    steps,
  };
}
