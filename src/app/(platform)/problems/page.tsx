import { Suspense } from "react";
import type { Metadata } from "next";
import { ProblemsFilters } from "@/features/problems/problems-filters";
import { ProblemsList } from "@/features/problems/problems-list";

export const metadata: Metadata = { title: "Problems" };

export default function ProblemsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Problems</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sharpen your DSA skills with curated interview questions.
        </p>
      </div>
      <Suspense>
        <div className="space-y-4">
          <ProblemsFilters />
          <ProblemsList />
        </div>
      </Suspense>
    </div>
  );
}
