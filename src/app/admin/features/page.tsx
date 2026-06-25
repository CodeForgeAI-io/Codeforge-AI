import type { Metadata } from "next";
import { FeaturesManager } from "@/features/admin/features-manager";

export const metadata: Metadata = { title: "Admin · Feature Access" };

export default function AdminFeaturesPage() {
  return <FeaturesManager />;
}
