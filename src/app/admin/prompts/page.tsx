import type { Metadata } from "next";
import { PromptsManager } from "@/features/admin/prompts-manager";

export const metadata: Metadata = { title: "Admin · AI Prompts" };

export default function AdminPromptsPage() {
  return <PromptsManager />;
}
