import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Question, FrontendChallenge, Company } from "@/models";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limited = await enforceRateLimit("api", req);
  if (limited) return limited;

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) {
    return NextResponse.json({ questions: [], challenges: [], companies: [] });
  }

  await connectDB();
  const regex = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

  const [questions, challenges, companies] = await Promise.all([
    Question.find({
      isPublished: true,
      $or: [{ title: regex }, { tags: regex }, { category: regex }],
    })
      .limit(6)
      .select("slug title difficulty category")
      .lean(),
    FrontendChallenge.find({
      isPublished: true,
      $or: [{ title: regex }, { tags: regex }],
    })
      .limit(4)
      .select("slug title difficulty")
      .lean(),
    Company.find({ name: regex }).limit(4).select("slug name").lean(),
  ]);

  return NextResponse.json({
    questions: questions.map((doc) => ({
      slug: doc.slug,
      title: doc.title,
      difficulty: doc.difficulty,
      category: doc.category,
    })),
    challenges: challenges.map((doc) => ({
      slug: doc.slug,
      title: doc.title,
      difficulty: doc.difficulty,
    })),
    companies: companies.map((doc) => ({ slug: doc.slug, name: doc.name })),
  });
}
