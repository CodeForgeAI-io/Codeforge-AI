import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getQuestionBySlug } from "@/services/questions";
import { Workspace } from "@/features/workspace/workspace";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ contest?: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const question = await getQuestionBySlug(slug).catch(() => null);
  return { title: question?.title ?? "Problem" };
}

export default async function ProblemPage({ params, searchParams }: PageProps) {
  const [{ slug }, { contest }] = await Promise.all([params, searchParams]);
  const question = await getQuestionBySlug(slug);
  if (!question) notFound();

  return <Workspace question={question} contestSlug={contest} />;
}
