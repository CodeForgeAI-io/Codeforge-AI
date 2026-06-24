"use client";

import { useState, useRef, useEffect } from "react";
import { Users, Send, Loader2, Code2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { ToolHistory, saveToolRun } from "./tool-history";

interface Message { role: "user" | "assistant"; content: string }

const GREETING: Message = { role: "assistant", content: "👋 I'm your AI pair programmer! Paste your code and tell me what you're working on. I'll help you debug, optimize, and think through the problem together." };

export function AiPairProgrammer() {
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [code, setCode] = useState("");
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || streaming) return;
    const base = messages;
    const userMsg: Message = { role: "user", content: input };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setStreaming(true);

    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    let acc = "";
    try {
      const res = await fetch("/api/ai/pair-program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: "auto", message: input }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) return;

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const { text } = JSON.parse(data);
            if (text) { acc += text; setMessages((m) => { const copy = [...m]; copy[copy.length - 1] = { ...copy[copy.length - 1], content: copy[copy.length - 1].content + text }; return copy; }); }
          } catch {}
        }
      }

      // Persist the conversation (one run per session, updated each turn).
      if (acc.trim()) {
        const convo: Message[] = [...base, userMsg, { role: "assistant", content: acc }];
        const title = convo.find((m) => m.role === "user")?.content.slice(0, 80) || "Pair session";
        const id = await saveToolRun({ tool: "pair", title, result: convo, id: runId });
        if (id) setRunId(id);
        setHistoryKey((k) => k + 1);
      }
    } catch { setMessages((m) => { const copy = [...m]; copy[copy.length - 1] = { ...copy[copy.length - 1], content: "Error getting response. Try again." }; return copy; }); }
    finally { setStreaming(false); }
  }

  function loadConversation(convo: Message[]) {
    setMessages(convo.length ? convo : [GREETING]);
    setRunId(null);
  }

  return (
    <div className="space-y-4">
      <ToolHistory<Message[]> tool="pair" refreshKey={historyKey} onLoad={loadConversation} />
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5"><Code2 className="size-3.5" /> Your Code (optional)</Label>
        <Textarea value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste your code here for context..." className="font-mono text-xs min-h-[100px]" />
      </div>

      <div className="rounded-xl border overflow-hidden">
        <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2.5">
          <Users className="size-4 text-primary" />
          <span className="text-sm font-semibold">Pair Programming Session</span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-easy animate-pulse" /> AI ready
          </span>
        </div>

        <ScrollArea className="h-72 p-4">
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === "user" && "flex-row-reverse")}>
                <Avatar className="size-7 shrink-0">
                  <AvatarFallback className={cn("text-xs", msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted")}>
                    {msg.role === "assistant" ? "AI" : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className={cn("max-w-[80%] rounded-xl px-3 py-2 text-sm", msg.role === "assistant" ? "bg-muted/60" : "bg-primary text-primary-foreground")}>
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed">{msg.content}{streaming && i === messages.length - 1 && msg.role === "assistant" && <span className="inline-block w-1.5 h-4 bg-current animate-pulse ml-0.5 align-middle" />}</pre>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2 border-t p-3">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything about your code..." onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()} disabled={streaming} className="flex-1" />
          <Button size="icon" onClick={send} disabled={streaming || !input.trim()}>
            {streaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
