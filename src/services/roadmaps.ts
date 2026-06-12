import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { mapToObject } from "@/lib/utils";
import { Progress, Question, Roadmap, type RoadmapDoc } from "@/models";
import type { RoadmapTrack } from "@/lib/constants";

/**
 * Roadmap content is defined in code and seeded on first read. Topic
 * `matchTags` are compared against question tags + category (DSA) or
 * challenge tech + tags (frontend) when advancing progress.
 */
const DEFAULT_ROADMAPS: Array<
  Pick<RoadmapDoc, "track" | "title" | "description" | "sections">
> = [
  {
    track: "dsa",
    title: "DSA Mastery Path",
    description:
      "From arrays to dynamic programming — a structured path to interview-ready data structures and algorithms.",
    sections: [
      {
        key: "dsa-beginner",
        title: "Foundations",
        tier: "Beginner",
        topics: [
          { key: "arrays", title: "Arrays", description: "Traversal, two pointers, prefix sums and in-place manipulation.", matchTags: ["Arrays", "Array", "Two Pointers", "Sliding Window"], requiredSolves: 5 },
          { key: "strings", title: "Strings", description: "Parsing, pattern matching and string manipulation techniques.", matchTags: ["Strings", "String"], requiredSolves: 4 },
          { key: "hashmaps", title: "HashMaps", description: "Frequency counting, lookups and hash-based optimization.", matchTags: ["HashMaps", "HashMap", "Hash Table"], requiredSolves: 4 },
        ],
      },
      {
        key: "dsa-intermediate",
        title: "Core Structures",
        tier: "Intermediate",
        topics: [
          { key: "linked-list", title: "Linked List", description: "Pointer manipulation, fast/slow pointers, reversal patterns.", matchTags: ["Linked List"], requiredSolves: 4 },
          { key: "stack", title: "Stack", description: "LIFO processing, monotonic stacks and expression parsing.", matchTags: ["Stack"], requiredSolves: 3 },
          { key: "queue", title: "Queue", description: "FIFO processing, deques and sliding window maximums.", matchTags: ["Queue"], requiredSolves: 3 },
          { key: "recursion", title: "Recursion", description: "Divide & conquer, backtracking foundations and memoization.", matchTags: ["Recursion", "Backtracking"], requiredSolves: 4 },
        ],
      },
      {
        key: "dsa-advanced",
        title: "Advanced Techniques",
        tier: "Advanced",
        topics: [
          { key: "trees", title: "Trees", description: "Traversals, BSTs, balanced trees and lowest common ancestors.", matchTags: ["Trees", "Tree", "Binary Tree", "BST"], requiredSolves: 5 },
          { key: "graphs", title: "Graphs", description: "BFS/DFS, topological sort, union-find and shortest paths.", matchTags: ["Graphs", "Graph", "BFS", "DFS"], requiredSolves: 5 },
          { key: "dynamic-programming", title: "Dynamic Programming", description: "Memoization, tabulation and classic DP patterns.", matchTags: ["Dynamic Programming", "DP"], requiredSolves: 6 },
          { key: "tries", title: "Tries", description: "Prefix trees for fast string lookups and autocomplete.", matchTags: ["Tries", "Trie"], requiredSolves: 3 },
        ],
      },
    ],
  },
  {
    track: "frontend",
    title: "Frontend Engineer Path",
    description:
      "From semantic HTML to scalable architecture — become a complete frontend engineer through hands-on challenges.",
    sections: [
      {
        key: "fe-beginner",
        title: "Web Fundamentals",
        tier: "Beginner",
        topics: [
          { key: "html", title: "HTML", description: "Semantic markup, forms and accessibility fundamentals.", matchTags: ["html-css", "HTML"], requiredSolves: 2 },
          { key: "css", title: "CSS", description: "Flexbox, Grid, responsive design and animations.", matchTags: ["html-css", "CSS"], requiredSolves: 3 },
          { key: "javascript", title: "JavaScript", description: "DOM manipulation, events, async patterns and ES modules.", matchTags: ["javascript", "JavaScript"], requiredSolves: 3 },
        ],
      },
      {
        key: "fe-intermediate",
        title: "Modern Frontend",
        tier: "Intermediate",
        topics: [
          { key: "react", title: "React", description: "Components, hooks, controlled forms and composition.", matchTags: ["react", "React", "react-tailwind"], requiredSolves: 3 },
          { key: "apis", title: "APIs", description: "Fetching, caching, error handling and optimistic updates.", matchTags: ["API", "APIs", "Fetch"], requiredSolves: 2 },
          { key: "state-management", title: "State Management", description: "Local vs global state, reducers and stores.", matchTags: ["State", "State Management"], requiredSolves: 2 },
        ],
      },
      {
        key: "fe-advanced",
        title: "Production Engineering",
        tier: "Advanced",
        topics: [
          { key: "nextjs", title: "Next.js", description: "Server components, routing, data fetching and rendering modes.", matchTags: ["Next.js", "nextjs"], requiredSolves: 2 },
          { key: "performance", title: "Performance", description: "Core Web Vitals, code splitting, memoization and profiling.", matchTags: ["Performance"], requiredSolves: 2 },
          { key: "architecture", title: "Architecture", description: "Design systems, folder structure and scalable patterns.", matchTags: ["Architecture"], requiredSolves: 2 },
        ],
      },
    ],
  },
];

let roadmapsEnsured = false;

export async function ensureRoadmaps(): Promise<void> {
  if (roadmapsEnsured) return;
  await connectDB();
  for (const definition of DEFAULT_ROADMAPS) {
    await Roadmap.updateOne(
      { track: definition.track },
      { $setOnInsert: definition },
      { upsert: true },
    );
  }
  roadmapsEnsured = true;
}

export interface RoadmapTopicView {
  key: string;
  title: string;
  description: string;
  requiredSolves: number;
  solves: number;
  completed: boolean;
  /** Number of published questions matching this topic (DSA only) */
  questionCount: number;
  /** Link target for practicing this topic */
  practiceHref: string;
}

export interface RoadmapView {
  track: RoadmapTrack;
  title: string;
  description: string;
  percent: number;
  completedTopics: number;
  totalTopics: number;
  sections: {
    key: string;
    title: string;
    tier: string;
    topics: RoadmapTopicView[];
  }[];
}

export async function getRoadmapView(
  track: RoadmapTrack,
  userId?: string,
): Promise<RoadmapView | null> {
  await ensureRoadmaps();
  const roadmap = await Roadmap.findOne({ track }).lean();
  if (!roadmap) return null;

  const progress = userId
    ? await Progress.findOne({
        user: new Types.ObjectId(userId),
        track,
      }).lean()
    : null;

  const topicSolves: Record<string, number> = mapToObject(
    progress?.topicSolves,
  );
  const completedTopics = new Set(progress?.completedTopics ?? []);

  // Question availability per topic (DSA links into the problems list)
  const questionCounts = new Map<string, number>();
  if (track === "dsa") {
    const counts = await Question.aggregate<{ _id: string; count: number }>([
      { $match: { isPublished: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    for (const row of counts) questionCounts.set(row._id, row.count);
  }

  let totalTopics = 0;
  const sections = roadmap.sections.map((section) => ({
    key: section.key,
    title: section.title,
    tier: section.tier,
    topics: section.topics.map((topic) => {
      totalTopics += 1;
      const matchedCount = topic.matchTags.reduce(
        (sum, tag) => sum + (questionCounts.get(tag) ?? 0),
        0,
      );
      return {
        key: topic.key,
        title: topic.title,
        description: topic.description,
        requiredSolves: topic.requiredSolves,
        solves: Math.min(topicSolves[topic.key] ?? 0, topic.requiredSolves),
        completed: completedTopics.has(topic.key),
        questionCount: matchedCount,
        practiceHref:
          track === "dsa"
            ? `/problems?category=${encodeURIComponent(topic.matchTags[0] ?? "")}`
            : `/challenges?tech=${encodeURIComponent(topic.matchTags[0] ?? "")}`,
      };
    }),
  }));

  return {
    track,
    title: roadmap.title,
    description: roadmap.description,
    percent: progress?.percent ?? 0,
    completedTopics: completedTopics.size,
    totalTopics,
    sections,
  };
}
