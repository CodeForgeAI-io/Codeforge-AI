"use client";

import { useMemo, useState } from "react";
import { APP_NAME } from "@/lib/constants";
import { Sparkles, TrendingUp, Check } from "@/components/icons";
import { cn } from "@/lib/utils";

const ACCENT = "#006bff";

const CATEGORIES = [
  { key: "new", label: "New", icon: Sparkles, color: ACCENT },
  { key: "improved", label: "Improved", icon: TrendingUp, color: "#d97706" },
  { key: "fixed", label: "Fixed", icon: Check, color: "#059669" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

export interface Release {
  version: string;
  date: string;
  tag: string;
  tagColor: string;
  changes: Record<CategoryKey, string[]>;
}

type Filter = "all" | CategoryKey;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  ...CATEGORIES.map((c) => ({ key: c.key, label: c.label })),
];

function slug(version: string) {
  return `v${version.replace(/\./g, "-")}`;
}

export function ChangelogView({ releases }: { releases: Release[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const visible = useMemo(() => {
    if (filter === "all") return releases;
    return releases.filter((r) => r.changes[filter]?.length);
  }, [filter, releases]);

  return (
    <>
      {/* header */}
      <div className="mb-8">
        <span
          className="inline-flex items-center gap-1.5 text-[13px] font-medium tracking-tight"
          style={{ color: ACCENT }}
        >
          <span className="size-1.5 rounded-full" style={{ background: ACCENT }} />
          Changelog
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
          What&rsquo;s new in {APP_NAME}
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Every release, every fix, every improvement — documented here.
        </p>
      </div>

      {/* category filter */}
      <div className="mb-8 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                on
                  ? "border-transparent bg-foreground text-background"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="lg:grid lg:grid-cols-[140px_1fr] lg:gap-10">
        {/* version jump rail */}
        <nav className="mb-6 lg:mb-0 lg:sticky lg:top-20 lg:self-start">
          <p className="mb-2 hidden text-[11px] font-semibold uppercase tracking-wider text-muted-foreground lg:block">
            Versions
          </p>
          <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0">
            {releases.map((r) => (
              <li key={r.version} className="shrink-0">
                <a
                  href={`#${slug(r.version)}`}
                  className="block rounded-md px-2.5 py-1.5 font-mono text-xs tabular-nums text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  v{r.version}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* releases */}
        <div className="min-w-0 space-y-5">
          {visible.map((release) => (
            <article
              key={release.version}
              id={slug(release.version)}
              className="scroll-mt-24 rounded-2xl border bg-card p-6 shadow-sm sm:p-7"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="font-mono text-lg font-semibold tabular-nums tracking-tight">
                  v{release.version}
                </h2>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${release.tagColor}`}
                >
                  {release.tag}
                </span>
                <span className="ml-auto text-xs text-muted-foreground">{release.date}</span>
              </div>

              <div className="mt-6 space-y-6">
                {CATEGORIES.map(({ key, label, icon: Icon, color }) => {
                  if (filter !== "all" && filter !== key) return null;
                  const items = release.changes[key];
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={key}>
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className="flex size-6 items-center justify-center rounded-md"
                          style={{ background: `${color}1a`, color }}
                        >
                          <Icon className="size-3.5" />
                        </span>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                          {label}
                        </h3>
                        <span className="text-[11px] text-muted-foreground">{items.length}</span>
                      </div>
                      <ul className="space-y-2 border-l pl-4" style={{ borderColor: `${color}33` }}>
                        {items.map((item) => (
                          <li key={item} className="text-sm leading-relaxed text-muted-foreground">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
