import { Brain } from "lucide-react";
import { RevisionPanel } from "@/features/revision/revision-panel";

export const metadata = { title: "Smart Revision" };

export default function RevisionPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Brain className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Smart Revision</h1>
          <p className="text-sm text-muted-foreground">Spaced repetition — review at the perfect moment</p>
        </div>
      </div>
      <RevisionPanel />
    </div>
  );
}
