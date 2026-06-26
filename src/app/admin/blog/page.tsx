import type { Metadata } from "next";
import { BlogManager } from "@/features/admin/blog-manager";

export const metadata: Metadata = { title: "Admin · Blog" };

export default function AdminBlogPage() {
  return <BlogManager />;
}
