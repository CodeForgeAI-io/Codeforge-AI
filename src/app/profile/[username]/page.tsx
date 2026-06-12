import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { getPublicProfile } from "@/services/stats";
import { StatsOverview } from "@/features/dashboard/stats-overview";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { username } = await params;
  return { title: `@${username}` };
}

/** Public profile — viewable without authentication */
export default async function PublicProfilePage({ params }: PageProps) {
  const { username } = await params;
  const [data, session] = await Promise.all([
    getPublicProfile(username).catch(() => null),
    auth(),
  ]);
  if (!data) notFound();

  const isOwner = session?.user?.username === data.username;

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 glass-strong">
        <Logo />
        <Button asChild variant="outline" size="sm">
          <Link href={session ? "/dashboard" : "/login"}>
            <ArrowLeft className="size-4" />
            {session ? "Back to app" : "Sign in"}
          </Link>
        </Button>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <StatsOverview data={data} isOwner={isOwner} />
      </div>
    </div>
  );
}
