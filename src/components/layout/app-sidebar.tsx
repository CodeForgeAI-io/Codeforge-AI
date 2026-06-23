"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShieldCheck, Settings, Crown, Ellipsis } from "@/components/icons";
import { PlanBadge } from "@/features/subscription/plan-badge";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/logo";
import { NAV_ITEMS, MOBILE_NAV_ITEMS, MOBILE_MORE_ITEMS } from "./nav-items";

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const plan = session?.user?.plan ?? "free";

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
      <div className="border-t p-2 space-y-0.5">
        {/* Plan badge + upgrade prompt */}
        <Link
          href="/settings"
          className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-sidebar-accent/60 transition-colors"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {plan === "plus" ? <Crown className="size-3.5 text-primary" /> : <Settings className="size-3.5" />}
            <span>Account</span>
          </div>
          <PlanBadge plan={plan} size="xs" />
        </Link>
        {plan === "free" && (
          <Link
            href="/pricing"
            className="flex items-center gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
          >
            <Crown className="size-3.5" /> Upgrade plan
          </Link>
        )}
        {isAdmin && (
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
        )}
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  // Close the "More" sheet whenever the route changes.
  useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const moreActive = MOBILE_MORE_ITEMS.some((item) => isActive(item.href));

  const tabClass = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
      active ? "text-primary" : "text-muted-foreground",
    );
  const pillClass = (active: boolean) =>
    cn(
      "flex h-6 w-12 items-center justify-center rounded-full transition-colors",
      active && "bg-primary/10",
    );

  return (
    <>
      {/* Backdrop for the More sheet */}
      {moreOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setMoreOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-stretch justify-around border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
        {/* More sheet — anchored just above the bar, regardless of bar height */}
        <div
          className={cn(
            "absolute inset-x-3 bottom-full z-50 mb-2 overflow-hidden rounded-2xl border bg-popover shadow-lg transition duration-200",
            moreOpen
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0",
          )}
        >
          <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            More
          </p>
          <div className="grid grid-cols-2 gap-1 p-2 pt-1">
            {MOBILE_MORE_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-3 text-sm transition-colors",
                    active
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/60",
                  )}
                >
                  <item.icon className="size-4.5" />
                  {item.title}
                </Link>
              );
            })}
          </div>
        </div>

        {MOBILE_NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} className={tabClass(active)}>
              <span className={pillClass(active)}>
                <item.icon className="size-4.5" />
              </span>
              {item.title}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMoreOpen((open) => !open)}
          aria-expanded={moreOpen}
          aria-label="More"
          className={tabClass(moreActive || moreOpen)}
        >
          <span className={pillClass(moreActive || moreOpen)}>
            <Ellipsis className="size-4.5" />
          </span>
          More
        </button>
      </nav>
    </>
  );
}
