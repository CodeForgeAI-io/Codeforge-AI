import { z } from "zod";
import {
  DIFFICULTIES,
  LANGUAGE_IDS,
  QUESTION_CATEGORIES,
} from "@/lib/constants";

export const testCaseSchema = z.object({
  input: z.string().max(16_000),
  expected: z.string().max(16_000),
  hidden: z.boolean().default(false),
});

export const exampleSchema = z.object({
  input: z.string().max(4_000),
  output: z.string().max(4_000),
  explanation: z.string().max(4_000).optional(),
});

/**
 * Canonical question shape used by the admin editor, the JSON importer and
 * the AI generator. JSON imports also accept `testCases[].expected` named
 * `output` for convenience (normalized before validation).
 */
export const questionInputSchema = z.object({
  title: z.string().min(3).max(150),
  difficulty: z.enum(DIFFICULTIES),
  category: z.string().min(2).max(60),
  tags: z.array(z.string().max(40)).max(15).default([]),
  companies: z.array(z.string().max(60)).max(20).default([]),
  description: z.string().min(10).max(50_000),
  examples: z.array(exampleSchema).max(10).default([]),
  constraints: z.array(z.string().max(500)).max(20).default([]),
  // partialRecord: any subset of supported languages may provide starter code
  starterCode: z.partialRecord(z.enum(LANGUAGE_IDS), z.string().max(16_000)),
  testCases: z.array(testCaseSchema).min(1).max(50),
  solution: z.string().max(50_000).optional(),
  editorial: z.string().max(50_000).optional(),
  hints: z.array(z.string().max(2_000)).max(10).default([]),
  isPublished: z.boolean().default(false),
});

export const questionImportSchema = z.union([
  questionInputSchema,
  z.array(questionInputSchema).min(1).max(100),
]);

/**
 * Convenience normalization for JSON imports: accepts `testCases[].expected`
 * written as `output`. Run before validating with questionImportSchema.
 */
export function normalizeQuestionImport(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(normalizeQuestionImport);
  if (input && typeof input === "object") {
    const obj = { ...(input as Record<string, unknown>) };
    if (Array.isArray(obj.testCases)) {
      obj.testCases = obj.testCases.map((testCase) => {
        if (testCase && typeof testCase === "object") {
          const tc = { ...(testCase as Record<string, unknown>) };
          if (tc.expected === undefined && tc.output !== undefined) {
            tc.expected = tc.output;
            delete tc.output;
          }
          return tc;
        }
        return testCase;
      });
    }
    return obj;
  }
  return input;
}

export const questionFilterSchema = z.object({
  q: z.string().max(120).optional(),
  difficulty: z.enum(DIFFICULTIES).optional(),
  category: z.string().max(60).optional(),
  company: z.string().max(60).optional(),
  tag: z.string().max(40).optional(),
  status: z.enum(["solved", "attempted", "todo"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const aiGenerateRequestSchema = z.object({
  prompt: z.string().min(10).max(1_000),
  count: z.coerce.number().int().min(1).max(10).default(5),
});

export type QuestionInput = z.infer<typeof questionInputSchema>;
export type QuestionFilter = z.infer<typeof questionFilterSchema>;

export const QUESTION_CATEGORY_LIST = [...QUESTION_CATEGORIES];
