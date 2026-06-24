import type { ComponentType } from "react";
import { Sparkles } from "@/components/icons";
import { AiRoadmap } from "@/features/ai-tools/ai-roadmap";
import { AiResume } from "@/features/ai-tools/ai-resume";
import { AiProjectReviewer } from "@/features/ai-tools/ai-project-reviewer";
import { AiCodeReview } from "@/features/ai-tools/ai-code-review";
import { AiStudyPlanner } from "@/features/ai-tools/ai-study-planner";
import { AiPairProgrammer } from "@/features/ai-tools/ai-pair-programmer";
import { AiLearningCoach } from "@/features/ai-tools/ai-learning-coach";
import { AiComplexityVisualizer } from "@/features/ai-tools/ai-complexity-visualizer";
import { AiContestGenerator } from "@/features/ai-tools/ai-contest-generator";

export const metadata = { title: "AI Tools" };

type Tool = { label: string; tagline: string; Component: ComponentType };

const TOOLS: Record<string, Tool> = {
  coach: { label: "Learning Coach", tagline: "Personalized guidance tuned to your weak areas.", Component: AiLearningCoach },
  pair: { label: "Pair Programmer", tagline: "Real-time, conversational coding help.", Component: AiPairProgrammer },
  study: { label: "Study Planner", tagline: "A structured plan toward your target date.", Component: AiStudyPlanner },
  complexity: { label: "Complexity Visualizer", tagline: "Big-O analysis for any snippet, explained.", Component: AiComplexityVisualizer },
  code: { label: "Code Review", tagline: "Correctness, style and edge-case review.", Component: AiCodeReview },
  roadmap: { label: "Roadmap Generator", tagline: "A guided path to your target role.", Component: AiRoadmap },
  contest: { label: "Contest Generator", tagline: "Spin up a custom coding contest in seconds.", Component: AiContestGenerator },
  resume: { label: "Resume Analyzer", tagline: "Feedback tuned to engineering roles.", Component: AiResume },
  project: { label: "Project Reviewer", tagline: "An AI review of your sandbox projects.", Component: AiProjectReviewer },
};

const DEFAULT = "coach";

export default async function AiToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ tool?: string }>;
}) {
  const { tool } = await searchParams;
  // The active tool is driven by ?tool= so the sidebar menu items deep-link.
  const active = tool && TOOLS[tool] ? tool : DEFAULT;
  const { label, tagline, Component } = TOOLS[active];

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#006bff]/10">
          <Sparkles className="size-5 text-[#006bff]" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{label}</h1>
          <p className="text-sm text-muted-foreground">{tagline}</p>
        </div>
      </div>

      <Component />
    </div>
  );
}
