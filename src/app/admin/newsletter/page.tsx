import type { Metadata } from "next";
import { NewsletterManager } from "@/features/admin/newsletter-manager";

export const metadata: Metadata = { title: "Admin · Newsletter" };

export default function AdminNewsletterPage() {
  return <NewsletterManager />;
}
