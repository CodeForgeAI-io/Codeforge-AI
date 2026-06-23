import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LogIn } from "@/components/icons";
import { auth } from "@/lib/auth";
import { PublicHeader } from "@/components/layout/public-header";
import { Button } from "@/components/ui/button";
import { NewDiscussionForm } from "@/features/discussions/new-discussion-form";

export const metadata: Metadata = { title: "New Thread — Forum" };

export default async function ForumNewPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [session, { q }] = await Promise.all([auth(), searchParams]);
  const signedIn = !!session?.user;

  return (
    <div className="min-h-svh bg-background">
      <PublicHeader signedIn={signedIn} />
      <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link href="/forum"><ArrowLeft className="size-4" /></Link>
          </Button>
          <h1 className="text-xl font-bold">New Thread</h1>
        </div>

        {signedIn ? (
          <NewDiscussionForm questionId={q} redirectTo="/forum" />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border py-16 text-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
              <LogIn className="size-7 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Sign in to post</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You need an account to start a discussion thread.
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href="/login?callbackUrl=/forum/new">Sign in</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/register">Create account</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
