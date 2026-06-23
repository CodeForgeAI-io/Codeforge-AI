import type { Metadata } from "next";
import { Compiler } from "@/features/compiler/compiler";

export const metadata: Metadata = { title: "Compiler" };

export default function CompilerPage() {
  return <Compiler />;
}
