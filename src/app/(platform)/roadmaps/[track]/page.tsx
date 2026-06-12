import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { getRoadmapView } from "@/services/roadmaps";
import { ROADMAP_TRACKS, type RoadmapTrack } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ track: string }>;
}

const TIER_STYLES: Record<string, string> = {
  Beginner: "text-easy border-easy/30 bg-easy/10",
  Intermediate: "text-medium border-medium/30 bg-medium/10",
  Advanced: "text-hard border-hard/30 bg-hard/10",
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { track } = await params;
  return { title: track === "dsa" ? "DSA Roadmap" : "Frontend Roadmap" };
}

export default async function RoadmapDetailPage({ params }: PageProps) {
  const { track } = await params;
  if (!ROADMAP_TRACKS.includes(track as RoadmapTrack)) notFound();

  const session = await auth();
  const view = await getRoadmapView(track as RoadmapTrack, session?.user?.id);
  if (!view) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">{view.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{view.description}</p>
        <div className="mt-4">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted-foreground">
              {view.completedTopics}/{view.totalTopics} topics completed
            </span>
            <span className="font-medium text-primary">{view.percent}%</span>
          </div>
          <Progress value={view.percent} />
        </div>
      </div>

      <div className="space-y-8">
        {view.sections.map((section) => (
          <section key={section.key}>
            <div className="mb-3 flex items-center gap-2">
              <h2 className="text-base font-semibold">{section.title}</h2>
              <Badge
                variant="outline"
                className={cn("text-[10px]", TIER_STYLES[section.tier])}
              >
                {section.tier}
              </Badge>
            </div>
            <div className="space-y-2">
              {section.topics.map((topic) => (
                <Card
                  key={topic.key}
                  className={cn(
                    "py-0",
                    topic.completed && "border-success/40 bg-success/5",
                  )}
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                        topic.completed
                          ? "border-success bg-success/10 text-success"
                          : "border-border text-muted-foreground",
                      )}
                    >
                      {topic.completed ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        `${topic.solves}/${topic.requiredSolves}`
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{topic.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {topic.description}
                      </p>
                    </div>
                    <Link
                      href={topic.practiceHref}
                      className="flex shrink-0 items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Practice
                      {view.track === "dsa" && topic.questionCount > 0 && (
                        <span className="text-muted-foreground">
                          ({topic.questionCount})
                        </span>
                      )}
                      <ArrowUpRight className="size-3" />
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
