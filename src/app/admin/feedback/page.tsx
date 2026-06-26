import type { Metadata } from "next";
import { FeedbackManager } from "@/features/admin/feedback-manager";

export const metadata: Metadata = { title: "Admin · Feedback" };

export default function AdminFeedbackPage() {
  return <FeedbackManager />;
}
