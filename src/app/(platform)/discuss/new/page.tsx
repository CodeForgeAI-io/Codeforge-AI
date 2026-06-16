import { NewDiscussionForm } from "@/features/discussions/new-discussion-form";

export const metadata = { title: "New Discussion" };

export default async function NewDiscussPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <h1 className="text-xl font-bold">New Discussion</h1>
      <NewDiscussionForm questionId={q} />
    </div>
  );
}
