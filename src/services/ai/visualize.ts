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

Return ONLY JSON with this shape:
{
  "feedback": "2-4 short sentences. If PASSED: explain the approach the code takes and why it is correct. If FAILED: pinpoint the bug — which step/line/condition is wrong and why the output differs from expected.",
  "visualization": {
    "kind": "array",
    "title": "short label of what is being traced",
    "input": [/* the primary array/list from the input, numbers or short strings, max ${MAX_ARRAY} items */],
    "steps": [
      {
        "array": [/* array state at this step, same length as input */],
        "highlight": [/* indices being compared/changed */],
        "pointers": [{ "label": "i", "index": 0 }],
        "note": "one short sentence describing this step"
      }
    ]
  }
}

Rules:
- Trace the ACTUAL behavior of the given code, including its bug if it fails; on the failing step, set "note" to what goes wrong and highlight the offending index.
- Max ${MAX_STEPS} steps. Keep arrays <= ${MAX_ARRAY} items. No prose outside JSON.
- If the problem has no array/list to animate, return {"feedback":"...","visualization":{"kind":"unsupported","reason":"..."}}.`,
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
