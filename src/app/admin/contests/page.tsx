import type { Metadata } from "next";
import { ContestsManager } from "@/features/admin/contests-manager";

export const metadata: Metadata = { title: "Admin · Contests" };

export default function AdminContestsPage() {
  return <ContestsManager />;
}
