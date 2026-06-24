import type { Metadata } from "next";
import { BillingManager } from "@/features/admin/billing-manager";

export const metadata: Metadata = { title: "Admin · Billing & Usage" };

export default function AdminBillingPage() {
  return <BillingManager />;
}
