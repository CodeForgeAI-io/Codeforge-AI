import { z } from "zod";
import { DIFFICULTIES, FRONTEND_TECHS } from "@/lib/constants";

export const challengeInputSchema = z.object({
  title: z.string().min(3).max(150),
  difficulty: z.enum(DIFFICULTIES),
  tech: z.enum(FRONTEND_TECHS),
  tags: z.array(z.string().max(40)).max(15).default([]),
  brief: z.string().min(10).max(300),
  description: z.string().min(10).max(50_000),
  designSpec: z.string().min(10).max(20_000),
  starterFiles: z.record(z.string().max(120), z.string().max(32_000)),
  checklist: z.array(z.string().max(300)).max(20).default([]),
  isPublished: z.boolean().default(false),
});

export const challengeSubmitSchema = z.object({
  challengeId: z.string().length(24),
  files: z
    .record(z.string().max(120), z.string().max(64_000))
    .refine((files) => Object.keys(files).length > 0, "No files submitted")
    .refine(
      (files) => Object.keys(files).length <= 20,
      "Too many files submitted",
    ),
  /** checklist item indexes the user marked complete */
  checkedItems: z.array(z.number().int().min(0)).max(50).default([]),
});

export type ChallengeInput = z.infer<typeof challengeInputSchema>;
export type ChallengeSubmitInput = z.infer<typeof challengeSubmitSchema>;
