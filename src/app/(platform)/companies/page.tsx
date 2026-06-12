import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { listCompaniesWithProgress } from "@/services/companies";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = { title: "Company Prep" };
export const dynamic = "force-dynamic";

export default async function CompaniesPage() {
  const session = await auth();
  const companies = await listCompaniesWithProgress(session?.user?.id);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Company Preparation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Practice the question patterns asked at top tech companies.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {companies.map((company) => {
          const percent =
            company.questionCount > 0
              ? Math.round((company.solvedCount / company.questionCount) * 100)
              : 0;
          return (
            <Link key={company.slug} href={`/companies/${company.slug}`} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/40">
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="size-5 text-primary" />
                  </div>
                  <CardTitle>{company.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {company.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {company.solvedCount}/{company.questionCount} solved
                    </span>
                    <span className="font-medium text-primary">{percent}%</span>
                  </div>
                  <Progress value={percent} />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
