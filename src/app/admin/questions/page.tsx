import type { Metadata } from "next";
import { QuestionsManager } from "@/features/admin/questions-manager";

export const metadata: Metadata = { title: "Admin · Questions" };

export default function AdminQuestionsPage() {
  return <QuestionsManager />;
}
