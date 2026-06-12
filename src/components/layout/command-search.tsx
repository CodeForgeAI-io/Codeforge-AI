"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { create } from "zustand";
import { useQuery } from "@tanstack/react-query";
import { Building2, Code2, Paintbrush } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

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
  const [query, setQuery] = useState("");

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
        <CommandEmpty>
          {query.length < 2 ? "Type at least 2 characters" : "No results found"}
        </CommandEmpty>
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
      </CommandList>
    </CommandDialog>
  );
}
