import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { cached } from "@/lib/redis";
import { Question } from "@/models";

/** Published question counts per category (powers the Problems chips row) */
export async function GET() {
  await connectDB();
  const categories = await cached("questions:categories", 60, async () => {
    const rows = await Question.aggregate<{ _id: string; count: number }>([
      { $match: { isPublished: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
    ]);
    return rows.map((row) => ({ category: row._id, count: row.count }));
  });
  return NextResponse.json({ categories });
}
