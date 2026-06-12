import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import {
  EditorSettingsForm,
  ProfileSettingsForm,
} from "@/features/settings/settings-forms";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await connectDB();
  const user = await User.findById(session.user.id).lean();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your profile and workspace preferences.
        </p>
      </div>
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
      <EditorSettingsForm
        defaults={{
          editorFontSize: user.preferences.editorFontSize,
          editorTheme: user.preferences.editorTheme,
          vimMode: user.preferences.vimMode,
          defaultLanguage: user.preferences.defaultLanguage,
        }}
      />
    </div>
  );
}
