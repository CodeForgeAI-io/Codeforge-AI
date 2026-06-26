import {
  Rocket,
  Layers,
  Sparkles,
  Code2,
  BookOpen,
  CreditCard,
  HelpCircle,
} from "@/components/icons";

const MAP = { Rocket, Layers, Sparkles, Code2, BookOpen, CreditCard, HelpCircle };

export function CategoryIcon({ name, className }: { name: string; className?: string }) {
  const Icon = MAP[name as keyof typeof MAP] ?? Layers;
  return <Icon className={className} />;
}
