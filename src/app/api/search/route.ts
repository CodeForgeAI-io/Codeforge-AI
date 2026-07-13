import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Question, FrontendChallenge, Company } from "@/models";
import { enforceRateLimit } from "@/lib/rate-limit";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { backendFor } from "@/lib/data-backend";

export async function GET(req: NextRequest) {
  const limited = await enforceRateLimit("api", req);
  if (limited) return limited;

  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) {
    return NextResponse.json({ questions: [], challenges: [], companies: [] });
  }

  if (backendFor("questions") === "supabase") {
    const sb = supabaseAdmin();
    const like = `%${q}%`;
    const [qRes, cRes, coRes] = await Promise.all([
      sb.from("questions").select("slug,title,difficulty,category").eq("is_published", true)
        .or(`title.ilike.${like},category.ilike.${like}`).limit(6),
      sb.from("frontend_challenges").select("slug,title,difficulty").eq("is_published", true)
        .ilike("title", like).limit(4),
      sb.from("companies").select("slug,name").ilike("name", like).limit(4),
    ]);
    return NextResponse.json({
      questions: ((qRes.data ?? []) as { slug: string; title: string; difficulty: string; category: string }[]).map((d) => ({
        slug: d.slug, title: d.title, difficulty: d.difficulty, category: d.category,
      })),
      challenges: ((cRes.data ?? []) as { slug: string; title: string; difficulty: string }[]).map((d) => ({
        slug: d.slug, title: d.title, difficulty: d.difficulty,
      })),
      companies: ((coRes.data ?? []) as { slug: string; name: string }[]).map((d) => ({ slug: d.slug, name: d.name })),
    });
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
