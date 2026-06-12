import { Suspense } from "react";
import type { Metadata } from "next";
import { ChallengesList } from "@/features/sandbox/challenges-list";

export const metadata: Metadata = { title: "Frontend Challenges" };

export default function ChallengesPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Frontend Challenges
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Build real UI components and apps with live preview and AI review.
        </p>
      </div>
      <Suspense>
        <ChallengesList />
      </Suspense>
    </div>
  );
}
