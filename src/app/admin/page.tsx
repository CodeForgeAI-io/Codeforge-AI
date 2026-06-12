import type { Metadata } from "next";
import { AnalyticsDashboard } from "@/features/admin/analytics-dashboard";

export const metadata: Metadata = { title: "Admin · Analytics" };

export default function AdminAnalyticsPage() {
  return <AnalyticsDashboard />;
}
