import type { Metadata } from "next";
import { InterviewMode } from "@/features/interview/interview-session";
import { UpgradeLock } from "@/components/shared/upgrade-lock";
import { checkPageFeature } from "@/services/feature-access";

export const metadata: Metadata = { title: "Mock Interview" };

export default async function InterviewPage() {
  const gate = await checkPageFeature("mockInterview");
  if (!gate.allowed) {
    return (
      <UpgradeLock
        feature="Mock Interview"
        description="Timed mock interviews with a question queue and AI feedback on your performance."
        requiredPlan={gate.requiredPlan as "go" | "plus"}
      />
    );
  }
  return <InterviewMode />;
}
