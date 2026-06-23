"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CircleDollarSign,
  Code2,
  FileQuestion,
  Loader2,
  Trophy,
  Users,
} from "@/components/icons";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Analytics {
  totals: {
    users: number;
    newUsers30d: number;
    questions: number;
    publishedQuestions: number;
    challenges: number;
    contests: number;
    submissions: number;
    acceptanceRate: number;
  };
  signupSeries: { date: string; signups: number }[];
  submissionSeries: { date: string; submissions: number; accepted: number }[];
  languageDistribution: { language: string; count: number }[];
  difficultyAcceptance: {
    difficulty: string;
    total: number;
    accepted: number;
    rate: number;
  }[];
}

export function AnalyticsDashboard() {
  const { data, isLoading } = useQuery<Analytics>({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/analytics");
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <TotalCard
          icon={<Users className="size-4 text-primary" />}
          label="Users"
          value={data.totals.users}
          sub={`+${data.totals.newUsers30d} in 30 days`}
        />
        <TotalCard
          icon={<FileQuestion className="size-4 text-success" />}
          label="Questions"
          value={data.totals.questions}
          sub={`${data.totals.publishedQuestions} published`}
        />
        <TotalCard
          icon={<Code2 className="size-4 text-medium" />}
          label="Submissions"
          value={data.totals.submissions}
          sub={`${data.totals.acceptanceRate}% acceptance`}
        />
        <TotalCard
          icon={<Trophy className="size-4 text-warning" />}
          label="Contests"
          value={data.totals.contests}
          sub={`${data.totals.challenges} frontend challenges`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Signups (30 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.signupSeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" hide />
                <YAxis allowDecimals={false} width={28} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="signups"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.25}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Submissions (30 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.submissionSeries}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" hide />
                <YAxis allowDecimals={false} width={28} fontSize={11} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="submissions" fill="var(--chart-1)" radius={3} />
                <Bar dataKey="accepted" fill="var(--chart-2)" radius={3} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Language distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {data.languageDistribution.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No submissions yet.
              </p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {data.languageDistribution.map((entry) => (
                  <li
                    key={entry.language}
                    className="flex items-center justify-between"
                  >
                    <span className="capitalize">{entry.language}</span>
                    <Badge variant="secondary">{entry.count}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Acceptance by difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            {data.difficultyAcceptance.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">
                No submissions yet.
              </p>
            ) : (
              <ul className="space-y-1.5 text-sm">
                {data.difficultyAcceptance.map((entry) => (
                  <li
                    key={entry.difficulty}
                    className="flex items-center justify-between"
                  >
                    <span>{entry.difficulty}</span>
                    <span className="text-xs text-muted-foreground">
                      {entry.accepted}/{entry.total} ({entry.rate}%)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <CircleDollarSign className="size-4 text-muted-foreground" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-muted-foreground">$0</p>
            <p className="mt-1 text-xs text-muted-foreground">
              No payment provider connected. Hook up Stripe or another
              processor to start tracking revenue here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TotalCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="mt-1 text-2xl font-semibold">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
