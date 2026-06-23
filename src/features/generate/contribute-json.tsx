"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ClipboardCopy, FileUp, Loader2, UploadCloud } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GenerationResults, type GenerateResult } from "./generation-results";

export const QUESTION_JSON_TEMPLATE = `{
  "title": "Sum of Two Numbers",
  "difficulty": "Easy",
  "category": "Math",
  "tags": ["Math"],
  "companies": [],
  "description": "Read two integers (one per line) from stdin and print their sum.",
  "examples": [{ "input": "2\\n3", "output": "5" }],
  "constraints": ["-10^9 <= a, b <= 10^9"],
  "starterCode": {
    "javascript": "const [a, b] = require('fs').readFileSync(0, 'utf8').trim().split('\\\\n').map(Number);\\n// print the answer with console.log",
    "python": "import sys\\na, b = map(int, sys.stdin.read().split())\\n# print the answer"
  },
  "testCases": [
    { "input": "2\\n3", "expected": "5", "hidden": false },
    { "input": "10\\n-4", "expected": "6", "hidden": true }
  ],
  "hints": ["Read both lines", "Convert to numbers", "Print a + b"]
}`;

export function ContributeJson() {
  const [json, setJson] = useState("");
  const [result, setResult] = useState<GenerateResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: async (payload: string): Promise<GenerateResult> => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(payload);
      } catch (parseError) {
        throw new Error(
          `Invalid JSON: ${parseError instanceof Error ? parseError.message : "could not parse"}`,
        );
      }
      const res = await fetch("/api/questions/contribute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      return data;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.created.length > 0) {
        toast.success(
          `Published ${data.created.length} question(s) to Problems!`,
        );
      }
      for (const failure of data.rejected ?? []) {
        toast.error(`${failure.title}: ${failure.reason}`);
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleFile(file: File) {
    const text = await file.text();
    setJson(text);
    mutation.mutate(text);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload questions as JSON</CardTitle>
          <CardDescription>
            A single question object or an array (max 20). Programs read stdin
            and print to stdout; test case <code className="rounded bg-muted px-1 font-mono text-xs">input</code>{" "}
            is the exact stdin, <code className="rounded bg-muted px-1 font-mono text-xs">expected</code>{" "}
            the exact stdout. Valid questions publish immediately.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            value={json}
            onChange={(event) => setJson(event.target.value)}
            placeholder="Paste your question JSON here..."
            className="min-h-56 font-mono text-xs"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={mutation.isPending || json.trim().length < 2}
              onClick={() => mutation.mutate(json)}
            >
              {mutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <UploadCloud className="size-4" />
              )}
              Validate & publish
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) handleFile(file);
                event.target.value = "";
              }}
            />
            <Button
              variant="outline"
              disabled={mutation.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="size-4" /> Upload .json file
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(QUESTION_JSON_TEMPLATE);
                toast.success("Template copied to clipboard");
              }}
            >
              <ClipboardCopy className="size-4" /> Copy template
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && <GenerationResults result={result} />}
    </div>
  );
}
