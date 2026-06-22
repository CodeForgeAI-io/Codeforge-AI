"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const TRACKS = [
  {
    id: "blind75",
    title: "Blind 75",
    description: "The classic 75 questions curated for top tech interviews",
    count: 75,
    difficulty: "Mixed",
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    categories: ["Array", "Binary", "DP", "Graph", "Interval", "Linked List", "Matrix", "String", "Tree", "Heap"],
  },
  {
    id: "grind75",
    title: "Grind 75",
    description: "Updated grind list optimized for modern FAANG interviews",
    count: 75,
    difficulty: "Mixed",
    color: "text-green-500",
    bg: "bg-green-500/10 border-green-500/20",
    categories: ["Array", "Stack", "Tree", "Binary Search", "DP", "Graph", "Trie"],
  },
  {
    id: "neetcode150",
    title: "NeetCode 150",
    description: "Neetcode's comprehensive 150 questions with video solutions",
    count: 150,
    difficulty: "Mixed",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
    categories: ["Arrays & Hashing", "Two Pointers", "Sliding Window", "Stack", "Binary Search", "Linked List", "Trees", "Tries", "Heap", "Backtracking", "Graphs", "DP", "Greedy", "Intervals", "Math"],
  },
  {
    id: "faang100",
    title: "FAANG Top 100",
    description: "Most frequently asked questions at FAANG companies",
    count: 100,
    difficulty: "Mixed",
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
    categories: ["Array", "String", "Tree", "DP", "Graph", "Design"],
  },
  {
    id: "amazon",
    title: "Amazon Top Questions",
    description: "Questions frequently asked in Amazon interviews",
    count: 50,
    difficulty: "Mixed",
    color: "text-yellow-600",
    bg: "bg-yellow-500/10 border-yellow-500/20",
    categories: ["Array", "String", "Tree", "Graph", "DP", "Design"],
  },
  {
    id: "google",
    title: "Google Top Questions",
    description: "Questions frequently asked in Google interviews",
    count: 50,
    difficulty: "Mixed",
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
    categories: ["Array", "String", "Tree", "Graph", "DP", "Math"],
  },
];

export function LearningTracks() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [started, setStarted] = useState<Set<string>>(new Set());

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {TRACKS.map((track) => {
        const isExpanded = expanded === track.id;
        const isStarted = started.has(track.id);
        const progress = isStarted ? Math.floor(Math.random() * 30) : 0;

        return (
          <Card
            key={track.id}
            className={cn("cursor-pointer transition-all hover:shadow-md", track.bg)}
            onClick={() => setExpanded(isExpanded ? null : track.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className={cn("text-base", track.color)}>{track.title}</CardTitle>
                  <CardDescription className="mt-0.5 text-xs">{track.description}</CardDescription>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">{track.count} Qs</Badge>
              </div>
              {isStarted && (
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress}/{track.count} solved</span>
                    <span>{Math.round((progress / track.count) * 100)}%</span>
                  </div>
                  <Progress value={(progress / track.count) * 100} className="h-1.5" />
                </div>
              )}
            </CardHeader>
            <CardContent className="pt-0 pb-4">
              {isExpanded && (
                <div className="space-y-3 mb-4" onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs text-muted-foreground font-medium">Topics covered:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {track.categories.map((c) => (
                      <span key={c} className="rounded bg-background/60 border px-2 py-0.5 text-[10px]">{c}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  className="flex-1 h-8 text-xs"
                  variant={isStarted ? "outline" : "default"}
                  onClick={() => setStarted((s) => { const n = new Set(s); if (n.has(track.id)) n.delete(track.id); else n.add(track.id); return n; })}
                >
                  {isStarted ? "Continue" : "Start Track"}
                </Button>
                <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => setExpanded(isExpanded ? null : track.id)}>
                  {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
