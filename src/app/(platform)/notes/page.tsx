import { StickyNote } from "lucide-react";
import { NotesPanel } from "@/features/notes/notes-panel";

export const metadata = { title: "My Notes" };

export default function NotesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <StickyNote className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">My Notes</h1>
          <p className="text-sm text-muted-foreground">Personal notes with Markdown support</p>
        </div>
      </div>
      <div className="h-[600px] rounded-xl border">
        <NotesPanel />
      </div>
    </div>
  );
}
