"use client";

// ─────────────────────────────────────────────────────────────
// YouVsTournament — personal analytics card for the profile page.
// Compares the user's predictions to the aggregate tournament,
// entirely from cloud data: accuracy %, avg goals predicted vs
// avg goals scored across all finished matches, and a "most-
// predicted team" tag pulled from their own history.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { localizeNumber, localizeTeam } from "@/lib/i18n-data";
import { Flag } from "@/components/ui/Flag";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";

interface Props {
  userId: string;
  isSelf: boolean;
}

interface State {
  ready: boolean;
  hide: boolean;
  totalScored: number;
  hitPct: number;
  avgYou: number;
  avgActual: number;
  mostPicked: string | null;
  mostPickedCount: number;
  bestWin: number;
}

export function YouVsTournament({ userId, isSelf }: Props) {
  const { t, lang, dir } = useI18n();
  const supabase = createClient();
  const [s, setS] = useState<State>({
    ready: false,
    hide: false,
    totalScored: 0,
    hitPct: 0,
    avgYou: 0,
    avgActual: 0,
    mostPicked: null,
    mostPickedCount: 0,
    bestWin: 0,
  });

  useEffect(() => {
    if (!isSelf) {
      setS((prev) => ({ ...prev, ready: true, hide: true }));
      return;
    }
    (async () => {
      const [predsRes, tournRes] = await Promise.all([
        supabase
          .from("predictions")
          .select(
            "home_prediction, away_prediction, points_earned, scored, stake_multiplier, matches(home_team, away_team, home_score, away_score, status)",
          )
          .eq("user_id", userId)
          .eq("scored", true),
        supabase
          .from("matches")
          .select("home_score, away_score")
          .in("status", ["FT", "AET", "PEN"]),
      ]);

      const preds =
        (predsRes.data as
          | Array<{
              home_prediction: number;
              away_prediction: number;
              points_earned: number;
              scored: boolean;
              stake_multiplier: number | null;
              matches: {
                home_team: string;
                away_team: string;
                home_score: number | null;
                away_score: number | null;
                status: string;
              } | null;
            }>
          | null) ?? [];

      const tournTotal =
        (tournRes.data ?? []).reduce(
          (sum, m) =>
            sum + ((m.home_score ?? 0) + (m.away_score ?? 0)),
          0,
        );
      const tournCount = (tournRes.data ?? []).length;
      const avgActual = tournCount > 0 ? tournTotal / tournCount : 0;

      let hits = 0;
      let goalsPredicted = 0;
      let bestWin = 0;
      const teamCount = new Map<string, number>();

      for (const p of preds) {
        if (p.points_earned > 0) hits += 1;
        goalsPredicted += p.home_prediction + p.away_prediction;
        const gain = p.points_earned * (p.stake_multiplier ?? 1);
        if (gain > bestWin) bestWin = gain;

        const m = p.matches;
        if (m) {
          teamCount.set(
            m.home_team,
            (teamCount.get(m.home_team) ?? 0) + 1,
          );
          teamCount.set(
            m.away_team,
            (teamCount.get(m.away_team) ?? 0) + 1,
          );
        }
      }

      let mostPicked: string | null = null;
      let mostPickedCount = 0;
      for (const [team, n] of teamCount) {
        if (n > mostPickedCount) {
          mostPicked = team;
          mostPickedCount = n;
        }
      }

      const totalScored = preds.length;
      const avgYou = totalScored > 0 ? goalsPredicted / totalScored : 0;
      const hitPct = totalScored > 0 ? (hits / totalScored) * 100 : 0;

      setS({
        ready: true,
        hide: totalScored === 0,
        totalScored,
        hitPct,
        avgYou,
        avgActual,
        mostPicked,
        mostPickedCount,
        bestWin,
      });
    })();
  }, [supabase, userId, isSelf]);

  if (!s.ready) return null;
  if (s.hide && isSelf) {
    return (
      <div
        className="mt-8 mb-10 rounded-3xl border border-gray-200 bg-white p-6 text-center"
        dir={dir}
      >
        <BarChart3 className="w-6 h-6 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">{t("yvt.pending")}</p>
      </div>
    );
  }
  if (!isSelf) return null;

  const goalGap = s.avgYou - s.avgActual;
  const goalDirection = goalGap > 0.15 ? "+" : goalGap < -0.15 ? "−" : "±";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8 mb-10 rounded-3xl border border-gray-200 bg-white p-6 relative overflow-hidden"
      dir={dir}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: HOST_TRI_GRADIENT }}
      />

      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-purple-500" />
        <h3 className="font-fifa text-2xl uppercase text-gray-900">
          {t("yvt.title")}
        </h3>
      </div>
      <p className="text-xs text-gray-500 mb-6 leading-snug">{t("yvt.sub")}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Accuracy */}
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-emerald-50 to-white p-4">
          <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold mb-2 flex items-center gap-1">
            <Target className="w-3 h-3" />
            {t("yvt.accuracy")}
          </div>
          <div className="font-fifa text-3xl text-emerald-600" dir="ltr">
            {Math.round(s.hitPct)}%
          </div>
          <div className="text-[10px] text-gray-500 mt-1" dir="ltr">
            {localizeNumber(s.totalScored, lang)} pts
          </div>
        </div>

        {/* Avg you */}
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-blue-50 to-white p-4">
          <div className="text-[10px] uppercase tracking-widest text-blue-700 font-bold mb-2">
            {t("yvt.avgGoals.you")}
          </div>
          <div className="font-fifa text-3xl text-blue-600" dir="ltr">
            {s.avgYou.toFixed(1)}
          </div>
          <div className="text-[10px] text-gray-500 mt-1" dir="ltr">
            {goalDirection}
            {Math.abs(goalGap).toFixed(1)} vs avg
          </div>
        </div>

        {/* Avg tournament */}
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4">
          <div className="text-[10px] uppercase tracking-widest text-gray-600 font-bold mb-2">
            {t("yvt.avgGoals.actual")}
          </div>
          <div className="font-fifa text-3xl text-gray-800" dir="ltr">
            {s.avgActual.toFixed(1)}
          </div>
        </div>

        {/* Most picked */}
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-yellow-50 to-white p-4">
          <div className="text-[10px] uppercase tracking-widest text-yellow-700 font-bold mb-2">
            {t("yvt.mostPicked")}
          </div>
          {s.mostPicked ? (
            <div className="flex items-center gap-2">
              <Flag
                team={s.mostPicked}
                className="w-6 h-6 rounded-full object-cover"
              />
              <div className="min-w-0">
                <div className="font-bold text-sm text-gray-900 truncate">
                  {localizeTeam(s.mostPicked, lang)}
                </div>
                <div className="text-[10px] text-gray-500" dir="ltr">
                  ×{localizeNumber(s.mostPickedCount, lang)}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400">—</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
