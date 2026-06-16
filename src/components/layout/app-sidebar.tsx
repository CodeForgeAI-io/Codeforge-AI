"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { NAV_ITEMS, MOBILE_NAV_ITEMS } from "./nav-items";

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  return (
    <aside className="sticky top-0 hidden h-svh w-56 shrink-0 flex-col border-r bg-sidebar md:flex">
      <div className="flex h-14 items-center border-b px-4">
        <Logo href="/dashboard" />
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {(() => {
          const groups: Record<string, typeof NAV_ITEMS> = {};
          for (const item of NAV_ITEMS) {
            const g = item.group ?? "Main";
            if (!groups[g]) groups[g] = [];
            groups[g].push(item);
          }
          return Object.entries(groups).map(([group, items], gi) => (
            <div key={group} className={gi > 0 ? "mt-3" : ""}>
              {gi > 0 && (
                <p className="mb-0.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {group}
                </p>
              )}
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                      )}
                    >
                      <item.icon className="size-4" />
                      {item.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          ));
        })()}
      </nav>
      {isAdmin && (
        <div className="border-t p-2">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname.startsWith("/admin")
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
            )}
          >
            <ShieldCheck className="size-4" />
            Admin Panel
          </Link>
        </div>
      )}
    </aside>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      {MOBILE_NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
              active ? "text-primary" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-12 items-center justify-center rounded-full transition-colors",
                active && "bg-primary/10",
              )}
            >
              <item.icon className="size-4.5" />
            </span>
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
