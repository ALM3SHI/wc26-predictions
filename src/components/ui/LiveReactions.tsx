"use client";

// ─────────────────────────────────────────────────────────────
// LiveReactions — floating emoji stream + tap-to-send buttons.
//
// Subscribes to public.match_reactions via Supabase Realtime and
// animates every insert as a bubble that floats up over the
// match page. Rate-limited server-side (20/min/user/match) via
// a trigger — the client shows a friendly "slow down" toast if
// the DB rejects the insert.
//
// Also throws a floating +1 badge for each reaction the current
// user sends so the tap feels instant even before Realtime echoes.
// ─────────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";

const EMOJI_SET = ["🔥", "⚽", "😱", "👏", "🇸🇦", "🥶", "💥", "😭"];

interface Props {
  matchId: string;
  userId: string;
}

interface FloatingReaction {
  id: number;
  emoji: string;
  x: number; // 0-100 vw fraction, source column
}

let localSeq = 0;

export function LiveReactions({ matchId, userId }: Props) {
  const { t } = useI18n();
  const supabase = createClient();
  const [floats, setFloats] = useState<FloatingReaction[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const throttleRef = useRef<number>(0);

  const push = useCallback((emoji: string) => {
    localSeq += 1;
    setFloats((prev) => {
      // Cap concurrent floaters at 40 so a burst doesn't tank scroll perf.
      const next = [
        ...prev.slice(Math.max(0, prev.length - 39)),
        {
          id: localSeq,
          emoji,
          x: 8 + Math.random() * 84, // spread across the viewport
        },
      ];
      return next;
    });
  }, []);

  // Realtime subscription — every insert on this match_id becomes a floater.
  useEffect(() => {
    const channel = supabase
      .channel(`match-reactions-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "match_reactions",
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const emoji = (payload.new as { emoji?: string }).emoji;
          if (emoji) push(emoji);
        },
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [matchId, supabase, push]);

  const send = async (emoji: string) => {
    // Client-side throttle so a rage-tap doesn't spam the network.
    const now = Date.now();
    if (now - throttleRef.current < 250) return;
    throttleRef.current = now;

    push(emoji); // optimistic
    const { error } = await supabase.from("match_reactions").insert({
      match_id: matchId,
      user_id: userId,
      emoji,
    });
    if (error) {
      setToast(t("rx.slow"));
      setTimeout(() => setToast(null), 2000);
    }
  };

  // Sweep expired floaters after their animation finishes.
  useEffect(() => {
    if (floats.length === 0) return;
    const timer = setTimeout(() => {
      setFloats((prev) => prev.filter((_, i) => i >= prev.length - 24));
    }, 4200);
    return () => clearTimeout(timer);
  }, [floats.length]);

  return (
    <>
      {/* Rising emoji layer — sits above the page but ignores pointer
          events so it never blocks scoreboard interactions. */}
      <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
        <AnimatePresence>
          {floats.map((f) => (
            <motion.span
              key={f.id}
              initial={{ y: 0, opacity: 0, scale: 0.6 }}
              animate={{
                y: -window.innerHeight * 0.75,
                opacity: [0, 1, 1, 0],
                scale: [0.6, 1.2, 1, 0.9],
                x: [0, -12 + Math.random() * 24, -8 + Math.random() * 16],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 3.6, ease: [0.2, 0.7, 0.2, 1] }}
              className="absolute bottom-24 text-3xl md:text-4xl select-none"
              style={{ left: `${f.x}%` }}
            >
              {f.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      {/* Reaction rail — floats over the bottom nav on mobile. */}
      <div
        className="fixed inset-x-0 z-30 flex justify-center pointer-events-none"
        style={{ bottom: "calc(env(safe-area-inset-bottom) + 84px)" }}
      >
        <div className="pointer-events-auto rounded-full bg-black/70 backdrop-blur px-2 py-1.5 shadow-2xl flex items-center gap-1">
          {EMOJI_SET.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => send(e)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 text-xl"
              aria-label={`react ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-4 py-2 rounded-full text-xs font-bold shadow-xl"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 148px)" }}
        >
          {toast}
        </motion.div>
      )}
    </>
  );
}
