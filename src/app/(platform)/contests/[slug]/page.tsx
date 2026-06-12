import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { getContestDetail } from "@/services/contests";
import { ContestDetailView } from "@/features/contests/contest-detail";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const contest = await getContestDetail(slug).catch(() => null);
  return { title: contest?.title ?? "Contest" };
}

export default async function ContestPage({ params }: PageProps) {
  const { slug } = await params;
  const session = await auth();
  const contest = await getContestDetail(slug, session?.user?.id);
  if (!contest) notFound();

  return <ContestDetailView contest={contest} />;
}
