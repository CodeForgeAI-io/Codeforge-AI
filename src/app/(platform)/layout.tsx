import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models";
import { AppSidebar, MobileBottomNav } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await getSession();
  if (!session?.user) redirect("/login");

  // Onboarding gate: verify with DB so stale JWTs don't cause redirect loops.
  // JWT onboardingComplete can be false/undefined even after completing onboarding
  // if the JWT was never refreshed (e.g. long-lived session). Always trust DB here.
  if (!session.user.onboardingComplete) {
    await connectDB();
    const dbUser = await User.findById(session.user.id)
      .select("onboarding")
      .lean();
    if (!dbUser?.onboarding?.completed) {
      redirect("/onboarding");
    }
    // DB says complete — stale JWT, let them through
  }

  return (
    <div className="flex min-h-svh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 pb-20 md:pb-0">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
