import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { cached } from "@/lib/redis";
import {
  Contest,
  FrontendChallenge,
  Question,
  Submission,
  Subscription,
  User,
} from "@/models";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();

  const data = await cached("admin:analytics", 60, async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
    const monthStart = new Date(new Date().toISOString().slice(0, 7) + "-01T00:00:00.000Z");

    const [
      totalUsers,
      newUsers30d,
      totalQuestions,
      publishedQuestions,
      totalChallenges,
      totalContests,
      totalSubmissions,
      acceptedSubmissions,
      signupSeries,
      submissionSeries,
      languageDistribution,
      difficultyAcceptance,
      revenueAgg,
      revenueMonthAgg,
      payingUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Question.countDocuments(),
      Question.countDocuments({ isPublished: true }),
      FrontendChallenge.countDocuments(),
      Contest.countDocuments(),
      Submission.countDocuments(),
      Submission.countDocuments({ status: "Accepted" }),
      User.aggregate<{ _id: string; count: number }>([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Submission.aggregate<{ _id: string; count: number; accepted: number }>([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            accepted: {
              $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Submission.aggregate<{ _id: string; count: number }>([
        { $match: { language: { $exists: true, $ne: null } } },
        { $group: { _id: "$language", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 12 },
      ]),
      Submission.aggregate<{ _id: string; total: number; accepted: number }>([
        { $match: { kind: "dsa", question: { $exists: true } } },
        {
          $lookup: {
            from: "questions",
            localField: "question",
            foreignField: "_id",
            as: "questionDoc",
          },
        },
        { $unwind: "$questionDoc" },
        {
          $group: {
            _id: "$questionDoc.difficulty",
            total: { $sum: 1 },
            accepted: {
              $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] },
            },
          },
        },
      ]),
      // Razorpay revenue (all paid subscriptions/invoices)
      Subscription.aggregate<{ total: number; count: number; currency: string }>([
        { $match: { status: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 }, currency: { $last: "$currency" } } },
      ]),
      Subscription.aggregate<{ total: number }>([
        { $match: { status: "paid", createdAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      User.countDocuments({ plan: { $in: ["go", "plus"] } }),
    ]);

    return {
      totals: {
        users: totalUsers,
        newUsers30d,
        questions: totalQuestions,
        publishedQuestions,
        challenges: totalChallenges,
        contests: totalContests,
        submissions: totalSubmissions,
        acceptanceRate:
          totalSubmissions > 0
            ? Math.round((acceptedSubmissions / totalSubmissions) * 100)
            : 0,
      },
      signupSeries: signupSeries.map((row) => ({
        date: row._id,
        signups: row.count,
      })),
      submissionSeries: submissionSeries.map((row) => ({
        date: row._id,
        submissions: row.count,
        accepted: row.accepted,
      })),
      languageDistribution: languageDistribution.map((row) => ({
        language: row._id,
        count: row.count,
      })),
      difficultyAcceptance: difficultyAcceptance.map((row) => ({
        difficulty: row._id,
        total: row.total,
        accepted: row.accepted,
        rate: row.total > 0 ? Math.round((row.accepted / row.total) * 100) : 0,
      })),
      revenue: {
        total: revenueAgg[0]?.total ?? 0,
        thisMonth: revenueMonthAgg[0]?.total ?? 0,
        payments: revenueAgg[0]?.count ?? 0,
        payingUsers,
        currency: revenueAgg[0]?.currency ?? "INR",
      },
    };
  });

  return NextResponse.json(data);
}
