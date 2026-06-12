"use client";

import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import {
  DIFFICULTIES,
  FRONTEND_TECHS,
  FRONTEND_TECH_LABELS,
  type FrontendTech,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ChallengeListItem } from "@/services/challenges";

export function ChallengesList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const techFilter = searchParams.get("tech");
  const difficultyFilter = searchParams.get("difficulty");

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const { data, isLoading } = useQuery<{ items: ChallengeListItem[] }>({
    queryKey: ["challenges", techFilter, difficultyFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (techFilter) params.set("tech", techFilter);
      if (difficultyFilter) params.set("difficulty", difficultyFilter);
      const res = await fetch(`/api/challenges?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load challenges");
      return res.json();
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        <FilterChip
          active={!techFilter}
          onClick={() => setParam("tech", null)}
          label="All"
        />
        {FRONTEND_TECHS.map((tech) => (
          <FilterChip
            key={tech}
            active={techFilter === tech}
            onClick={() => setParam("tech", tech)}
            label={FRONTEND_TECH_LABELS[tech as FrontendTech]}
          />
        ))}
        <span className="mx-1 w-px bg-border" />
        {DIFFICULTIES.map((difficulty) => (
          <FilterChip
            key={difficulty}
            active={difficultyFilter === difficulty}
            onClick={() =>
              setParam(
                "difficulty",
                difficultyFilter === difficulty ? null : difficulty,
              )
            }
            label={difficulty}
          />
        ))}
      </div>

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No challenges published yet. Check back soon!
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => (
            <Link key={item.id} href={`/challenges/${item.slug}`} className="group">
              <Card className="h-full py-0 transition-colors group-hover:border-primary/40">
                <CardContent className="flex h-full flex-col p-4">
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <h3 className="font-medium leading-snug">{item.title}</h3>
                    {item.completed && (
                      <CheckCircle2 className="size-4 shrink-0 text-success" />
                    )}
                  </div>
                  <p className="mb-3 line-clamp-2 flex-1 text-xs text-muted-foreground">
                    {item.brief}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <DifficultyBadge difficulty={item.difficulty} />
                    <Badge variant="secondary" className="text-[10px]">
                      {FRONTEND_TECH_LABELS[item.tech as FrontendTech] ??
                        item.tech}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-xs transition-colors",
        active
          ? "border-primary bg-primary/10 font-medium text-primary"
          : "text-muted-foreground hover:border-primary/30 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
