import { z } from "zod";
import { EXECUTION_LIMITS, LANGUAGE_IDS } from "@/lib/constants";

export const runRequestSchema = z.object({
  questionId: z.string().length(24),
  language: z.enum(LANGUAGE_IDS),
  code: z.string().min(1).max(EXECUTION_LIMITS.maxCodeLength),
  /** When provided, runs only this custom input instead of sample tests */
  customInput: z
    .string()
    .max(EXECUTION_LIMITS.maxStdinLength)
    .optional(),
});

export const submitRequestSchema = z.object({
  questionId: z.string().length(24),
  language: z.enum(LANGUAGE_IDS),
  code: z.string().min(1).max(EXECUTION_LIMITS.maxCodeLength),
  contestSlug: z.string().max(120).optional(),
});

export type RunRequest = z.infer<typeof runRequestSchema>;
export type SubmitRequest = z.infer<typeof submitRequestSchema>;
