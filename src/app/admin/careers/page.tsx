import type { Metadata } from "next";
import { CareersManager } from "@/features/admin/careers-manager";

export const metadata: Metadata = { title: "Admin · Careers" };

export default function AdminCareersPage() {
  return <CareersManager />;
}
