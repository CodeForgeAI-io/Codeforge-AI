import type { Metadata } from "next";
import { QaDashboard } from "@/features/qa/qa-dashboard";

export const metadata: Metadata = {
  title: "QA Program",
  description: "Report and track bugs as a CodeForge AI QA contributor.",
};

export default function QaPage() {
  return <QaDashboard />;
}
