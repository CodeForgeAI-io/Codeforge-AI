import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { requireUser } from "@/lib/api-auth";
import { enforceAiCredit } from "@/services/ai-credits";
import { enforceRateLimit } from "@/lib/rate-limit";
import { AiChat, FrontendChallenge, Question } from "@/models";
import { aiChatRequestSchema } from "@/schemas/ai";
import {
  isAiConfigured,
  streamCompletion,
  type ChatMessage,
} from "@/services/ai/groq";
import { getPrompt } from "@/services/ai/prompts";
import { isOnTopic, OFF_TOPIC_REPLY } from "@/services/ai/topic-guard";
import { getPostHogServer } from "@/lib/posthog-server";

export const maxDuration = 60;

const HISTORY_LIMIT = 12;

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const credit = await enforceAiCredit(session.user.id, session.user.plan);
  if (credit) return credit;

  if (!isAiConfigured()) {
    return NextResponse.json(
      {
        error:
          "AI features are not configured. Add GROQ_API_KEY to your environment (free key at console.groq.com).",
      },
      { status: 503 },
    );
  }

  const limited = await enforceRateLimit("ai", req, session.user.id);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = aiChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  await connectDB();

  // Build problem context for the system prompt
  let contextBlock = "";
  if (input.questionId) {
    const question = await Question.findById(input.questionId)
      .select("title difficulty category description constraints")
      .lean();
    if (question) {
      contextBlock += `Current problem: "${question.title}" (${question.difficulty}, ${question.category})\n\nProblem statement:\n${question.description.slice(0, 4000)}\n\nConstraints: ${question.constraints.join("; ")}\n`;
    }
  }
  if (input.challengeId) {
    const challenge = await FrontendChallenge.findById(input.challengeId)
      .select("title difficulty tech description designSpec")
      .lean();
    if (challenge) {
      contextBlock += `Current frontend challenge: "${challenge.title}" (${challenge.difficulty}, ${challenge.tech})\n\nBrief:\n${challenge.description.slice(0, 3000)}\n`;
    }
  }
  if (input.code) {
    contextBlock += `\nUser's current ${input.language ?? ""} code:\n\`\`\`\n${input.code.slice(0, 8000)}\n\`\`\`\n`;
  }
  if (input.failureContext && input.action === "why-failing") {
    contextBlock += `\nFailing test details:\n${input.failureContext.slice(0, 4000)}\n`;
  }

  const system = await getPrompt("mentor-system", { context: contextBlock });

  // Quick actions get a canned instruction as the user turn
  let userMessage = input.message;
  if (input.action !== "chat") {
    const action = await getPrompt(input.action, {
      level: String(input.hintLevel ?? 1),
    });
    userMessage = action.text;
  }

  // Load conversation history for this context
  const chatQuery: Record<string, unknown> = {
    user: new Types.ObjectId(session.user.id),
    context: input.context,
  };
  if (input.questionId) chatQuery.question = new Types.ObjectId(input.questionId);
  if (input.challengeId) {
    chatQuery.challenge = new Types.ObjectId(input.challengeId);
  }
  const chat =
    (await AiChat.findOne(chatQuery)) ?? (await AiChat.create(chatQuery));

  const history: ChatMessage[] = chat.messages
    .slice(-HISTORY_LIMIT)
    .map((message) => ({ role: message.role, content: message.content }));

  const messages: ChatMessage[] = [
    { role: "system", content: system.text },
    ...history,
    { role: "user", content: userMessage },
  ];

  const posthog = getPostHogServer();
  posthog?.capture({
    distinctId: session.user.id,
    event: "ai_mentor_messaged",
    properties: {
      action: input.action,
      context: input.context,
      has_question: !!input.questionId,
      has_challenge: !!input.challengeId,
    },
  });

  // Hard gate: for free-form messages, classify the topic before spending a
  // full model call. Off-topic messages get the canned refusal and never reach
  // the mentor model. Quick actions always operate on a problem, so skip them.
  const offTopic =
    input.action === "chat" && !(await isOnTopic(input.message));

  const encoder = new TextEncoder();
  let assistantReply = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (offTopic) {
          assistantReply = OFF_TOPIC_REPLY;
          controller.enqueue(encoder.encode(OFF_TOPIC_REPLY));
          controller.close();
        } else {
          for await (const delta of streamCompletion(messages, {
            temperature: system.temperature,
            maxTokens: system.maxTokens,
          })) {
            assistantReply += delta;
            controller.enqueue(encoder.encode(delta));
          }
          controller.close();
        }
      } catch (streamError) {
        controller.enqueue(
          encoder.encode(
            "\n\n_The AI mentor hit an error. Please try again._",
          ),
        );
        controller.close();
        console.error("AI stream error:", streamError);
      }

      // Persist the exchange after the stream completes
      try {
        chat.messages.push(
          { role: "user", content: userMessage, createdAt: new Date() },
          {
            role: "assistant",
            content: assistantReply || "(no response)",
            createdAt: new Date(),
          },
        );
        if (chat.messages.length > 60) {
          chat.messages = chat.messages.slice(-60);
        }
        await chat.save();
      } catch (persistError) {
        console.error("Failed to persist AI chat:", persistError);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}

/** Fetch existing conversation for a context (panel hydration) */
export async function GET(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  await connectDB();
  const questionId = req.nextUrl.searchParams.get("questionId");
  const challengeId = req.nextUrl.searchParams.get("challengeId");
  const context = req.nextUrl.searchParams.get("context") ?? "general";

  const query: Record<string, unknown> = {
    user: new Types.ObjectId(session.user.id),
    context,
  };
  if (questionId && Types.ObjectId.isValid(questionId)) {
    query.question = new Types.ObjectId(questionId);
  }
  if (challengeId && Types.ObjectId.isValid(challengeId)) {
    query.challenge = new Types.ObjectId(challengeId);
  }

  const chat = await AiChat.findOne(query).lean();

  return NextResponse.json({
    messages:
      chat?.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })) ?? [],
  });
}
