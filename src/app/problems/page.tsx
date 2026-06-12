import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/public-header";
import { ProblemsFilters } from "@/features/problems/problems-filters";
import { ProblemsList } from "@/features/problems/problems-list";
import { CategoryChips } from "@/features/problems/category-chips";

export const metadata: Metadata = { title: "Problems" };
export const dynamic = "force-dynamic";

/** Publicly browsable — solving a problem prompts sign-in */
export default async function ProblemsPage() {
  const session = await auth();

  return (
    <div className="min-h-svh">
      <PublicHeader signedIn={!!session?.user} />
      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Problems</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sharpen your DSA skills with curated interview questions.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={session ? "/generate" : "/login?callbackUrl=/generate"}>
              <Sparkles className="size-4 text-primary" /> Generate with AI
            </Link>
          </Button>
        </div>
        <Suspense>
          <div className="space-y-4">
            <CategoryChips />
            <ProblemsFilters />
            <ProblemsList />
          </div>
        </Suspense>
      </div>
    </div>
  );
}
