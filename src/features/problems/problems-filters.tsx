"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "@/components/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COMPANIES, DIFFICULTIES, QUESTION_CATEGORIES } from "@/lib/constants";

const ALL = "all";

interface FilterSelectProps {
  param: string;
  placeholder: string;
  options: readonly string[];
  className?: string;
}

export function ProblemsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== ALL) params.set(key, value);
      else params.delete(key);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  // Debounced text search
  useEffect(() => {
    const handle = setTimeout(() => {
      if ((searchParams.get("q") ?? "") !== search) {
        setParam("q", search || null);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [search, setParam, searchParams]);

  function FilterSelect({ param, placeholder, options, className }: FilterSelectProps) {
    return (
      <Select
        value={searchParams.get(param) ?? ALL}
        onValueChange={(value) => setParam(param, value)}
      >
        <SelectTrigger className={className} size="sm">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  const hasFilters =
    ["q", "difficulty", "category", "company", "status"].some((key) =>
      searchParams.get(key),
    ) || search.length > 0;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search problems..."
          className="h-8 pl-8"
        />
      </div>
      <FilterSelect
        param="difficulty"
        placeholder="Difficulty"
        options={DIFFICULTIES}
      />
      <FilterSelect
        param="category"
        placeholder="Category"
        options={QUESTION_CATEGORIES}
        className="max-w-44"
      />
      <FilterSelect param="company" placeholder="Company" options={COMPANIES} />
      <Select
        value={searchParams.get("status") ?? ALL}
        onValueChange={(value) => setParam("status", value)}
      >
        <SelectTrigger size="sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Status</SelectItem>
          <SelectItem value="solved">Solved</SelectItem>
          <SelectItem value="attempted">Attempted</SelectItem>
          <SelectItem value="todo">Unsolved</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearch("");
            router.replace(pathname, { scroll: false });
          }}
        >
          <X className="size-4" /> Clear
        </Button>
      )}
    </div>
  );
}
