"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/schemas/profile";
import { LANGUAGES, type LanguageId } from "@/lib/constants";
import { updateProfile, updatePreferences } from "@/actions/profile";
import { useWorkspaceStore } from "@/store/workspace";

export function ProfileSettingsForm({
  defaults,
}: {
  defaults: ProfileUpdateInput;
}) {
  const { update } = useSession();
  const [saving, setSaving] = useState(false);

  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: defaults,
  });

  async function onSubmit(values: ProfileUpdateInput) {
    setSaving(true);
    try {
      const result = await updateProfile(values);
      if (!result.ok) {
        toast.error(result.error ?? "Update failed");
        return;
      }
      await update(); // refresh JWT (username may have changed)
      toast.success("Profile updated");
    } finally {
      setSaving(false);
    }
  }

  const errors = form.formState.errors;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Public profile</CardTitle>
        <CardDescription>
          Shown on your public profile page and the leaderboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={errors.name?.message}>
              <Input {...form.register("name")} />
            </Field>
            <Field label="Username" error={errors.username?.message}>
              <Input {...form.register("username")} />
            </Field>
          </div>
          <Field label="Bio" error={errors.bio?.message}>
            <Textarea rows={2} maxLength={300} {...form.register("bio")} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location" error={errors.location?.message}>
              <Input placeholder="City, Country" {...form.register("location")} />
            </Field>
            <Field label="Website" error={errors.website?.message}>
              <Input placeholder="https://..." {...form.register("website")} />
            </Field>
            <Field label="GitHub URL" error={errors.githubUrl?.message}>
              <Input placeholder="https://github.com/..." {...form.register("githubUrl")} />
            </Field>
            <Field label="LinkedIn URL" error={errors.linkedinUrl?.message}>
              <Input placeholder="https://linkedin.com/in/..." {...form.register("linkedinUrl")} />
            </Field>
          </div>
          <Button type="submit" disabled={saving} className="w-fit">
            {saving && <Loader2 className="size-4 animate-spin" />}
            Save profile
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export function EditorSettingsForm({
  defaults,
}: {
  defaults: {
    editorFontSize: number;
    editorTheme: "vs-dark" | "light";
    vimMode: boolean;
    defaultLanguage: string;
  };
}) {
  const workspace = useWorkspaceStore();
  const [fontSize, setFontSize] = useState(defaults.editorFontSize);
  const [vimMode, setVimMode] = useState(defaults.vimMode);
  const [language, setLanguage] = useState(defaults.defaultLanguage);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const result = await updatePreferences({
        editorFontSize: fontSize,
        editorTheme: defaults.editorTheme,
        vimMode,
        defaultLanguage: language as LanguageId,
      });
      if (!result.ok) {
        toast.error(result.error ?? "Update failed");
        return;
      }
      // Mirror into the local workspace store so the editor picks it up now
      workspace.setFontSize(fontSize);
      workspace.setVimMode(vimMode);
      workspace.setLanguage(language as LanguageId);
      toast.success("Editor preferences saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Editor preferences</CardTitle>
        <CardDescription>
          Defaults for the coding workspace on this account.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="grid gap-2">
          <Label>Font size: {fontSize}px</Label>
          <Slider
            value={[fontSize]}
            min={10}
            max={28}
            step={1}
            onValueChange={([value]) => setFontSize(value)}
            className="max-w-xs"
          />
        </div>
        <div className="flex items-center justify-between sm:max-w-xs">
          <Label>Vim mode</Label>
          <Switch checked={vimMode} onCheckedChange={setVimMode} />
        </div>
        <div className="grid gap-2 sm:max-w-xs">
          <Label>Default language</Label>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.id} value={lang.id}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={save} disabled={saving} className="w-fit">
          {saving && <Loader2 className="size-4 animate-spin" />}
          Save preferences
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
