"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid } from "@/components/icons";
import { cn } from "@/lib/utils";

interface CategoryCount {
  category: string;
  count: number;
}

/** Horizontal category browser shown above the problems list */
export function CategoryChips() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get("category");

  const { data } = useQuery<{ categories: CategoryCount[] }>({
    queryKey: ["question-categories"],
    queryFn: async () => {
      const res = await fetch("/api/questions/categories");
      if (!res.ok) throw new Error("Failed to load categories");
      return res.json();
    },
    staleTime: 60_000,
  });

  const categories = data?.categories ?? [];
  if (categories.length === 0) return null;

  function select(category: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (category) params.set("category", category);
    else params.delete("category");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
      <button
        onClick={() => select(null)}
        className={cn(
          "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
          !active
            ? "border-primary bg-primary text-primary-foreground"
            : "text-muted-foreground hover:border-primary/50 hover:text-foreground",
        )}
      >
        <LayoutGrid className="size-3.5" />
        All
      </button>
      {categories.map((entry) => (
        <button
          key={entry.category}
          onClick={() =>
            select(active === entry.category ? null : entry.category)
          }
          className={cn(
            "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
            active === entry.category
              ? "border-primary bg-primary text-primary-foreground"
              : "text-muted-foreground hover:border-primary/50 hover:text-foreground",
          )}
        >
          {entry.category}
          <span
            className={cn(
              "ml-1.5",
              active === entry.category
                ? "text-primary-foreground/80"
                : "text-muted-foreground/60",
            )}
          >
            {entry.count}
          </span>
        </button>
      ))}
    </div>
  );
}
