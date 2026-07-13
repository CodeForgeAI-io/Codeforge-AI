import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { cached } from "@/lib/redis";
import { Question } from "@/models";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";

/** Published question counts per category (powers the Problems chips row) */
export async function GET() {
  const categories = await cached("questions:categories", 60, async () => {
    if (backendFor("questions") === "supabase") {
      const { data } = await supabaseAdmin()
        .from("questions")
        .select("category")
        .eq("is_published", true);
      const counts = new Map<string, number>();
      for (const r of (data ?? []) as { category: string }[]) {
        counts.set(r.category, (counts.get(r.category) ?? 0) + 1);
      }
      return [...counts.entries()]
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
    }
    await connectDB();
    const rows = await Question.aggregate<{ _id: string; count: number }>([
      { $match: { isPublished: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]);
    return rows.map((row) => ({ category: row._id, count: row.count }));
  });
  return NextResponse.json({ categories });
}
