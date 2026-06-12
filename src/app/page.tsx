import { auth } from "@/lib/auth";
import { listQuestions } from "@/services/questions";
import { Landing, type LandingProblem } from "@/features/marketing/landing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();

  // Real problems for the home page preview — never fail the landing
  let problems: LandingProblem[] = [];
  let totalProblems = 0;
  try {
    const result = await listQuestions({ page: 1, limit: 6 });
    problems = result.items.map((item) => ({
      slug: item.slug,
      title: item.title,
      difficulty: item.difficulty,
      category: item.category,
      acceptanceRate: item.acceptanceRate,
    }));
    totalProblems = result.total;
  } catch {
    // DB unavailable — render the landing without the problems section
  }

  return (
    <Landing
      signedIn={!!session?.user}
      problems={problems}
      totalProblems={totalProblems}
    />
  );
}
