import type { Metadata } from "next";
import { SubmissionsBrowser } from "@/features/admin/submissions-browser";

export const metadata: Metadata = { title: "Admin · Submissions" };

export default function AdminSubmissionsPage() {
  return <SubmissionsBrowser />;
}
