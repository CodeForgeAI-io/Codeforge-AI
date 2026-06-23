"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { create } from "zustand";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Bookmark,
  Building2,
  Code2,
  LayoutDashboard,
  Map,
  Moon,
  NotebookPen,
  Paintbrush,
  Sparkles,
  Sun,
  Trophy,
  Users,
} from "@/components/icons";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Code2, label: "Problems", href: "/problems" },
  { icon: Trophy, label: "Contests", href: "/contests" },
  { icon: Map, label: "Roadmaps", href: "/roadmaps" },
  { icon: Sparkles, label: "AI Tools", href: "/ai-tools" },
  { icon: BarChart3, label: "Leaderboard", href: "/leaderboard" },
  { icon: Users, label: "Forum", href: "/forum" },
  { icon: Bookmark, label: "Bookmarks", href: "/bookmarks" },
  { icon: NotebookPen, label: "Notes", href: "/notes" },
  { icon: Building2, label: "Companies", href: "/companies" },
];

interface CommandSearchState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useCommandSearch = create<CommandSearchState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));

export interface SearchResults {
  questions: {
    slug: string;
    title: string;
    difficulty: string;
    category: string;
  }[];
  challenges: { slug: string; title: string; difficulty: string }[];
  companies: { slug: string; name: string }[];
}

export function CommandSearch() {
  const { open, setOpen } = useCommandSearch();
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [query, setQuery] = useState("");
  const navMatches = NAV.filter((n) =>
    n.label.toLowerCase().includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!useCommandSearch.getState().open);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setOpen]);

  const { data } = useQuery<SearchResults>({
    queryKey: ["global-search", query],
    queryFn: async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: open && query.length >= 2,
  });

  function go(href: string) {
    setOpen(false);
    setQuery("");
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
      <CommandInput
        placeholder="Search problems, challenges, companies..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found</CommandEmpty>
        {!!data?.questions?.length && (
          <CommandGroup heading="Problems">
            {data.questions.map((q) => (
              <CommandItem
                key={q.slug}
                value={`question-${q.slug}`}
                onSelect={() => go(`/problems/${q.slug}`)}
              >
                <Code2 className="size-4" />
                <span className="flex-1 truncate">{q.title}</span>
                <Badge variant="outline" className="text-[10px]">
                  {q.difficulty}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!!data?.challenges?.length && (
          <CommandGroup heading="Frontend Challenges">
            {data.challenges.map((c) => (
              <CommandItem
                key={c.slug}
                value={`challenge-${c.slug}`}
                onSelect={() => go(`/challenges/${c.slug}`)}
              >
                <Paintbrush className="size-4" />
                <span className="flex-1 truncate">{c.title}</span>
                <Badge variant="outline" className="text-[10px]">
                  {c.difficulty}
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!!data?.companies?.length && (
          <CommandGroup heading="Companies">
            {data.companies.map((c) => (
              <CommandItem
                key={c.slug}
                value={`company-${c.slug}`}
                onSelect={() => go(`/companies/${c.slug}`)}
              >
                <Building2 className="size-4" />
                {c.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {navMatches.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Go to">
              {navMatches.map((n) => (
                <CommandItem key={n.href} value={`nav-${n.label}`} onSelect={() => go(n.href)}>
                  <n.icon className="size-4" />
                  {n.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem
            value="toggle-theme"
            onSelect={() => {
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
              setOpen(false);
            }}
          >
            {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            Toggle theme
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
