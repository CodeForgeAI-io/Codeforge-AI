import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { User, Follow } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";

const be = () => backendFor("account");

/** Whether the user finished onboarding (platform layout + onboarding gate). */
export async function getOnboardingComplete(userId: string): Promise<boolean> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("users")
      .select("onboarding")
      .eq("id", userId)
      .maybeSingle();
    return Boolean((data as { onboarding?: { completed?: boolean } } | null)?.onboarding?.completed);
  }
  await connectDB();
  const u = await User.findById(userId).select("onboarding").lean();
  return Boolean(u?.onboarding?.completed);
}

/** Onboarding completion + display name (onboarding page). */
export async function getOnboardingWithName(
  userId: string,
): Promise<{ completed: boolean; name: string } | null> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("users")
      .select("onboarding,name")
      .eq("id", userId)
      .maybeSingle();
    if (!data) return null;
    const u = data as { onboarding?: { completed?: boolean }; name: string };
    return { completed: Boolean(u.onboarding?.completed), name: u.name };
  }
  await connectDB();
  const u = await User.findById(userId).select("onboarding name").lean();
  if (!u) return null;
  return { completed: Boolean(u.onboarding?.completed), name: u.name };
}

/** The user's current plan (pricing page). */
export async function getUserPlan(userId: string): Promise<string> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("users")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();
    return (data as { plan?: string } | null)?.plan ?? "free";
  }
  await connectDB();
  const u = await User.findById(userId).select("plan").lean();
  return u?.plan ?? "free";
}

export interface EditorPreferences {
  editorFontSize: number;
  editorTheme: string;
  vimMode: boolean;
  defaultLanguage: string;
}
const DEFAULT_PREFS: EditorPreferences = {
  editorFontSize: 14,
  editorTheme: "vs-dark",
  vimMode: false,
  defaultLanguage: "javascript",
};

export interface SettingsProfile {
  name: string;
  username: string;
  bio: string;
  location: string;
  website: string;
  githubUrl: string;
  linkedinUrl: string;
  preferences: EditorPreferences;
  plan: string;
  planExpiresAt: Date | null;
  trialEndsAt: Date | null;
  billingCycle: string | null;
}

/** Full profile for the settings page. */
export async function getUserSettings(userId: string): Promise<SettingsProfile | null> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("users")
      .select("name,username,bio,location,website,github_url,linkedin_url,preferences,plan,plan_expires_at,trial_ends_at,billing_cycle")
      .eq("id", userId)
      .maybeSingle();
    if (!data) return null;
    const u = data as {
      name: string; username: string; bio: string | null; location: string | null;
      website: string | null; github_url: string | null; linkedin_url: string | null;
      preferences: Partial<EditorPreferences> | null; plan: string;
      plan_expires_at: string | null; trial_ends_at: string | null; billing_cycle: string | null;
    };
    return {
      name: u.name, username: u.username, bio: u.bio ?? "", location: u.location ?? "",
      website: u.website ?? "", githubUrl: u.github_url ?? "", linkedinUrl: u.linkedin_url ?? "",
      preferences: { ...DEFAULT_PREFS, ...(u.preferences ?? {}) },
      plan: u.plan ?? "free",
      planExpiresAt: u.plan_expires_at ? new Date(u.plan_expires_at) : null,
      trialEndsAt: u.trial_ends_at ? new Date(u.trial_ends_at) : null,
      billingCycle: u.billing_cycle,
    };
  }
  await connectDB();
  const u = await User.findById(userId).lean();
  if (!u) return null;
  return {
    name: u.name, username: u.username, bio: u.bio ?? "", location: u.location ?? "",
    website: u.website ?? "", githubUrl: u.githubUrl ?? "", linkedinUrl: u.linkedinUrl ?? "",
    preferences: { ...DEFAULT_PREFS, ...(u.preferences ?? {}) },
    plan: u.plan ?? "free",
    planExpiresAt: u.planExpiresAt ?? null,
    trialEndsAt: u.trialEndsAt ?? null,
    billingCycle: u.billingCycle ?? null,
  };
}

export interface CheckoutProfile {
  name: string;
  email: string;
  billing: Record<string, string> | null;
  trialEndsAt: Date | null;
}

/** Name/email/billing/trial for the checkout page prefill. */
export async function getUserCheckout(userId: string): Promise<CheckoutProfile | null> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("users")
      .select("name,email,billing,trial_ends_at")
      .eq("id", userId)
      .maybeSingle();
    if (!data) return null;
    const u = data as { name: string; email: string | null; billing: Record<string, string> | null; trial_ends_at: string | null };
    return { name: u.name, email: u.email ?? "", billing: u.billing, trialEndsAt: u.trial_ends_at ? new Date(u.trial_ends_at) : null };
  }
  await connectDB();
  const u = await User.findById(userId).select("name email billing trialEndsAt").lean();
  if (!u) return null;
  return { name: u.name, email: u.email ?? "", billing: (u.billing as Record<string, string>) ?? null, trialEndsAt: u.trialEndsAt ?? null };
}

/** Resolve a username to its user id (public profile). */
export async function resolveUserIdByUsername(username: string): Promise<string | null> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    return (data as { id: string } | null)?.id ?? null;
  }
  await connectDB();
  const u = await User.findOne({ username }).select("_id").lean();
  return u?._id.toString() ?? null;
}

/** Count non-banned members (community stats). */
export async function countActiveMembers(): Promise<number> {
  if (be() === "supabase") {
    const { count } = await supabaseAdmin()
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("banned", false);
    return count ?? 0;
  }
  await connectDB();
  return User.countDocuments({ banned: false });
}

/** Whether followerId already follows followingId. */
export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  if (be() === "supabase") {
    const { data } = await supabaseAdmin()
      .from("follows")
      .select("id")
      .eq("follower_id", followerId)
      .eq("following_id", followingId)
      .maybeSingle();
    return Boolean(data);
  }
  await connectDB();
  return Boolean(await Follow.exists({ follower: followerId, following: followingId }));
}
