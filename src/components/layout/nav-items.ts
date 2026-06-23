import {
  Bookmark,
  BarChart3,
  Brain,
  Building2,
  Code2,
  Globe,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Map,
  Medal,
  MessageSquare,
  MonitorPlay,
  Paintbrush,
  Sparkles,
  StickyNote,
  Terminal,
  Trophy,
  Users,
  type LucideIcon,
} from "@/components/icons";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  group?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Main" },
  { title: "Problems", href: "/problems", icon: Code2, group: "Main" },
  { title: "Compiler", href: "/compiler", icon: Terminal, group: "Main" },
  { title: "Generate", href: "/generate", icon: Sparkles, group: "Main" },
  { title: "Challenges", href: "/challenges", icon: Paintbrush, group: "Main" },
  { title: "Roadmaps", href: "/roadmaps", icon: Map, group: "Main" },
  { title: "Contests", href: "/contests", icon: Trophy, group: "Main" },
  { title: "Companies", href: "/companies", icon: Building2, group: "Main" },
  { title: "Interview", href: "/interview", icon: MonitorPlay, group: "Main" },
  { title: "Leaderboard", href: "/leaderboard", icon: Medal, group: "Main" },
  { title: "Community", href: "/community", icon: Users, group: "Community" },
  { title: "Discuss", href: "/discuss", icon: MessageSquare, group: "Community" },
  { title: "Forum", href: "/forum", icon: Globe, group: "Community" },
  { title: "Bookmarks", href: "/bookmarks", icon: Bookmark, group: "Community" },
  { title: "My Notes", href: "/notes", icon: StickyNote, group: "Community" },
  { title: "Tracks", href: "/tracks", icon: ListChecks, group: "Learning" },
  { title: "Weakness", href: "/weakness", icon: BarChart3, group: "Learning" },
  { title: "Revision", href: "/revision", icon: Brain, group: "Learning" },
  { title: "Analytics", href: "/analytics", icon: LineChart, group: "Learning" },
  { title: "AI Tools", href: "/ai-tools", icon: Sparkles, group: "AI" },
];

const byHref = (href: string): NavItem => {
  const item = NAV_ITEMS.find((i) => i.href === href);
  if (!item) throw new Error(`nav-items: no NAV_ITEM for ${href}`);
  return item;
};

/** Primary items pinned in the mobile bottom navigation bar (in display order). */
export const MOBILE_NAV_ITEMS: NavItem[] = [
  "/dashboard",
  "/problems",
  "/challenges",
  "/compiler",
].map(byHref);

/** Items revealed by the "More" button in the mobile bottom navigation. */
export const MOBILE_MORE_ITEMS: NavItem[] = [
  "/roadmaps",
  "/contests",
].map(byHref);

/** AI tools — rendered as a submenu under "AI Tools" → /ai-tools?tool=<tool>. */
export const AI_TOOLS: { label: string; tool: string }[] = [
  { label: "Learning Coach", tool: "coach" },
  { label: "Pair Programmer", tool: "pair" },
  { label: "Study Planner", tool: "study" },
  { label: "Complexity", tool: "complexity" },
  { label: "Code Review", tool: "code" },
  { label: "Roadmap", tool: "roadmap" },
  { label: "Contest Gen", tool: "contest" },
  { label: "Resume", tool: "resume" },
  { label: "Project Review", tool: "project" },
];
