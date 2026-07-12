"use client";

import { motion } from "framer-motion";
import { Flame, Target, Award, Zap, Sparkles, TrendingUp, Lock } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";

interface Pred {
  match_id: string;
  points_earned: number;
  scored: boolean;
  // Multiplier as stored on the predictions row in Supabase. Cloud-backed
  // now — used to survive device swaps, wipes, and multi-device sign-in.
  stake_multiplier?: number | null;
  created_at?: string;
}

interface Props {
  predictions: Pred[];
  isSelf: boolean;
}

interface Achievement {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  ring: string;
  unlocked: boolean;
  progress?: string;
}

export function Achievements({ predictions, isSelf }: Props) {
  const { t } = useI18n();
  const [items, setItems] = useState<Achievement[]>([]);

  useEffect(() => {
    const scored = predictions.filter((p) => p.scored);
    const exacts = scored.filter((p) => p.points_earned === 3);
    const outcomes = scored.filter(
      (p) => p.points_earned >= 1,
    );

    // Streak count — 3 in a row correct (any base > 0)
    const sorted = [...scored].sort(
      (a, b) =>
        new Date(a.created_at ?? 0).getTime() -
        new Date(b.created_at ?? 0).getTime(),
    );
    let bestStreak = 0;
    let cur = 0;
    for (const p of sorted) {
      if (p.points_earned > 0) {
        cur += 1;
        if (cur > bestStreak) bestStreak = cur;
      } else {
        cur = 0;
      }
    }

    // Cloud-backed stake reads: use the multiplier stored on each
    // prediction row instead of a client-only localStorage map. This
    // keeps achievements consistent across devices and browser wipes.
    let legendHits = 0;
    let allinHits = 0;
    if (isSelf) {
      scored.forEach((p) => {
        if (p.points_earned <= 0) return;
        const mult = p.stake_multiplier ?? 1;
        if (mult === 3) legendHits += 1;
        if (mult === 5) allinHits += 1;
      });
    }

    setItems([
      {
        id: "first",
        icon: Target,
        color: "#10B981",
        ring: "#34D399",
        unlocked: outcomes.length >= 1,
        progress: `${outcomes.length}/1`,
      },
      {
        id: "exact",
        icon: Award,
        color: "#F59E0B",
        ring: "#FBBF24",
        unlocked: exacts.length >= 1,
        progress: `${exacts.length}/1`,
      },
      {
        id: "trio",
        icon: Sparkles,
        color: "#8B5CF6",
        ring: "#A78BFA",
        unlocked: exacts.length >= 3,
        progress: `${Math.min(exacts.length, 3)}/3`,
      },
      {
        id: "legend",
        icon: Flame,
        color: "#C8102E",
        ring: "#F04058",
        unlocked: legendHits >= 1,
        progress: `${legendHits}/1`,
      },
      {
        id: "allin",
        icon: Zap,
        color: "#FFB81C",
        ring: "#FFD154",
        unlocked: allinHits >= 1,
        progress: `${allinHits}/1`,
      },
      {
        id: "streak",
        icon: TrendingUp,
        color: "#EF4444",
        ring: "#F87171",
        unlocked: bestStreak >= 3,
        progress: `${Math.min(bestStreak, 3)}/3`,
      },
    ]);
  }, [predictions, isSelf]);

  return (
    <div className="mt-8 mb-10 rounded-3xl border border-gray-200 bg-white p-6 relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: HOST_TRI_GRADIENT }}
      />
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-yellow-500" />
        <h3 className="font-fifa text-2xl uppercase text-gray-900">
          {t("ach.title")}
        </h3>
        <span className="ms-auto text-[10px] uppercase tracking-widest text-gray-500 font-bold" dir="ltr">
          {items.filter((a) => a.unlocked).length}/{items.length}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((a, i) => {
          const Icon = a.icon;
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`relative rounded-2xl p-4 border-2 overflow-hidden ${
                a.unlocked ? "border-transparent" : "border-gray-200 bg-gray-50"
              }`}
              style={{
                background: a.unlocked
                  ? `linear-gradient(135deg, ${a.color}0f, white 60%)`
                  : undefined,
                borderColor: a.unlocked ? `${a.color}44` : undefined,
              }}
            >
              <div className="flex items-start gap-3 mb-2">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    a.unlocked ? "" : "grayscale opacity-50"
                  }`}
                  style={{
                    background: a.unlocked ? a.color : "#E5E7EB",
                    color: "white",
                    boxShadow: a.unlocked ? `0 0 20px ${a.color}55` : undefined,
                  }}
                >
                  {a.unlocked ? (
                    <Icon className="w-5 h-5" />
                  ) : (
                    <Lock className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`font-bold text-sm leading-tight break-words ${
                      a.unlocked ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    {t(`ach.${a.id}.title`)}
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-1" dir="ltr">
                    {a.progress}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-500 leading-tight">
                {t(`ach.${a.id}.desc`)}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
