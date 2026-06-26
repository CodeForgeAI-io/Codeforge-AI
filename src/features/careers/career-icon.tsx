import { Code2, TrendingUp, ShieldCheck } from "@/components/icons";

const MAP = { Code2, TrendingUp, ShieldCheck };

export function CareerIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name as keyof typeof MAP] ?? Code2;
  return <Icon className={className} />;
}
