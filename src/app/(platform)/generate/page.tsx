import type { Metadata } from "next";
import { Sparkles } from "@/components/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenerateQuestions } from "@/features/generate/generate-questions";
import { ContributeJson } from "@/features/generate/contribute-json";

export const metadata: Metadata = { title: "Generate Questions" };

export default function GeneratePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Sparkles className="size-6 text-primary" />
          Add Questions
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Generate questions with AI from a prompt, or upload your own as JSON.
          Valid questions publish straight to Problems.
        </p>
      </div>
      <Tabs defaultValue="ai">
        <TabsList className="mb-4 grid w-full grid-cols-2">
          <TabsTrigger value="ai" className="gap-1.5 font-semibold">
            <Sparkles className="size-3.5" style={{ color: "#7c3aed" }} />
            <span className="ai-gradient-text">Generate with AI</span>
          </TabsTrigger>
          <TabsTrigger value="json">Upload JSON</TabsTrigger>
        </TabsList>
        <TabsContent value="ai">
          <GenerateQuestions />
        </TabsContent>
        <TabsContent value="json">
          <ContributeJson />
        </TabsContent>
      </Tabs>
    </div>
  );
}
