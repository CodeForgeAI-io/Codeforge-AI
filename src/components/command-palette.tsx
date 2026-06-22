"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  BarChart3,
  Bookmark,
  Building2,
  Code2,
  LayoutDashboard,
  Map,
  Moon,
  NotebookPen,
  Sparkles,
  Sun,
  Trophy,
  Users,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";

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

interface SearchResults {
  questions: { slug: string; title: string; difficulty: string; category: string }[];
  challenges: { slug: string; title: string; difficulty: string }[];
  companies: { slug: string; name: string }[];
}

const EMPTY: SearchResults = { questions: [], challenges: [], companies: [] };

export function CommandPalette() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // ⌘K / Ctrl+K toggles the palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // debounced live search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (res.ok) setResults((await res.json()) as SearchResults);
        else setResults(EMPTY);
      } catch {
        /* aborted or offline — ignore */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  const hasResults =
    results.questions.length > 0 || results.challenges.length > 0 || results.companies.length > 0;

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      shouldFilter={false}
      title="Command palette"
      description="Search problems and jump anywhere"
    >
      <CommandInput placeholder="Search problems, or jump to a page…" value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>{loading ? "Searching…" : "No results found."}</CommandEmpty>

        {results.questions.length > 0 && (
          <CommandGroup heading="Problems">
            {results.questions.map((q) => (
              <CommandItem key={q.slug} value={`q-${q.slug}`} onSelect={() => go(`/problems/${q.slug}`)}>
                <Code2 className="size-4 text-muted-foreground" />
                <span className="flex-1 truncate">{q.title}</span>
                <DifficultyBadge difficulty={q.difficulty} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.challenges.length > 0 && (
          <CommandGroup heading="Frontend challenges">
            {results.challenges.map((c) => (
              <CommandItem key={c.slug} value={`c-${c.slug}`} onSelect={() => go(`/challenges/${c.slug}`)}>
                <Sparkles className="size-4 text-muted-foreground" />
                <span className="flex-1 truncate">{c.title}</span>
                <DifficultyBadge difficulty={c.difficulty} />
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.companies.length > 0 && (
          <CommandGroup heading="Companies">
            {results.companies.map((co) => (
              <CommandItem key={co.slug} value={`co-${co.slug}`} onSelect={() => go(`/companies/${co.slug}`)}>
                <Building2 className="size-4 text-muted-foreground" />
                <span className="flex-1 truncate">{co.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {hasResults && <CommandSeparator />}

        <CommandGroup heading="Go to">
          {NAV.filter((n) => n.label.toLowerCase().includes(query.trim().toLowerCase())).map((n) => (
            <CommandItem key={n.href} value={`nav-${n.label}`} onSelect={() => go(n.href)}>
              <n.icon className="size-4 text-muted-foreground" />
              {n.label}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Actions">
          <CommandItem
            value="toggle-theme"
            onSelect={() => {
              setTheme(resolvedTheme === "dark" ? "light" : "dark");
              setOpen(false);
            }}
          >
            {resolvedTheme === "dark" ? <Sun className="size-4 text-muted-foreground" /> : <Moon className="size-4 text-muted-foreground" />}
            Toggle theme
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
