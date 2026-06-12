import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/api-auth";
import { PromptTemplate } from "@/models";
import { DEFAULT_PROMPTS } from "@/services/ai/prompts";

const upsertSchema = z.object({
  key: z.string().min(1).max(60),
  template: z.string().min(10).max(20_000),
  temperature: z.coerce.number().min(0).max(2),
  maxTokens: z.coerce.number().int().min(64).max(32_768),
});

/** Admin: all prompt templates (code defaults merged with DB overrides) */
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await connectDB();
  const overrides = await PromptTemplate.find().lean();
  const overrideMap = new Map(overrides.map((entry) => [entry.key, entry]));

  const prompts = Object.entries(DEFAULT_PROMPTS).map(([key, fallback]) => {
    const override = overrideMap.get(key);
    return {
      key,
      name: fallback.name,
      description: fallback.description,
      template: override?.template ?? fallback.template,
      temperature: override?.temperature ?? fallback.temperature,
      maxTokens: override?.maxTokens ?? fallback.maxTokens,
      overridden: !!override,
    };
  });

  return NextResponse.json({ prompts });
}

/** Admin: override a prompt template */
export async function PUT(req: NextRequest) {
  const { session, error } = await requireAdmin();
  if (error) return error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const fallback = DEFAULT_PROMPTS[parsed.data.key];
  if (!fallback) {
    return NextResponse.json({ error: "Unknown prompt key" }, { status: 404 });
  }

  await connectDB();
  await PromptTemplate.updateOne(
    { key: parsed.data.key },
    {
      $set: {
        template: parsed.data.template,
        temperature: parsed.data.temperature,
        maxTokens: parsed.data.maxTokens,
        name: fallback.name,
        description: fallback.description,
        updatedBy: session.user.id,
      },
    },
    { upsert: true },
  );

  return NextResponse.json({ ok: true });
}

/** Admin: reset a prompt back to the code default */
export async function DELETE(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const key = req.nextUrl.searchParams.get("key");
  if (!key) {
    return NextResponse.json({ error: "key is required" }, { status: 400 });
  }

  await connectDB();
  await PromptTemplate.deleteOne({ key });
  return NextResponse.json({ ok: true });
}
