import { z } from "zod";
import { CONTEST_TYPES } from "@/lib/constants";

export const contestInputSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().max(5_000).default(""),
  type: z.enum(CONTEST_TYPES).default("custom"),
  startsAt: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(5).max(600),
  questions: z
    .array(
      z.object({
        questionId: z.string().length(24),
        points: z.coerce.number().int().min(10).max(1000).default(100),
      }),
    )
    .min(1)
    .max(10),
  isPublished: z.boolean().default(false),
});

export type ContestInput = z.infer<typeof contestInputSchema>;
