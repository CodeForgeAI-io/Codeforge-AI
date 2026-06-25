import { Brain } from "@/components/icons";
import { RevisionPanel } from "@/features/revision/revision-panel";
import { UpgradeLock } from "@/components/shared/upgrade-lock";
import { checkPageFeature } from "@/services/feature-access";

export const metadata = { title: "Smart Revision" };

export default async function RevisionPage() {
  const gate = await checkPageFeature("spacedRepetition");
  if (!gate.allowed) {
    return (
      <UpgradeLock
        feature="Smart Revision"
        description="Spaced-repetition review (SM-2) schedules problems at the perfect moment to lock them into memory."
        requiredPlan={gate.requiredPlan as "go" | "plus"}
      />
    );
  }
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Brain className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Smart Revision</h1>
          <p className="text-sm text-muted-foreground">Spaced repetition — review at the perfect moment</p>
        </div>
      </div>
      <RevisionPanel />
    </div>
  );
}
