import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import {
  EditorSettingsForm,
  ProfileSettingsForm,
} from "@/features/settings/settings-forms";
import { SettingsView } from "@/features/settings/settings-view";
import { BillingPanel } from "@/features/subscription/billing-panel";
import { UsagePanel } from "@/features/subscription/usage-panel";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user) redirect("/login");

  const plan = user.plan ?? "free";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <SettingsView
        profile={
          <ProfileSettingsForm
            defaults={{
              name: user.name,
              username: user.username,
              bio: user.bio ?? "",
              location: user.location ?? "",
              website: user.website ?? "",
              githubUrl: user.githubUrl ?? "",
              linkedinUrl: user.linkedinUrl ?? "",
            }}
          />
        }
        preferences={
          <EditorSettingsForm
            defaults={{
              editorFontSize: user.preferences.editorFontSize,
              editorTheme: user.preferences.editorTheme,
              vimMode: user.preferences.vimMode,
              defaultLanguage: user.preferences.defaultLanguage,
            }}
          />
        }
        billing={
          <>
            <UsagePanel plan={plan} />
            <BillingPanel
              paymentsEnabled={!!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)}
              billing={{
                plan,
                planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
                trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
                billingCycle: user.billingCycle ?? null,
              }}
            />
          </>
        }
      />
    </div>
  );
}
