import { ListChecks } from "@/components/icons";
import { LearningTracks } from "@/features/tracks/learning-tracks";

export const metadata = { title: "Learning Tracks" };

export default function TracksPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
          <ListChecks className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Learning Tracks</h1>
          <p className="text-sm text-muted-foreground">Structured paths: Blind 75, NeetCode 150, FAANG & more</p>
        </div>
      </div>
      <LearningTracks />
    </div>
  );
}
