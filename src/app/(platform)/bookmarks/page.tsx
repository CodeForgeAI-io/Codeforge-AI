import { Bookmark } from "@/components/icons";
import { BookmarksList } from "@/features/bookmarks/bookmarks-list";

export const metadata = { title: "Bookmarks" };

export default function BookmarksPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <Bookmark className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Bookmarks</h1>
          <p className="text-sm text-muted-foreground">Your saved problems and challenges</p>
        </div>
      </div>
      <BookmarksList />
    </div>
  );
}
