import Link from "next/link";
import { Lock, Crown, Zap, Sparkles } from "@/components/icons";
import { Button } from "@/components/ui/button";

/**
 * Full-page locked state shown when the current plan doesn't unlock a feature.
 * Server component — safe to render directly from gated pages.
 */
export function UpgradeLock({
  feature,
  description,
  requiredPlan,
}: {
  feature: string;
  description?: string;
  requiredPlan: "go" | "plus";
}) {
  const planName = requiredPlan === "plus" ? "Plus" : "Go";
  const PlanIcon = requiredPlan === "plus" ? Crown : Zap;

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <div className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border bg-muted/40">
        <Lock className="size-6 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-bold tracking-tight">{feature} is a {planName} feature</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        {description ?? `Upgrade to ${planName} to unlock ${feature} and more.`}
      </p>
      <div className="mt-6 flex flex-col items-center gap-2">
        <Button asChild size="lg" className="gap-2">
          <Link href="/pricing">
            <PlanIcon className="size-4" />
            Upgrade to {planName}
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link href="/pricing">
            <Sparkles className="size-3.5" /> Compare plans
          </Link>
        </Button>
      </div>
    </div>
  );
}
