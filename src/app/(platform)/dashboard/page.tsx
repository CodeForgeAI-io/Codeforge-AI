import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDashboardData } from "@/services/stats";
import { StatsOverview } from "@/features/dashboard/stats-overview";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getDashboardData(session.user.id);
  if (!data) redirect("/login");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <StatsOverview data={data} isOwner />
    </div>
  );
}
