"use client";

import { useState } from "react";
import { CheckCircle2, Loader2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ApplyForm({ role, roleTitle }: { role: string; roleTitle: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", link: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.name.trim().length < 2) return setError("Please enter your full name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return setError("Please enter a valid email address.");
    if (form.message.trim().length < 20) return setError("Tell us a bit about yourself — at least 20 characters.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/careers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, role }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-green-500/15">
          <CheckCircle2 className="size-7 text-green-500" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">Application received</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Thanks for applying for {roleTitle}. We&rsquo;ll review it and reach out if it&rsquo;s a fit. A confirmation is on its way to your inbox.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-card p-6 sm:p-8">
      <h3 className="text-lg font-bold">Apply for this role</h3>
      <p className="mt-1 text-sm text-muted-foreground">Tell us about yourself — we read every application.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={form.name} onChange={set("name")} placeholder="Your name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="phone" value={form.phone} onChange={set("phone")} placeholder="+91 …" inputMode="tel" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="link">GitHub / Portfolio <span className="font-normal text-muted-foreground">(optional)</span></Label>
          <Input id="link" value={form.link} onChange={set("link")} placeholder="https://…" />
        </div>
      </div>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="message">Why you?</Label>
        <Textarea id="message" value={form.message} onChange={set("message")} rows={6} placeholder="A few lines about your experience and why you'd be a great fit…" maxLength={4000} />
        <p className={`text-right text-xs ${form.message.trim().length > 0 && form.message.trim().length < 20 ? "text-destructive" : "text-muted-foreground"}`}>
          Minimum 20 characters
        </p>
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting} className="mt-5 gap-2">
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Submit application
      </Button>
    </form>
  );
}
