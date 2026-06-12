import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, LogIn } from "lucide-react";
import { auth } from "@/lib/auth";
import { getQuestionBySlug } from "@/services/questions";
import { Workspace } from "@/features/workspace/workspace";
import { Logo } from "@/components/shared/logo";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ contest?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const question = await getQuestionBySlug(slug).catch(() => null);
  return { title: question?.title ?? "Problem" };
}

/**
 * Full-screen problem workspace. Publicly viewable; running/submitting
 * code and the AI mentor require signing in.
 */
export default async function ProblemPage({ params, searchParams }: PageProps) {
  const session = await auth();
  const signedIn = !!session?.user;

  const [{ slug }, { contest }] = await Promise.all([params, searchParams]);
  const question = await getQuestionBySlug(slug);
  if (!question) notFound();

  return (
    <div className="flex h-svh flex-col">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-3">
        <Logo href={signedIn ? "/dashboard" : "/"} compact />
        <Button asChild variant="ghost" size="sm">
          <Link href="/problems">
            <ArrowLeft className="size-4" /> Problems
          </Link>
        </Button>
        <div className="hidden min-w-0 items-center gap-2 sm:flex">
          <span className="truncate text-sm font-medium">{question.title}</span>
          <DifficultyBadge difficulty={question.difficulty} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          {!signedIn && (
            <Button asChild size="sm">
              <Link href={`/login?callbackUrl=/problems/${question.slug}`}>
                <LogIn className="size-4" /> Sign in to solve
              </Link>
            </Button>
          )}
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <Workspace
          question={question}
          contestSlug={contest}
          signedIn={signedIn}
        />
      </div>
    </div>
  );
}
