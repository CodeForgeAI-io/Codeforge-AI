import type { Metadata } from "next";
import { UsersManager } from "@/features/admin/users-manager";

export const metadata: Metadata = { title: "Admin · Users" };

export default function AdminUsersPage() {
  return <UsersManager />;
}
