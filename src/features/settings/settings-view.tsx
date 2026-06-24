"use client";

import { useState, type ReactNode } from "react";
import { User, Settings2, CreditCard, Settings } from "@/components/icons";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: User, desc: "Your public profile and links" },
  { id: "preferences", label: "Preferences", icon: Settings2, desc: "Editor and workspace defaults" },
  { id: "billing", label: "Billing & Usage", icon: CreditCard, desc: "Plan, AI credits and invoices" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export function SettingsView({
  profile,
  preferences,
  billing,
}: {
  profile: ReactNode;
  preferences: ReactNode;
  billing: ReactNode;
}) {
  const [active, setActive] = useState<SectionId>("profile");
  const nodes: Record<SectionId, ReactNode> = { profile, preferences, billing };
  const current = SECTIONS.find((s) => s.id === active)!;

  return (
    <div className="grid gap-6 md:grid-cols-[224px_1fr] md:gap-10">
      {/* Sidebar menu */}
      <aside className="md:sticky md:top-20 md:self-start">
        <div className="mb-4 flex items-center gap-2 px-1">
          <Settings className="size-4 text-muted-foreground" />
          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:gap-0.5 md:overflow-visible md:pb-0">
          {SECTIONS.map((s) => {
            const on = active === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors md:w-full",
                  on
                    ? "bg-accent font-medium text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <s.icon className="size-4 shrink-0" />
                {s.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="min-w-0">
        <div className="mb-5 hidden md:block">
          <h2 className="text-xl font-semibold tracking-tight">{current.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{current.desc}</p>
        </div>
        {(Object.keys(nodes) as SectionId[]).map((id) => (
          <div key={id} className={cn("space-y-4", id !== active && "hidden")}>
            {nodes[id]}
          </div>
        ))}
      </div>
    </div>
  );
}
