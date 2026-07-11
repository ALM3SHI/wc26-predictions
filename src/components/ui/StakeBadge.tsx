"use client";

import { useEffect, useState } from "react";
import { getStake, getStakeById } from "@/lib/gamble";
import { Flame } from "lucide-react";

interface Props {
  matchId: string;
}

/**
 * Small pill badge rendered on match cards after the user has
 * gambled on them. Reads localStorage so it only appears on the
 * device where the stake was set. Silent no-op on server render.
 */
export function StakeBadge({ matchId }: Props) {
  const [stake, setStake] = useState<ReturnType<typeof getStakeById> | null>(null);
  const [hasStake, setHasStake] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("wc26.stakes");
    if (!raw) return;
    try {
      const map = JSON.parse(raw);
      if (map && map[matchId]) {
        setStake(getStakeById(getStake(matchId)));
        setHasStake(true);
      }
    } catch {
      // ignore
    }
  }, [matchId]);

  if (!hasStake || !stake || stake.mult <= 1) return null;

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest text-white shadow-sm"
      style={{
        background: `linear-gradient(135deg, ${stake.color}, ${stake.ring})`,
      }}
    >
      <Flame className="w-3 h-3" />
      {stake.mult}x
    </span>
  );
}
