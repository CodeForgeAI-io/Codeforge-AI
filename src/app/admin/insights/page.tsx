import type { Metadata } from "next";
import { InsightsView } from "@/features/admin/insights-view";

export const metadata: Metadata = { title: "Admin · Live Insights" };

export default function AdminInsightsPage() {
  return <InsightsView />;
}
