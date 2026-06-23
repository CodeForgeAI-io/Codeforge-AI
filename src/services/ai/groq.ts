import Groq from "groq-sdk";
import { wrapOpenAI } from "langsmith/wrappers";
import { traceable } from "langsmith/traceable";

export const GROQ_MODEL =
  process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";

export function isAiConfigured(): boolean {
  return !!process.env.GROQ_API_KEY;
}

let client: Groq | null = null;

export function getGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY is not configured. Add it to .env.local to enable AI features.",
    );
  }
  if (!client) {
    // Groq's SDK is OpenAI-API-compatible, so wrapOpenAI adds LangSmith LLM
    // tracing (token usage, model, latency). It's a passthrough unless
    // LANGSMITH_TRACING=true and LANGSMITH_API_KEY are set.
    const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    client = wrapOpenAI(
      groqClient as unknown as Parameters<typeof wrapOpenAI>[0],
    ) as unknown as Groq;
  }
  return client;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Non-streaming completion that returns plain text.
 *  traceable adds a named LangSmith span; the wrapped client (wrapOpenAI)
 *  records the nested LLM run with token usage. */
export const complete = traceable(
  async (
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number; json?: boolean },
  ): Promise<string> => {
    const groq = getGroqClient();
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      ...(options?.json ? { response_format: { type: "json_object" } } : {}),
    });
    return response.choices[0]?.message?.content ?? "";
  },
  { name: "groq.complete", run_type: "chain" },
);

/** Streaming completion as an async iterable of text chunks. */
export const streamCompletion = traceable(
  async function* (
    messages: ChatMessage[],
    options?: { temperature?: number; maxTokens?: number },
  ): AsyncGenerator<string> {
    const groq = getGroqClient();
    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 2048,
      stream: true,
    });
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) yield delta;
    }
  },
  { name: "groq.streamCompletion", run_type: "chain" },
);
