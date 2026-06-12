import type { Metadata } from "next";
import { InterviewMode } from "@/features/interview/interview-session";

export const metadata: Metadata = { title: "Mock Interview" };

export default function InterviewPage() {
  return <InterviewMode />;
}
