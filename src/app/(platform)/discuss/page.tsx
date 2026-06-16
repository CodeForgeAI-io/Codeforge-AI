import { MessageSquare } from "lucide-react";
import { DiscussionList } from "@/features/discussions/discussion-list";

export const metadata = { title: "Discussion Forum" };

export default function DiscussPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <MessageSquare className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Discussion Forum</h1>
          <p className="text-sm text-muted-foreground">Community discussions, solutions & questions</p>
        </div>
      </div>
      <DiscussionList />
    </div>
  );
}
