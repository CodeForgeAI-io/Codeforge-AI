import Link from "next/link";
import { Flame } from "@/components/icons";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

export function Logo({
  className,
  href = "/",
  compact = false,
}: {
  className?: string;
  href?: string;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 font-semibold tracking-tight",
        className,
      )}
    >
      <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Flame className="size-4" />
      </span>
      {!compact && (
        <>
          <span className="text-base">{APP_NAME}</span>
          <span className="rounded-md border border-black-500/30 bg-black-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white-400">
            Beta
          </span>
        </>
      )}
    </Link>
  );
}
