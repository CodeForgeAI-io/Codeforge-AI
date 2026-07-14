import type { Metadata } from "next";
import { AnalyticsDashboard } from "@/features/admin/analytics-dashboard";
import { KpiMetrics } from "@/features/admin/kpi-metrics";

export const metadata: Metadata = { title: "Admin · Analytics" };

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Key metrics</h2>
        <KpiMetrics />
      </section>
      <AnalyticsDashboard />
    </div>
  );
}
