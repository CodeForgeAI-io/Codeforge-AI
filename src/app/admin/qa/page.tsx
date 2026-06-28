import type { Metadata } from "next";
import { QaManager } from "@/features/admin/qa-manager";

export const metadata: Metadata = { title: "Admin · QA" };

export default function AdminQaPage() {
  return <QaManager />;
}
