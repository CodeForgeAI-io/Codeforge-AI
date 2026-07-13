"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { updateEmailOptOut } from "@/actions/profile";

export function EmailNotifications({ optOut }: { optOut: boolean }) {
  const [subscribed, setSubscribed] = useState(!optOut);
  const [saving, setSaving] = useState(false);

  async function toggle(next: boolean) {
    setSubscribed(next);
    setSaving(true);
    try {
      const res = await updateEmailOptOut(!next);
      if (!res.ok) {
        setSubscribed(!next);
        toast.error(res.error ?? "Couldn't update");
        return;
      }
      toast.success(next ? "Subscribed to product emails" : "Unsubscribed from product emails");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Email notifications</CardTitle>
        <CardDescription>Choose what lands in your inbox.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium">Product updates &amp; newsletter</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Occasional emails about new features and tips. Account &amp; billing emails are always sent.
            </p>
          </div>
          <Switch checked={subscribed} onCheckedChange={toggle} disabled={saving} />
        </div>
      </CardContent>
    </Card>
  );
}
