import { BarChart3 } from "@/components/icons";
import { WeaknessDashboard } from "@/features/weakness/weakness-dashboard";
import { UpgradeLock } from "@/components/shared/upgrade-lock";
import { checkPageFeature } from "@/services/feature-access";

export const metadata = { title: "Weakness Detection" };

export default async function WeaknessPage() {
  const gate = await checkPageFeature("skillAnalytics");
  if (!gate.allowed) {
    return (
      <UpgradeLock
        feature="Weakness Detection"
        description="Analyze your acceptance rate per topic and get a personalized plan to fix weak areas."
        requiredPlan={gate.requiredPlan as "go" | "plus"}
      />
    );
  }
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <BarChart3 className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Weakness Detection</h1>
          <p className="text-sm text-muted-foreground">Analyze your performance and get a personalized daily plan</p>
        </div>
      </div>
      <WeaknessDashboard />
    </div>
  );
}
