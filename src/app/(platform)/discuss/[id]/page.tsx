import { notFound } from "next/navigation";
import { connectDB } from "@/lib/mongodb";
import { Discussion } from "@/models";
import { auth } from "@/lib/auth";
import { DiscussionDetail } from "@/features/discussions/discussion-detail";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DiscussionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [session] = await Promise.all([auth()]);

  await connectDB();
  const discussion = await Discussion.findByIdAndUpdate(
    id,
    { $inc: { views: 1 } },
    { returnDocument: 'after' },
  )
    .populate("author", "username name image")
    .populate("replies.author", "username name image")
    .lean();

  if (!discussion) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/discuss">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <h1 className="text-lg font-bold leading-tight">{discussion.title}</h1>
      </div>
      <DiscussionDetail
        discussion={JSON.parse(JSON.stringify(discussion))}
        userId={session?.user?.id}
      />
    </div>
  );
}
