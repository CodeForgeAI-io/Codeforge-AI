import {
  Building2,
  Code2,
  LayoutDashboard,
  Map,
  MonitorPlay,
  Paintbrush,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Problems", href: "/problems", icon: Code2 },
  { title: "Generate", href: "/generate", icon: Sparkles },
  { title: "Challenges", href: "/challenges", icon: Paintbrush },
  { title: "Roadmaps", href: "/roadmaps", icon: Map },
  { title: "Contests", href: "/contests", icon: Trophy },
  { title: "Companies", href: "/companies", icon: Building2 },
  { title: "Interview", href: "/interview", icon: MonitorPlay },
  { title: "Leaderboard", href: "/leaderboard", icon: Users },
];

/** Subset shown in the mobile bottom navigation */
export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) =>
  ["/dashboard", "/problems", "/challenges", "/contests", "/roadmaps"].includes(
    item.href,
  ),
);
