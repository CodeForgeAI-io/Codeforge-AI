"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Upload, Trash2, Loader2, Pencil } from "@/components/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateProfileMedia } from "@/actions/profile";

type Kind = "avatar" | "cover";

export function ProfileMedia({
  name,
  image,
  coverImage,
}: {
  name: string;
  image: string | null;
  coverImage: string | null;
}) {
  const [avatar, setAvatar] = useState(image);
  const [cover, setCover] = useState(coverImage);
  const [busy, setBusy] = useState<Kind | null>(null);
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function upload(kind: Kind, file: File) {
    setBusy(kind);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", kind);
      const res = await fetch("/api/profile/media", { method: "POST", body: fd });
      const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
      if (!res.ok || !data?.url) {
        toast.error(data?.error ?? "Upload failed");
        return;
      }
      const saved = await updateProfileMedia(
        kind === "avatar" ? { image: data.url } : { coverImage: data.url },
      );
      if (!saved.ok) {
        toast.error(saved.error ?? "Couldn't save");
        return;
      }
      if (kind === "avatar") setAvatar(data.url);
      else setCover(data.url);
      toast.success(kind === "avatar" ? "Profile photo updated" : "Cover photo updated");
    } finally {
      setBusy(null);
    }
  }

  async function remove(kind: Kind) {
    const saved = await updateProfileMedia(
      kind === "avatar" ? { image: null } : { coverImage: null },
    );
    if (!saved.ok) {
      toast.error(saved.error ?? "Couldn't remove");
      return;
    }
    if (kind === "avatar") setAvatar(null);
    else setCover(null);
    toast.success("Removed");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Photos</CardTitle>
        <CardDescription>Your avatar and cover photo shown on your public profile.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-xl border">
          {/* cover — shown at the same crop as your public profile */}
          <div className="relative h-28 bg-linear-to-br from-[#006bff]/25 via-[#006bff]/10 to-transparent sm:h-36">
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt="Cover" className="absolute inset-0 size-full object-cover" />
            )}
            {/* safe-zone guide: content inside the dashed box always stays visible */}
            <div className="pointer-events-none absolute inset-y-3 inset-x-[10%] rounded-md border border-dashed border-white/75 shadow-[0_0_0_9999px_rgba(0,0,0,0.12)]">
              <span className="absolute left-1/2 top-1.5 -translate-x-1/2 whitespace-nowrap rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium text-white/90">
                Safe zone
              </span>
            </div>
            <div className="absolute right-3 top-3 z-10 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => coverInput.current?.click()}
                disabled={busy === "cover"}
              >
                {busy === "cover" ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                Cover
              </Button>
              {cover && (
                <Button size="icon" variant="secondary" onClick={() => remove("cover")} aria-label="Remove cover photo">
                  <Trash2 className="size-4" />
                </Button>
              )}
            </div>
          </div>

          {/* avatar */}
          <div className="flex items-center gap-4 px-4 pb-4">
            <div className="relative -mt-8">
              <Avatar className="size-20 border-4 border-background shadow">
                <AvatarImage src={avatar ?? undefined} alt={name} />
                <AvatarFallback className="bg-primary/10 text-xl font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => avatarInput.current?.click()}
                disabled={busy === "avatar"}
                aria-label="Change profile photo"
                className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full bg-[#006bff] text-white shadow ring-2 ring-background transition-transform hover:scale-105"
              >
                {busy === "avatar" ? <Loader2 className="size-3.5 animate-spin" /> : <Pencil className="size-3.5" />}
              </button>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>PNG, JPG, WebP or GIF · up to 4 MB.</p>
              {avatar && (
                <button
                  type="button"
                  onClick={() => remove("avatar")}
                  className="mt-1 text-xs text-destructive hover:underline"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
        </div>
        <p className="mt-2.5 text-xs text-muted-foreground">
          Keep logos and text inside the <span className="font-medium text-foreground">safe zone</span> — the
          area outside it can be cropped on smaller screens.
        </p>

        <input
          ref={avatarInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload("avatar", f);
            e.target.value = "";
          }}
        />
        <input
          ref={coverInput}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) upload("cover", f);
            e.target.value = "";
          }}
        />
      </CardContent>
    </Card>
  );
}
