"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { ShieldCheck, Settings, Crown, ChevronDown } from "@/components/icons";
import { PlanBadge } from "@/features/subscription/plan-badge";
import { cn } from "@/lib/utils";
import { NAV_ITEMS, AI_TOOLS, type NavItem } from "./nav-items";

const ROW = "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors";
const ACTIVE = "bg-sidebar-accent font-medium text-sidebar-accent-foreground";
const IDLE =
  "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground";

/** Shared sidebar nav — used by the desktop sidebar and the mobile drawer. */
export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const plan = session?.user?.plan ?? "free";
  const onAiTools = pathname.startsWith("/ai-tools");
  const [aiOpen, setAiOpen] = useState(onAiTools);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const groups: Record<string, NavItem[]> = {};
  for (const item of NAV_ITEMS) {
    const g = item.group ?? "Main";
    (groups[g] ??= []).push(item);
  }

  return (
    <>
      <nav className="flex-1 overflow-y-auto p-2">
        {Object.entries(groups).map(([group, items], gi) => (
          <div key={group} className={gi > 0 ? "mt-3" : ""}>
            {gi > 0 && (
              <p className="mb-0.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group}
              </p>
            )}
            <div className="space-y-0.5">
              {items.map((item) =>
                item.href === "/ai-tools" ? (
                  <div key={item.href}>
                    <button
                      type="button"
                      onClick={() => setAiOpen((o) => !o)}
                      aria-expanded={aiOpen}
                      className={cn(ROW, "w-full", onAiTools ? ACTIVE : IDLE)}
                    >
                      <item.icon className="size-4" />
                      <span className="flex-1 text-left">{item.title}</span>
                      <ChevronDown
                        className={cn(
                          "size-4 shrink-0 transition-transform",
                          aiOpen && "rotate-180",
                        )}
                      />
                    </button>
                    {aiOpen && (
                      <div className="mt-0.5 ml-[18px] space-y-0.5 border-l pl-3">
                        {AI_TOOLS.map((tool) => (
                          <Link
                            key={tool.tool}
                            href={`/ai-tools?tool=${tool.tool}`}
                            onClick={onNavigate}
                            className="block rounded-md px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
                          >
                            {tool.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(ROW, isActive(item.href) ? ACTIVE : IDLE)}
                  >
                    <item.icon className="size-4" />
                    {item.title}
                  </Link>
                ),
              )}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-0.5 border-t p-2">
        <Link
          href="/settings"
          onClick={onNavigate}
          className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent/60"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {plan === "plus" ? (
              <Crown className="size-3.5 text-primary" />
            ) : (
              <Settings className="size-3.5" />
            )}
            <span>Account</span>
          </div>
          <PlanBadge plan={plan} size="xs" />
        </Link>
        {plan === "free" && (
          <Link
            href="/pricing"
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
          >
            <Crown className="size-3.5" /> Upgrade plan
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin"
            onClick={onNavigate}
            className={cn(ROW, pathname.startsWith("/admin") ? ACTIVE : IDLE)}
          >
            <ShieldCheck className="size-4" /> Admin Panel
          </Link>
        )}
      </div>
    </>
  );
}
