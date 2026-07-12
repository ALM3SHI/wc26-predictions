"use client";

// ─────────────────────────────────────────────────────────────
// StreakCard — pulls the user's finished predictions ordered by
// match start_time DESC, walks backwards to find the current
// correct-in-a-row streak, and computes the personal best in the
// same pass. Fully server-authoritative (no localStorage) so the
// number survives device swaps and reinstalls.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { localizeNumber } from "@/lib/i18n-data";

interface StreakInfo {
  current: number;
  best: number;
  ready: boolean;
  hide: boolean;
}

export function StreakCard() {
  const { t, lang, dir } = useI18n();
  const supabase = createClient();
  const [info, setInfo] = useState<StreakInfo>({
    current: 0,
    best: 0,
    ready: false,
    hide: false,
  });

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setInfo({ current: 0, best: 0, ready: true, hide: true });
        return;
      }

      // Pull every scored prediction the user has, joined with the match
      // date so we can walk in the same chronological order the matches
      // actually occurred (created_at can drift if a match is edited).
      const { data } = await supabase
        .from("predictions")
        .select(
          "points_earned, scored, matches(start_time)"
        )
        .eq("user_id", user.id)
        .eq("scored", true);

      const rows =
        (data as Array<{
          points_earned: number;
          scored: boolean;
          matches: { start_time: string } | null;
        }> | null) ?? [];

      // Newest match first for the "current" walk, then reversed for best.
      const sortedDesc = rows
        .filter((r) => r.matches?.start_time)
        .sort(
          (a, b) =>
            new Date(b.matches!.start_time).getTime() -
            new Date(a.matches!.start_time).getTime(),
        );

      let current = 0;
      for (const r of sortedDesc) {
        if (r.points_earned > 0) current += 1;
        else break;
      }

      // Best streak: walk chronologically forwards, tracking the peak.
      let best = 0;
      let run = 0;
      for (let i = sortedDesc.length - 1; i >= 0; i -= 1) {
        const r = sortedDesc[i];
        if (r.points_earned > 0) {
          run += 1;
          if (run > best) best = run;
        } else {
          run = 0;
        }
      }

      setInfo({ current, best, ready: true, hide: false });
    })();
  }, [supabase]);

  if (!info.ready || info.hide) return null;

  const hasStreak = info.current > 0;
  const bg = hasStreak
    ? "linear-gradient(135deg, #EF4444, #F97316 60%, #F59E0B)"
    : "linear-gradient(135deg, #F3F4F6, white 70%)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-4 md:p-5 relative overflow-hidden border"
      style={{
        background: bg,
        borderColor: hasStreak ? "transparent" : "#E5E7EB",
        color: hasStreak ? "white" : undefined,
      }}
      dir={dir}
    >
      <div className="flex items-center gap-4 relative z-10">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: hasStreak
              ? "rgba(255,255,255,0.18)"
              : "#FEE2E2",
            color: hasStreak ? "white" : "#DC2626",
            backdropFilter: hasStreak ? "blur(4px)" : undefined,
          }}
        >
          <Flame className="w-7 h-7" />
        </div>

        <div className="flex-1 min-w-0">
          <div
            className="text-[10px] uppercase tracking-widest font-bold"
            style={{ color: hasStreak ? "rgba(255,255,255,0.85)" : "#6B7280" }}
          >
            {t("streak.title")}
          </div>
          {hasStreak ? (
            <>
              <div
                className="font-fifa text-3xl md:text-4xl leading-none mt-1"
                dir="ltr"
              >
                {localizeNumber(info.current, lang)}
              </div>
              <div className="text-xs mt-1 opacity-90">
                {info.current === 1
                  ? t("streak.unit.one")
                  : t("streak.unit.many")}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-600 mt-1">
              {t("streak.dry")}
            </div>
          )}
        </div>

        {info.best > 0 && (
          <div className="text-end shrink-0">
            <div
              className="text-[9px] uppercase tracking-widest font-bold"
              style={{ color: hasStreak ? "rgba(255,255,255,0.85)" : "#6B7280" }}
            >
              {t("streak.best")}
            </div>
            <div
              className="font-fifa text-2xl"
              style={{ color: hasStreak ? "white" : "#111" }}
              dir="ltr"
            >
              {localizeNumber(info.best, lang)}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
