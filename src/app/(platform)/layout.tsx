import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppSidebar, MobileBottomNav } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function PlatformLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="flex min-h-svh">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
