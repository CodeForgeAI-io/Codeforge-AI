import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "@/components/icons";
import { auth } from "@/lib/auth";
import { getDiscussionForView, getDiscussionTitle } from "@/services/discussions-store";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { ForumDetail } from "@/features/discussions/forum-detail";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const title = await getDiscussionTitle(id);
  return { title: title ? `${title} — Forum` : "Thread" };
}

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const discussion = await getDiscussionForView(id);
  if (!discussion) notFound();

  return (
    <div className="min-h-svh bg-background">
      <PublicHeader signedIn={!!session?.user} />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link href="/forum"><ArrowLeft className="size-4" /></Link>
          </Button>
          <h1 className="text-lg font-bold leading-tight">{discussion.title}</h1>
        </div>
        <ForumDetail
          discussion={JSON.parse(JSON.stringify(discussion))}
          userId={session?.user?.id}
          userRole={session?.user?.role}
          signedIn={!!session?.user}
        />
      </div>
    </div>
  );
}
