"use client";

// ─────────────────────────────────────────────────────────────
// LiveViewers — presence indicator powered by Supabase Realtime.
//
// Every viewer joins a channel keyed by the match id and tracks
// their { user_id, display_name, avatar_url } so anyone else on
// the page sees a "N watching now" pill plus up to 5 avatar stubs.
//
// Purely ephemeral — nothing is persisted on the server. Leaves
// automatically when the tab closes or the component unmounts.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { AvatarFrame } from "@/components/ui/AvatarFrame";
import { localizeNumber } from "@/lib/i18n-data";

interface Props {
  matchId: string;
  me: {
    user_id: string;
    display_name: string;
    avatar_url: string | null;
    tier: number;
  };
}

interface Viewer {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  tier: number;
}

export function LiveViewers({ matchId, me }: Props) {
  const { t, lang, dir } = useI18n();
  const supabase = createClient();
  const [viewers, setViewers] = useState<Viewer[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`match-viewers-${matchId}`, {
      config: {
        presence: { key: me.user_id },
      },
    });

    channel.on("presence", { event: "sync" }, () => {
      // presenceState returns { [key]: Array<presence payload> }.
      // We only care about one payload per key, but Supabase can
      // register multiple if the user has more than one tab open.
      const state = channel.presenceState<Viewer>();
      const uniq = new Map<string, Viewer>();
      for (const list of Object.values(state)) {
        for (const v of list) {
          if (!uniq.has(v.user_id)) uniq.set(v.user_id, v);
        }
      }
      setViewers(Array.from(uniq.values()));
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          user_id: me.user_id,
          display_name: me.display_name,
          avatar_url: me.avatar_url,
          tier: me.tier,
        });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [matchId, me, supabase]);

  const others = viewers.filter((v) => v.user_id !== me.user_id).slice(0, 5);
  const total = viewers.length;
  if (total === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 inline-flex items-center gap-3 rounded-full bg-white/80 backdrop-blur border border-gray-200 px-4 py-2 shadow-sm"
      dir={dir}
    >
      <div className="flex items-center gap-1.5 text-gray-700">
        <Users className="w-3.5 h-3.5" />
        <span className="text-xs font-bold" dir="ltr">
          {localizeNumber(total, lang)}
        </span>
        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
          {t("rx.viewers")}
        </span>
      </div>

      {others.length > 0 && (
        <div
          className="flex items-center"
          style={{ direction: "ltr" }}
        >
          {others.map((v, i) => (
            <div
              key={v.user_id}
              className="rounded-full ring-2 ring-white"
              style={{ marginLeft: i === 0 ? 0 : -8 }}
              title={v.display_name}
            >
              <AvatarFrame
                src={v.avatar_url}
                tier={v.tier}
                size={24}
              />
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
