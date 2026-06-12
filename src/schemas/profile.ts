import { z } from "zod";
import { LANGUAGE_IDS } from "@/lib/constants";
import { usernameSchema } from "./auth";

const optionalUrl = z
  .string()
  .max(200)
  .refine(
    (v) => v === "" || /^https?:\/\/.+/.test(v),
    "Must be a valid http(s) URL",
  )
  .optional();

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(80),
  username: usernameSchema,
  bio: z.string().max(300).optional(),
  location: z.string().max(100).optional(),
  website: optionalUrl,
  githubUrl: optionalUrl,
  linkedinUrl: optionalUrl,
});

export const preferencesUpdateSchema = z.object({
  editorFontSize: z.coerce.number().int().min(10).max(28),
  editorTheme: z.enum(["vs-dark", "light"]),
  vimMode: z.boolean(),
  defaultLanguage: z.enum(LANGUAGE_IDS),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type PreferencesUpdateInput = z.infer<typeof preferencesUpdateSchema>;
