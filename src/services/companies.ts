import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { COMPANIES } from "@/lib/constants";
import { Company, Question, Submission } from "@/models";
import { slugify } from "@/lib/slug";

const COMPANY_DESCRIPTIONS: Record<string, string> = {
  Google: "Algorithm-heavy interviews with emphasis on optimal solutions and system design.",
  Amazon: "Leadership principles meet practical coding — expect arrays, trees and OOD.",
  Microsoft: "Balanced mix of DSA fundamentals, strings and dynamic programming.",
  Meta: "Speed matters — graphs, recursion and product-minded problem solving.",
  Netflix: "Senior-leaning interviews focused on real-world engineering problems.",
  Uber: "Maps, graphs and geospatial flavored questions with scaling twists.",
  Atlassian: "Collaborative coding rounds with data structures and API design.",
};

let companiesEnsured = false;

export async function ensureDefaultCompanies(): Promise<void> {
  if (companiesEnsured) return;
  await connectDB();
  for (const name of COMPANIES) {
    await Company.updateOne(
      { name },
      {
        $setOnInsert: {
          name,
          slug: slugify(name),
          description: COMPANY_DESCRIPTIONS[name] ?? "",
          logo: "building-2",
        },
      },
      { upsert: true },
    );
  }
  companiesEnsured = true;
}

export interface CompanyListItem {
  slug: string;
  name: string;
  description: string;
  questionCount: number;
  solvedCount: number;
}

export async function listCompaniesWithProgress(
  userId?: string,
): Promise<CompanyListItem[]> {
  await ensureDefaultCompanies();

  const [companies, questionCounts] = await Promise.all([
    Company.find().sort({ name: 1 }).lean(),
    Question.aggregate<{ _id: string; count: number; ids: Types.ObjectId[] }>([
      { $match: { isPublished: true } },
      { $unwind: "$companies" },
      {
        $group: {
          _id: "$companies",
          count: { $sum: 1 },
          ids: { $push: "$_id" },
        },
      },
    ]),
  ]);

  const solvedIds = userId
    ? new Set(
        (
          await Submission.distinct("question", {
            user: new Types.ObjectId(userId),
            kind: "dsa",
            status: "Accepted",
          })
        ).map(String),
      )
    : new Set<string>();

  const countMap = new Map(questionCounts.map((row) => [row._id, row]));

  return companies.map((company) => {
    const row = countMap.get(company.name);
    const solvedCount = row
      ? row.ids.filter((id) => solvedIds.has(id.toString())).length
      : 0;
    return {
      slug: company.slug,
      name: company.name,
      description: company.description,
      questionCount: row?.count ?? 0,
      solvedCount,
    };
  });
}

export async function getCompanyBySlug(slug: string) {
  await ensureDefaultCompanies();
  return Company.findOne({ slug }).lean();
}
