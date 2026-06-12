import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getChallengeBySlug } from "@/services/challenges";
import { SandboxWorkspace } from "@/features/sandbox/sandbox-workspace";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const challenge = await getChallengeBySlug(slug).catch(() => null);
  return { title: challenge?.title ?? "Challenge" };
}

export default async function ChallengePage({ params }: PageProps) {
  const { slug } = await params;
  const challenge = await getChallengeBySlug(slug);
  if (!challenge) notFound();

  return <SandboxWorkspace challenge={challenge} />;
}
