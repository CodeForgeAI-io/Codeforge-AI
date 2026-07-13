"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Fingerprint, Loader2, Plus, Trash2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  registerPasskey,
  listPasskeys,
  deletePasskey,
  passkeysSupported,
  type PasskeyRow,
} from "@/lib/passkey-client";

function isCancel(msg: string): boolean {
  return /aborted|cancel|NotAllowed|timed out/i.test(msg);
}

export function PasskeyManager() {
  const [rows, setRows] = useState<PasskeyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const ok = passkeysSupported();
    setSupported(ok);
    if (!ok) {
      setLoading(false);
      return;
    }
    listPasskeys()
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function add() {
    setAdding(true);
    try {
      const name =
        window.prompt('Name this passkey (e.g. "MacBook Touch ID")', "My passkey") ?? undefined;
      await registerPasskey(name);
      toast.success("Passkey added");
      setRows(await listPasskeys());
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Couldn't add passkey";
      if (!isCancel(msg)) toast.error(msg);
    } finally {
      setAdding(false);
    }
  }

  async function remove(id: string) {
    try {
      await deletePasskey(id);
      setRows((r) => r.filter((x) => x.id !== id));
      toast.success("Passkey removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't remove passkey");
    }
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Fingerprint className="size-5 text-primary" />
          Passkeys
        </CardTitle>
        <CardDescription>
          Sign in with Face ID, Touch ID or a security key — no password needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!supported ? (
          <p className="text-sm text-muted-foreground">
            This device or browser doesn&apos;t support passkeys.
          </p>
        ) : loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading…
          </div>
        ) : (
          <>
            {rows.length === 0 ? (
              <p className="text-sm text-muted-foreground">No passkeys yet.</p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {rows.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.name || "Passkey"}</p>
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(p.createdAt).toLocaleDateString()}
                        {p.lastUsedAt
                          ? ` · last used ${new Date(p.lastUsedAt).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => remove(p.id)}
                      aria-label="Remove passkey"
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button type="button" variant="outline" onClick={add} disabled={adding}>
              {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add a passkey
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
