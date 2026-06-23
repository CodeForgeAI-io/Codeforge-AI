import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "@/components/icons";
import { auth } from "@/lib/auth";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { AdminSidebar, AdminMobileNav } from "@/features/admin/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background px-4">
        <Logo href="/admin" />
        <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          Admin
        </span>
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Back to app</span>
            </Link>
          </Button>
        </div>
      </header>
      <div className="flex">
        <AdminSidebar />
        <main className="min-w-0 flex-1 px-4 py-5">
          <AdminMobileNav />
          <div className="mx-auto mt-4 max-w-5xl md:mt-0">{children}</div>
        </main>
      </div>
    </div>
  );
}
