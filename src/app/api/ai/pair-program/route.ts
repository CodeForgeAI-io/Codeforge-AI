import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/api-auth";
import { enforceAiCredit } from "@/services/ai-credits";
import { streamCompletion } from "@/services/ai/groq";

export async function POST(req: NextRequest) {
  const { session, error } = await requireUser();
  if (error) return error;

  const credit = await enforceAiCredit(session.user.id, session.user.plan);
  if (credit) return credit;

  const { code, language, message, questionContext } = await req.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const systemPrompt = `You are an AI pair programmer. You help developers write better code through collaboration.
${questionContext ? `Problem context: ${questionContext}` : ""}
${code ? `Current code (${language ?? "unknown"}):\n\`\`\`${language ?? ""}\n${code.slice(0, 2000)}\n\`\`\`` : ""}

Be concise, friendly, and focus on helping the user improve their solution. Suggest specific improvements with code snippets when helpful.`;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of streamCompletion(
          [
            { role: "system", content: systemPrompt },
            { role: "user", content: message },
          ],
          { temperature: 0.6, maxTokens: 800 },
        )) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk })}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
