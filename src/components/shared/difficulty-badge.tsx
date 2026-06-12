import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  Easy: "text-easy bg-easy/10 border-easy/20",
  Medium: "text-medium bg-medium/10 border-medium/20",
  Hard: "text-hard bg-hard/10 border-hard/20",
};

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
        STYLES[difficulty] ?? "text-muted-foreground bg-muted border-border",
        className,
      )}
    >
      {difficulty}
    </span>
  );
}
