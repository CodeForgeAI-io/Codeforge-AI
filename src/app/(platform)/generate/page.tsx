import type { Metadata } from "next";
import { GenerateQuestions } from "@/features/generate/generate-questions";

export const metadata: Metadata = { title: "Generate Questions" };

export default function GeneratePage() {
  return <GenerateQuestions />;
}
