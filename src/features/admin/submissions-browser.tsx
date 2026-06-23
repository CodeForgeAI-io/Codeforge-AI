"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SUBMISSION_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ALL = "all";

interface AdminSubmission {
  id: string;
  kind: string;
  status: string;
  language: string | null;
  passedCount: number;
  totalCount: number;
  runtimeMs: number | null;
  createdAt: string;
  user: { name: string; username: string } | null;
  target: { title: string; href: string } | null;
}

export function SubmissionsBrowser() {
  const [status, setStatus] = useState(ALL);

  const { data, isLoading } = useQuery<{ submissions: AdminSubmission[] }>({
    queryKey: ["admin-submissions", status],
    queryFn: async () => {
      const params = status !== ALL ? `?status=${encodeURIComponent(status)}` : "";
      const res = await fetch(`/api/admin/submissions${params}`);
      if (!res.ok) throw new Error("Failed to load submissions");
      return res.json();
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Latest 100 submissions, refreshed every 30s.
        </p>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger size="sm" className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {SUBMISSION_STATUSES.map((entry) => (
              <SelectItem key={entry} value={entry}>
                {entry}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : !data?.submissions.length ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No submissions match this filter yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Problem / Challenge</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Lang</TableHead>
                <TableHead>Tests</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.submissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell>
                    {submission.user ? (
                      <Link
                        href={`/profile/${submission.user.username}`}
                        className="hover:underline"
                      >
                        {submission.user.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">deleted</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-56">
                    {submission.target ? (
                      <Link
                        href={submission.target.href}
                        className="block truncate hover:underline"
                      >
                        {submission.target.title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">removed</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        submission.status === "Accepted"
                          ? "text-success"
                          : "text-destructive",
                      )}
                    >
                      {submission.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    {submission.language ? (
                      <Badge variant="outline" className="text-[10px]">
                        {submission.language}
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">
                        {submission.kind}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {submission.passedCount}/{submission.totalCount}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(submission.createdAt), "MMM d, HH:mm")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
