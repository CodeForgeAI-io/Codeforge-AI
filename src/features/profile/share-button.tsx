"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareButton({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/profile/${username}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button size="sm" variant="outline" onClick={copy} className="gap-1.5">
      {copied ? <><Check className="size-3.5 text-easy" /> Copied!</> : <><Share2 className="size-3.5" /> Share</>}
    </Button>
  );
}
