import type { Metadata } from "next";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { getRecentDiscussions, countDiscussions } from "@/services/discussions-store";
import { countActiveMembers } from "@/services/user-store";
import { getLeaderboard } from "@/services/stats";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowRight,
  ArrowUpRight,
  Bookmark,
  Flame,
  Globe,
  MessageSquare,
  Trophy,
  Users,
} from "@/components/icons";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Community" };
export const dynamic = "force-dynamic";

const FEATURES = [
  { href: "/forum", icon: Globe, title: "Forum", desc: "Open discussions, announcements & help threads." },
  { href: "/discuss", icon: MessageSquare, title: "Discussions", desc: "Problem solutions, questions & approaches." },
  { href: "/leaderboard", icon: Trophy, title: "Leaderboard", desc: "Top coders ranked by XP earned." },
  { href: "/bookmarks", icon: Bookmark, title: "Bookmarks", desc: "Save problems & threads for later." },
] as const;

const KIND_LABEL: Record<string, string> = {
  discussion: "Discussion",
  solution: "Solution",
  question: "Question",
};

type RecentDiscussion = {
  _id: { toString(): string };
  title: string;
  kind: keyof typeof KIND_LABEL;
  createdAt: Date;
  upvotes: unknown[];
  author: { username: string; name: string; image: string | null } | null;
};

export default async function CommunityPage() {
  const [topMembers, recentRaw, memberCount, discussionCount] = await Promise.all([
    getLeaderboard(5),
    getRecentDiscussions(6),
    countActiveMembers(),
    countDiscussions(),
  ]);
  const recent = recentRaw as unknown as RecentDiscussion[];

  const stats = [
    { label: "Members", value: memberCount, icon: Users },
    { label: "Discussions", value: discussionCount, icon: MessageSquare },
    { label: "Top streak", value: topMembers[0]?.streak ?? 0, icon: Flame },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {/* header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
            <Users className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Community</h1>
            <p className="text-sm text-muted-foreground">
              Forums, discussions, leaderboards and the people behind them.
            </p>
          </div>
        </div>

        {/* stats */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border bg-card p-4">
              <s.icon className="size-4 text-muted-foreground" />
              <p className="mt-2 text-2xl font-semibold tabular-nums">{s.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* feature cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="group flex h-full flex-col rounded-xl border bg-card p-4 transition-colors hover:bg-accent/50"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              <f.icon className="size-4.5 text-primary" />
            </span>
            <span className="mt-3 flex items-center gap-1 text-sm font-semibold">
              {f.title}
              <ArrowRight className="size-3.5 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
            </span>
            <span className="mt-1 text-xs leading-relaxed text-muted-foreground">{f.desc}</span>
          </Link>
        ))}
      </div>

      {/* recent + top members */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* recent discussions */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent discussions</h2>
            <Link href="/discuss" className="text-xs text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="rounded-xl border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
              No discussions yet. Start the first one!
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-card">
              {recent.map((d, i) => (
                <Link
                  key={d._id.toString()}
                  href={`/discuss/${d._id.toString()}`}
                  className={cn(
                    "group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-accent/50",
                    i !== 0 && "border-t",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{d.title}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {KIND_LABEL[d.kind] ?? "Discussion"}
                      </span>
                      <span>{d.author?.name ?? d.author?.username ?? "Someone"}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(new Date(d.createdAt), { addSuffix: true })}</span>
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                    <ArrowUpRight className="size-3.5" />
                    {d.upvotes?.length ?? 0}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* top members */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Top members</h2>
            <Link href="/leaderboard" className="text-xs text-muted-foreground hover:text-foreground">
              Leaderboard
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border bg-card">
            {topMembers.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-muted-foreground">No members yet.</p>
            ) : (
              topMembers.map((m, i) => (
                <Link
                  key={m.username}
                  href={`/profile/${m.username}`}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/50",
                    i !== 0 && "border-t",
                  )}
                >
                  <span className="w-4 text-center text-xs font-semibold text-muted-foreground tabular-nums">
                    {m.rank}
                  </span>
                  <Avatar className="size-8">
                    <AvatarImage src={m.image ?? undefined} alt={m.name} />
                    <AvatarFallback className="text-xs">
                      {(m.name || m.username).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.name || m.username}</p>
                    <p className="text-xs text-muted-foreground">Level {m.level}</p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold tabular-nums text-primary">
                    {m.xp.toLocaleString()} XP
                  </span>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
