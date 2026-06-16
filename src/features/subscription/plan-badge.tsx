import { cn } from "@/lib/utils";
import { getPlanById } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

export function PlanBadge({
  plan,
  size = "sm",
  className,
}: {
  plan?: string | null;
  size?: "xs" | "sm" | "md";
  className?: string;
}) {
  const def = getPlanById(plan);
  if (!def.badge) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded font-bold tracking-wider",
        def.badgeClass,
        size === "xs" && "px-1 py-0 text-[8px]",
        size === "sm" && "px-1.5 py-0.5 text-[10px]",
        size === "md" && "px-2 py-1 text-xs",
        className,
      )}
    >
      {def.badge}
    </span>
  );
}

export function PlanName({ plan }: { plan?: string | null }) {
  const def = getPlanById(plan);
  return <span className="font-semibold">{def.name}</span>;
}
