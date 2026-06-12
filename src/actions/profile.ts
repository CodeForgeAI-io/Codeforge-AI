"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
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
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  await connectDB();

  const usernameTaken = await User.exists({
    username: parsed.data.username.toLowerCase(),
    _id: { $ne: session.user.id },
  });
  if (usernameTaken) {
    return { ok: false, error: "This username is already taken" };
  }

  await User.updateOne(
    { _id: session.user.id },
    {
      $set: {
        name: parsed.data.name,
        username: parsed.data.username.toLowerCase(),
        bio: parsed.data.bio ?? "",
        location: parsed.data.location ?? "",
        website: parsed.data.website ?? "",
        githubUrl: parsed.data.githubUrl ?? "",
        linkedinUrl: parsed.data.linkedinUrl ?? "",
      },
    },
  );

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updatePreferences(
  input: PreferencesUpdateInput,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Not authenticated" };

  const parsed = preferencesUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  await connectDB();
  await User.updateOne(
    { _id: session.user.id },
    { $set: { preferences: parsed.data } },
  );

  revalidatePath("/settings");
  return { ok: true };
}
