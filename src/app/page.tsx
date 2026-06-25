import { auth } from "@/lib/auth";
import { listQuestions } from "@/services/questions";
import { Landing, type LandingProblem } from "@/features/marketing/landing";
import { FAQS } from "@/features/marketing/faqs";
import { getFeatureAccess } from "@/services/feature-access";
import { buildPricingFeatures } from "@/lib/feature-catalog";

export const dynamic = "force-dynamic";

/** FAQPage structured data — eligible for FAQ rich results in search. */
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

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
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Landing
        signedIn={!!session?.user}
        problems={problems}
        totalProblems={totalProblems}
        featuresByPlan={buildPricingFeatures(await getFeatureAccess())}
      />
    </>
  );
}
