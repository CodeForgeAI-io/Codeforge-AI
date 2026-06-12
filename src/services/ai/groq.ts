import Groq from "groq-sdk";

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
    client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return client;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Non-streaming completion that returns plain text */
export async function complete(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number; json?: boolean },
): Promise<string> {
  const groq = getGroqClient();
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: options?.temperature ?? 0.7,
    max_tokens: options?.maxTokens ?? 2048,
    ...(options?.json ? { response_format: { type: "json_object" } } : {}),
  });
  return response.choices[0]?.message?.content ?? "";
}

/** Streaming completion as an async iterable of text chunks */
export async function* streamCompletion(
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
}
