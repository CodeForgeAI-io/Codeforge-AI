import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Discussion } from "@/models";
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
  await connectDB();
  const d = await Discussion.findById(id).select("title").lean();
  return { title: d ? `${d.title} — Forum` : "Thread" };
}

export default async function ForumThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  await connectDB();
  const discussion = await Discussion.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { returnDocument: "after" },
  )
    .populate("author", "username name image")
    .populate("replies.author", "username name image")
    .lean();

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
          signedIn={!!session?.user}
        />
      </div>
    </div>
  );
}
