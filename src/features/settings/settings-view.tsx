"use client";

import { useState, type ReactNode } from "react";
import { Settings } from "@/components/icons";
import { cn } from "@/lib/utils";

export interface SettingsSection {
  id: string;
  label: string;
  /** A pre-rendered icon element — passing a bare component function across the
   *  server→client boundary is not allowed, so the page renders it first. */
  icon: ReactNode;
  desc: string;
  node: ReactNode;
}

export function SettingsView({ sections }: { sections: SettingsSection[] }) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? "");
  const current = sections.find((s) => s.id === active) ?? sections[0];

  return (
    <div className="grid gap-6 md:grid-cols-[224px_1fr] md:gap-10">
      {/* Sidebar menu */}
      <aside className="md:sticky md:top-20 md:self-start">
        <div className="mb-4 flex items-center gap-2 px-1">
          <Settings className="size-4 text-muted-foreground" />
          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
        </div>
        <nav className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:gap-0.5 md:overflow-visible md:pb-0">
          {sections.map((s) => {
            const on = active === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActive(s.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors md:w-full",
                  on
                    ? "bg-[#006bff]/8 font-medium text-foreground ring-1 ring-inset ring-[#006bff]/15"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <span className={cn("flex shrink-0", on && "text-[#006bff]")}>{s.icon}</span>
                {s.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="min-w-0">
        <div className="mb-5 hidden md:block">
          <h2 className="text-xl font-semibold tracking-tight">{current?.label}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{current?.desc}</p>
        </div>
        {sections.map((s) => (
          <div key={s.id} className={cn("space-y-4", s.id !== active && "hidden")}>
            {s.node}
          </div>
        ))}
      </div>
    </div>
  );
}
