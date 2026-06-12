import type { Metadata } from "next";
import { ChallengesManager } from "@/features/admin/challenges-manager";

export const metadata: Metadata = { title: "Admin · Challenges" };

export default function AdminChallengesPage() {
  return <ChallengesManager />;
}
