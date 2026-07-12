"use client";

// ─────────────────────────────────────────────────────────────
// Home page Battle Pass card
//
// Compact tier ring + progress bar + preview of the next reward,
// linking to the full path. Detects tier-ups locally by comparing
// the fetched tier to what we last saw and pops the LevelUpOverlay
// so the celebration happens on whichever page the user is on
// when scoring finishes.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { localizeNumber } from "@/lib/i18n-data";
import {
  nextTier,
  tierByLevel,
  tierProgress,
  xpToNext,
} from "@/lib/battle-pass";
import { LevelUpOverlay } from "@/components/ui/LevelUpOverlay";

const LAST_TIER_KEY = "wc26.bp.lastTier";

export function BattlePassCard() {
  const { t, lang, dir } = useI18n();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [hide, setHide] = useState(false);
  const [xp, setXp] = useState(0);
  const [tier, setTier] = useState(1);
  const [levelUp, setLevelUp] = useState<{
    from: number;
    to: number;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setReady(true);
        setHide(true);
        return;
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("xp_total, current_tier")
        .eq("id", user.id)
        .single();
      if (error) {
        // xp column missing → migration not run yet, hide silently.
        setHide(true);
        setReady(true);
        return;
      }
      const nowXp = data?.xp_total ?? 0;
      const nowTier = data?.current_tier ?? 1;
      setXp(nowXp);
      setTier(nowTier);

      // Detect a tier-up since the last time this device rendered
      // the card. Local-only signal — best-effort, no server round-trip.
      try {
        const raw = window.localStorage.getItem(LAST_TIER_KEY);
        const prev = raw ? Number(raw) : nowTier;
        if (Number.isFinite(prev) && nowTier > prev) {
          setLevelUp({ from: prev, to: nowTier });
        }
        window.localStorage.setItem(LAST_TIER_KEY, String(nowTier));
      } catch {
        // ignore
      }

      setReady(true);
    })();
  }, [supabase]);

  if (!ready || hide) return null;

  const nxt = nextTier(tier);
  const cur = tierByLevel(tier);
  const progress = tierProgress(xp, tier);
  const remaining = xpToNext(xp, tier);

  return (
    <>
      <Link href="/battle-pass" className="block group" dir={dir}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-4 md:p-5 relative overflow-hidden text-white shadow-md group-active:scale-[0.98] transition-transform"
          style={{
            background:
              "linear-gradient(135deg, #002868, #0a1a4a 55%, #C8102E)",
          }}
        >
          <div className="absolute -top-8 -end-8 w-32 h-32 rounded-full bg-white/10 blur-2xl pointer-events-none" />

          <div className="flex items-center gap-4 relative z-10">
            <div
              className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center font-fifa text-2xl shrink-0"
              style={{
                boxShadow: `0 8px 20px ${cur.color}44`,
              }}
            >
              <span dir="ltr">{localizeNumber(tier, lang)}</span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest font-bold opacity-80">
                {t("bp.home.title")} · {t("bp.level")}{" "}
                <span dir="ltr">{localizeNumber(tier, lang)}</span>
              </div>
              <div className="font-fifa text-lg md:text-xl uppercase truncate leading-tight">
                {t(cur.titleKey)}
              </div>
              {nxt ? (
                <div className="text-xs opacity-90 mt-0.5 truncate">
                  <Sparkles className="inline w-3 h-3 me-1 rtl-flip-auto" />
                  {t("bp.next")}: {t(nxt.titleKey)}
                </div>
              ) : (
                <div className="text-xs opacity-90 mt-0.5">{t("bp.max")}</div>
              )}
            </div>

            <ArrowRight className="w-5 h-5 rtl-flip-auto opacity-80 shrink-0" />
          </div>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-2 relative z-10">
            <div className="h-2 flex-1 rounded-full bg-white/15 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ type: "spring", stiffness: 60, damping: 15 }}
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(90deg, #FFB81C, #FFDA6B)",
                }}
              />
            </div>
            <div className="text-[10px] uppercase tracking-widest font-bold opacity-80 min-w-[46px] text-end" dir="ltr">
              {nxt ? `+${localizeNumber(remaining, lang)}` : "MAX"}
            </div>
          </div>
        </motion.div>
      </Link>

      {levelUp && (
        <LevelUpOverlay
          from={levelUp.from}
          to={levelUp.to}
          onDone={() => setLevelUp(null)}
        />
      )}
    </>
  );
}
