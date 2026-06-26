"use client";

import { useRef, useState } from "react";
import { upload } from "@vercel/blob/client";
import { CheckCircle2, FileText, Loader2, Upload, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const EXPERIENCE = ["Student / Fresher", "0–1 years", "1–3 years", "3–5 years", "5+ years"];

const EMPTY = {
  name: "", email: "", phone: "", location: "",
  linkedin: "", github: "", portfolio: "",
  experience: "", company: "", message: "",
};

export function ApplyForm({ role, roleTitle }: { role: string; roleTitle: string }) {
  const [form, setForm] = useState({ ...EMPTY });
  const [resume, setResume] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onResume(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Résumé must be under 5 MB."); return; }
    setError("");
    setUploading(true);
    try {
      const blob = await upload(`resumes/${file.name}`, file, { access: "private", handleUploadUrl: "/api/careers/upload" });
      setResume({ url: blob.url, name: file.name });
    } catch {
      setError("Résumé upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (form.name.trim().length < 2) return setError("Please enter your full name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) return setError("Please enter a valid email address.");
    if (!form.phone.trim()) return setError("Please enter your phone number.");
    if (!form.location.trim()) return setError("Please enter your current location.");
    if (!form.experience) return setError("Please select your years of experience.");

    setSubmitting(true);
    try {
      const res = await fetch("/api/careers/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form, role,
          resumeUrl: resume?.url ?? "",
          resumeName: resume?.name ?? "",
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setError(data?.error ?? "Something went wrong. Please try again."); return; }
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
          Thanks for applying for {roleTitle}. A confirmation email is on its way, and we&rsquo;ll reach out if it&rsquo;s a fit.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border bg-card p-6 sm:p-8">
      <h3 className="text-lg font-bold">Apply for this role</h3>
      <p className="mt-1 text-sm text-muted-foreground">Fields marked with * are required.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="Full name *"><Input value={form.name} onChange={set("name")} placeholder="Your name" /></Field>
        <Field label="Email address *"><Input type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" /></Field>
        <Field label="Phone number *"><Input value={form.phone} onChange={set("phone")} placeholder="+91 …" inputMode="tel" /></Field>
        <Field label="Current location *"><Input value={form.location} onChange={set("location")} placeholder="City, Country" /></Field>
        <Field label="LinkedIn profile"><Input value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/in/…" /></Field>
        <Field label="GitHub (for developers)"><Input value={form.github} onChange={set("github")} placeholder="https://github.com/…" /></Field>
        <Field label="Portfolio / website"><Input value={form.portfolio} onChange={set("portfolio")} placeholder="https://…" /></Field>
        <Field label="Years of experience *">
          <Select value={form.experience} onValueChange={(v) => setForm((f) => ({ ...f, experience: v }))}>
            <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
            <SelectContent>
              {EXPERIENCE.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Current company (optional)" className="sm:col-span-2"><Input value={form.company} onChange={set("company")} placeholder="Where you work now" /></Field>
      </div>

      {/* résumé upload */}
      <div className="mt-4 space-y-1.5">
        <Label>Résumé (PDF/DOC, max 5 MB)</Label>
        {resume ? (
          <div className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2.5">
            <FileText className="size-4 shrink-0 text-primary" />
            <a href={resume.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 truncate text-sm text-primary hover:underline">{resume.name}</a>
            <button type="button" onClick={() => { setResume(null); if (fileRef.current) fileRef.current.value = ""; }} className="text-muted-foreground hover:text-destructive">
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <Button type="button" variant="outline" className="w-full gap-2" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {uploading ? "Uploading…" : "Upload résumé"}
          </Button>
        )}
        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,application/pdf" onChange={onResume} className="hidden" />
      </div>

      <div className="mt-4 space-y-1.5">
        <Label htmlFor="message">Anything else? <span className="font-normal text-muted-foreground">(optional)</span></Label>
        <Textarea id="message" value={form.message} onChange={set("message")} rows={4} placeholder="A few lines about why you'd be a great fit…" maxLength={4000} />
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={submitting || uploading} className="mt-5 gap-2">
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Submit application
      </Button>
    </form>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
