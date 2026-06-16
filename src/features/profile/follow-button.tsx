"use client";

import { useState } from "react";
import { UserCheck, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface Props {
  userId: string;
  initialFollowing: boolean;
}

export function FollowButton({ userId, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const method = following ? "DELETE" : "POST";
      const res = await fetch("/api/follow", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error();
      setFollowing(!following);
      toast.success(following ? "Unfollowed" : "Following!");
    } catch {
      toast.error("Failed to update follow status");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant={following ? "outline" : "default"}
      onClick={toggle}
      disabled={loading}
      className="gap-1.5"
    >
      {following ? (
        <><UserCheck className="size-3.5" /> Following</>
      ) : (
        <><UserPlus className="size-3.5" /> Follow</>
      )}
    </Button>
  );
}
