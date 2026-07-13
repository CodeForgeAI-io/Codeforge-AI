"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  isUsernameTaken,
  updateUserProfile,
  updateUserPreferences,
  updateUserMedia,
  setEmailOptOut,
} from "@/services/user-store";
import {
  profileUpdateSchema,
  preferencesUpdateSchema,
  type ProfileUpdateInput,
  type PreferencesUpdateInput,
} from "@/schemas/profile";

interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function updateProfile(
  input: ProfileUpdateInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated" };

  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (await isUsernameTaken(parsed.data.username, session.user.id)) {
    return { ok: false, error: "This username is already taken" };
  }

  await updateUserProfile(session.user.id, {
    name: parsed.data.name,
    username: parsed.data.username,
    bio: parsed.data.bio ?? "",
    location: parsed.data.location ?? "",
    website: parsed.data.website ?? "",
    githubUrl: parsed.data.githubUrl ?? "",
    linkedinUrl: parsed.data.linkedinUrl ?? "",
    image: parsed.data.image === undefined ? undefined : parsed.data.image || null,
    coverImage: parsed.data.coverImage === undefined ? undefined : parsed.data.coverImage || null,
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath(`/profile/${parsed.data.username.toLowerCase()}`);
  return { ok: true };
}

export async function updatePreferences(
  input: PreferencesUpdateInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated" };

  const parsed = preferencesUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await updateUserPreferences(session.user.id, parsed.data);
  revalidatePath("/settings");
  return { ok: true };
}

function validImageUrl(v: string | null): boolean {
  return v === null || (v.length <= 600 && /^https?:\/\/.+/.test(v));
}

/** Immediately persist a new avatar and/or cover photo (auto-save on upload). */
export async function updateProfileMedia(patch: {
  image?: string | null;
  coverImage?: string | null;
}): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated" };

  if (patch.image !== undefined && !validImageUrl(patch.image)) {
    return { ok: false, error: "Invalid image URL" };
  }
  if (patch.coverImage !== undefined && !validImageUrl(patch.coverImage)) {
    return { ok: false, error: "Invalid image URL" };
  }

  await updateUserMedia(session.user.id, patch);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  if (session.user.username) revalidatePath(`/profile/${session.user.username}`);
  return { ok: true };
}

export async function updateEmailOptOut(optOut: boolean): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated" };

  await setEmailOptOut(session.user.id, optOut);
  revalidatePath("/settings");
  return { ok: true };
}
