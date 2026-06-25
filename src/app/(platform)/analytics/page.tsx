import { BarChart3 } from "@/components/icons";
import { AnalyticsDashboard } from "@/features/analytics/analytics-dashboard";
import { UpgradeLock } from "@/components/shared/upgrade-lock";
import { checkPageFeature } from "@/services/feature-access";

export const metadata = { title: "Skill Analytics" };

export default async function AnalyticsPage() {
  const gate = await checkPageFeature("skillAnalytics");
  if (!gate.allowed) {
    return (
      <UpgradeLock
        feature="Skill Analytics"
        description="Topic mastery tracking, performance insights and readiness predictions."
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
          <h1 className="text-xl font-bold">Skill Analytics</h1>
          <p className="text-sm text-muted-foreground">Topic mastery tracking, performance insights & predictions</p>
        </div>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
