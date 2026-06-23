import { Sparkles } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const TOOLS = [
  { id: "coach", label: "Learning Coach" },
  { id: "pair", label: "Pair Programmer" },
  { id: "study", label: "Study Planner" },
  { id: "complexity", label: "Complexity" },
  { id: "code", label: "Code Review" },
  { id: "roadmap", label: "Roadmap" },
  { id: "contest", label: "Contest Gen" },
  { id: "resume", label: "Resume" },
  { id: "project", label: "Project Review" },
];

export default function AiToolsPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Sparkles className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">AI Tools Suite</h1>
          <p className="text-sm text-muted-foreground">9 AI-powered tools to accelerate your interview prep</p>
        </div>
      </div>

      <Tabs defaultValue="coach">
        <div className="overflow-x-auto pb-1">
          <TabsList className="flex w-max gap-0.5">
            {TOOLS.map((t) => (
              <TabsTrigger key={t.id} value={t.id} className="text-xs whitespace-nowrap">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <TabsContent value="coach" className="mt-4"><AiLearningCoach /></TabsContent>
        <TabsContent value="pair" className="mt-4"><AiPairProgrammer /></TabsContent>
        <TabsContent value="study" className="mt-4"><AiStudyPlanner /></TabsContent>
        <TabsContent value="complexity" className="mt-4"><AiComplexityVisualizer /></TabsContent>
        <TabsContent value="code" className="mt-4"><AiCodeReview /></TabsContent>
        <TabsContent value="roadmap" className="mt-4"><AiRoadmap /></TabsContent>
        <TabsContent value="contest" className="mt-4"><AiContestGenerator /></TabsContent>
        <TabsContent value="resume" className="mt-4"><AiResume /></TabsContent>
        <TabsContent value="project" className="mt-4"><AiProjectReviewer /></TabsContent>
      </Tabs>
    </div>
  );
}
