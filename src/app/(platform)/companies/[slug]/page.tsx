import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Building2, CheckCircle2, Circle, CircleDot } from "@/components/icons";
import { getSession } from "@/lib/session";
import { getCompanyBySlug } from "@/services/companies";
import { listQuestions } from "@/services/questions";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const STATUS_ICONS = {
  solved: <CheckCircle2 className="size-4 text-success" />,
  attempted: <CircleDot className="size-4 text-warning" />,
  todo: <Circle className="size-4 text-muted-foreground/40" />,
} as const;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug).catch(() => null);
  return { title: company ? `${company.name} Questions` : "Company" };
}

export default async function CompanyPage({ params }: PageProps) {
  const { slug } = await params;
  const [company, session] = await Promise.all([getCompanyBySlug(slug), getSession()]);
  if (!company) notFound();

  const result = await listQuestions(
    { company: company.name, page: 1, limit: 50 },
    session?.user?.id,
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
          <Building2 className="size-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {company.name}
          </h1>
          <p className="text-sm text-muted-foreground">{company.description}</p>
        </div>
      </div>

      {result.items.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No {company.name} questions published yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          {result.items.map((item, index) => (
            <Link
              key={item.id}
              href={`/problems/${item.slug}`}
              className={cn(
                "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50",
                index % 2 === 1 && "bg-muted/30",
              )}
            >
              {STATUS_ICONS[item.status]}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.category}</p>
              </div>
              <DifficultyBadge difficulty={item.difficulty} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
