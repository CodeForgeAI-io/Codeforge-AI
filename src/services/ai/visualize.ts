import { complete } from "@/services/ai/groq";
import {
  normalizeVisualization,
  MAX_STEPS,
  MAX_ARRAY,
  type VizResult,
} from "@/lib/visualization";

export interface RunContext {
  title: string;
  description: string;
  code: string;
  language: string;
  /** The test case the visualization is built around. */
  input: string;
  expected: string | null;
  actual: string;
  passed: boolean;
}

export interface GeneratedRunViz {
  feedback: string;
  visualization: VizResult;
}

const SYSTEM = `You are an algorithm-visualization engine for a coding-practice site.
Given a problem, a user's solution code, and one test case, you:
1) Trace how THAT code processes the test input, as a sequence of array frames.
2) Explain what the code does right, or — if it fails — exactly what is wrong.
You never invent a "correct" trace: you visualize what the given code actually does.`;

/**
 * Produce animation frames + feedback for a single run of the user's code on a
 * test case. `verdict` is decided by the caller from the real run; here we only
 * generate the steps and the explanation.
 */
export async function generateRunVisualization(ctx: RunContext): Promise<GeneratedRunViz> {
  const raw = await complete(
    [
      { role: "system", content: SYSTEM },
      {
        role: "user",
        content: `PROBLEM: ${ctx.title}
${ctx.description.slice(0, 1200)}

USER CODE (${ctx.language}):
\`\`\`
${ctx.code.slice(0, 4000)}
\`\`\`

TEST CASE:
- input: ${ctx.input.slice(0, 400)}
- expected: ${(ctx.expected ?? "").slice(0, 400)}
- actual output from the code: ${ctx.actual.slice(0, 400)}
- result: ${ctx.passed ? "PASSED" : "FAILED"}

Return ONLY JSON: { "feedback": "...", "visualization": { ... } }.

"feedback": 2-4 short sentences. If PASSED, explain the approach and why it's correct. If FAILED, pinpoint the bug — which step/line/condition is wrong and why the output differs.

Pick the "visualization" shape that best fits the data structure the code works with. Every cell/node may carry a "state": one of "default", "active" (current), "compare" (being compared), "swap" (being moved), "visited", "done". Prefer states over bare highlights.

array (lists, two-pointer, sorting, sliding window):
{ "kind":"array", "title":"...", "input":[nums, max ${MAX_ARRAY}], "steps":[ { "array":[same length], "states":["default"|...], "pointers":[{"label":"i","index":0}], "note":"..." } ] }

grid (matrix, DP tables, islands, pathfinding):
{ "kind":"grid", "title":"...", "steps":[ { "grid":[[...],[...]], "states":[[...],[...]], "note":"..." } ] }   // grid <= ${12}x${12}

linkedlist:
{ "kind":"linkedlist", "title":"...", "steps":[ { "values":[...], "states":[...], "pointers":[{"label":"slow","index":0}], "note":"..." } ] }

graph / tree (BFS, DFS, trees — use "layout":"tree" for trees, "circle" otherwise):
{ "kind":"graph", "title":"...", "layout":"tree"|"circle", "directed":true|false, "nodes":[{"id":"1","label":"1"}], "edges":[{"from":"1","to":"2"}], "steps":[ { "states":{"1":"visited","2":"active"}, "activeEdges":[["1","2"]], "note":"..." } ] }

Rules:
- Trace the ACTUAL behaviour of the given code, including its bug when it fails; on the failing step, mark the offending cell/node and say what goes wrong in "note".
- Max ${MAX_STEPS} steps. Node ids are strings. No prose outside JSON.
- If nothing maps to these structures, return {"feedback":"...","visualization":{"kind":"unsupported","reason":"..."}}.`,
      },
    ],
    { json: true, temperature: 0.4, maxTokens: 2600 },
  );

  let parsed: { feedback?: unknown; visualization?: unknown };
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The AI returned an unexpected format. Try again.");
  }

  const viz = normalizeVisualization(parsed.visualization);
  const feedback =
    typeof parsed.feedback === "string" && parsed.feedback.trim()
      ? parsed.feedback.trim().slice(0, 600)
      : ctx.passed
        ? "Your solution passed this test."
        : "Your output didn't match the expected result.";

  return {
    feedback,
    visualization: viz ?? { kind: "unsupported", reason: "This problem isn't array-based, so there's nothing to animate." },
  };
}
