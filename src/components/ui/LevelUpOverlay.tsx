"use client";

// ─────────────────────────────────────────────────────────────
// LevelUpOverlay — full-screen celebration when a user crosses
// a tier threshold. Triggered by BattlePassCard when the fetched
// tier is higher than what the device remembered.
//
// Auto-dismisses after 3.5s (also on tap). Uses the sound system
// already wired up in the codebase (sfx.lockIn as a placeholder).
// ─────────────────────────────────────────────────────────────

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { tierByLevel } from "@/lib/battle-pass";
import { sfx } from "@/components/ui/SoundFX";
import { localizeNumber } from "@/lib/i18n-data";
import { Confetti } from "@/components/ui/Confetti";

interface Props {
  from: number;
  to: number;
  onDone: () => void;
}

export function LevelUpOverlay({ from, to, onDone }: Props) {
  const { t, lang } = useI18n();
  const tier = tierByLevel(to);
  const jump = to - from;

  useEffect(() => {
    sfx.lockIn();
    // Haptic tap on iOS/Android where supported.
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate([12, 40, 12]);
      } catch {
        // ignore
      }
    }
    const timer = setTimeout(onDone, 3500);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onDone}
        role="dialog"
        aria-label="Level up"
        className="fixed inset-0 z-[110] flex items-center justify-center px-4 cursor-pointer"
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(255,184,28,0.35), rgba(0,40,104,0.95) 60%, rgba(0,0,0,0.98))",
        }}
      >
        <Confetti active />

        <motion.button
          type="button"
          onClick={onDone}
          className="absolute top-6 end-6 w-9 h-9 rounded-full bg-white/15 backdrop-blur text-white flex items-center justify-center hover:bg-white/25"
          aria-label="close"
        >
          <X className="w-4 h-4" />
        </motion.button>

        <div className="relative z-10 text-center text-white max-w-md">
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 16 }}
            className="text-[10px] uppercase tracking-widest font-bold opacity-80 mb-2"
          >
            {jump > 1
              ? `${localizeNumber(jump, lang)} tiers`
              : "Level up"}
          </motion.div>

          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotate: -8 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.25, type: "spring", stiffness: 160, damping: 14 }}
            className="w-32 h-32 mx-auto mb-6 rounded-3xl flex items-center justify-center text-6xl"
            style={{
              background: tier.color,
              boxShadow: `0 20px 60px ${tier.color}88`,
            }}
          >
            {tier.icon}
          </motion.div>

          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="font-fifa text-4xl md:text-5xl uppercase leading-none mb-3 sweep-shine"
          >
            {t(tier.titleKey)}
          </motion.h2>

          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.55 }}
            className="text-white/90 text-sm max-w-sm mx-auto leading-relaxed"
          >
            {t(tier.rewardKey)}
          </motion.p>

          <motion.div
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur text-xs font-bold uppercase tracking-widest"
            dir="ltr"
          >
            {t("bp.level")} {localizeNumber(to, lang)}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
