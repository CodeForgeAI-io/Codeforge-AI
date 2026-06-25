import type { Metadata } from "next";
import { CouponsManager } from "@/features/admin/coupons-manager";

export const metadata: Metadata = { title: "Admin · Coupons" };

export default function AdminCouponsPage() {
  return <CouponsManager />;
}
