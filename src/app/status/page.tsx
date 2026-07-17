import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { PublicHeader } from "@/components/layout/public-header";
import { StatusView } from "@/features/status/status-view";
import { APP_NAME } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "System Status",
  description: `Live status of ${APP_NAME} — website, code execution, AI mentor, database and every feature and AI tool.`,
  alternates: { canonical: "/status" },
};

export default async function StatusPage() {
  const session = await auth();

  return (
    <div className="min-h-svh bg-background">
      <PublicHeader signedIn={!!session?.user} />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight">System status</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live health of {APP_NAME} — refreshed automatically every 30 seconds.
        </p>
        <div className="mt-6">
          <StatusView />
        </div>
      </div>
    </div>
  );
}
