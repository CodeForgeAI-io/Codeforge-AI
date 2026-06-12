import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Braces, Palette } from "lucide-react";
import { auth } from "@/lib/auth";
import { getRoadmapView } from "@/services/roadmaps";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export const metadata: Metadata = { title: "Roadmaps" };
export const dynamic = "force-dynamic";

export default async function RoadmapsPage() {
  const session = await auth();
  const [dsa, frontend] = await Promise.all([
    getRoadmapView("dsa", session?.user?.id),
    getRoadmapView("frontend", session?.user?.id),
  ]);

  const roadmaps = [
    { view: dsa, icon: Braces, href: "/roadmaps/dsa" },
    { view: frontend, icon: Palette, href: "/roadmaps/frontend" },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Learning Roadmaps</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Structured paths from beginner to interview-ready.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {roadmaps.map(({ view, icon: Icon, href }) =>
          view ? (
            <Link key={view.track} href={href} className="group">
              <Card className="h-full transition-colors group-hover:border-primary/40">
                <CardHeader>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <CardTitle className="flex items-center justify-between">
                    {view.title}
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </CardTitle>
                  <CardDescription>{view.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-1.5 flex justify-between text-xs">
                    <span className="text-muted-foreground">
                      {view.completedTopics}/{view.totalTopics} topics completed
                    </span>
                    <span className="font-medium text-primary">
                      {view.percent}%
                    </span>
                  </div>
                  <Progress value={view.percent} />
                </CardContent>
              </Card>
            </Link>
          ) : null,
        )}
      </div>
    </div>
  );
}
