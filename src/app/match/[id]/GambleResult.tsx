"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trophy, XCircle, TrendingUp, TrendingDown } from "lucide-react";
import {
  computeGambleScore,
  getStake,
  getStakeById,
} from "@/lib/gamble";
import { Confetti } from "@/components/ui/Confetti";
import { useI18n } from "@/lib/i18n";

interface Props {
  matchId: string;
  pointsEarned: number;
  scored: boolean;
  userHome: number;
  userAway: number;
  actualHome: number;
  actualAway: number;
}

export default function GambleResult({
  matchId,
  pointsEarned,
  scored,
  userHome,
  userAway,
  actualHome,
  actualAway,
}: Props) {
  const [stake, setStake] = useState(getStakeById("safe"));
  const [confetti, setConfetti] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const s = getStakeById(getStake(matchId));
    setStake(s);
    if (scored && pointsEarned > 0 && s.mult >= 3) {
      const timer = setTimeout(() => setConfetti(true), 500);
      return () => clearTimeout(timer);
    }
  }, [matchId, pointsEarned, scored]);

  const gambleScore = computeGambleScore(pointsEarned, scored, stake.mult);
  const isWin = (gambleScore ?? 0) > 0;
  const isLoss = (gambleScore ?? 0) < 0;
  const isExact = pointsEarned === 3;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border-2 p-6 md:p-8 text-center relative overflow-hidden"
        style={{
          borderColor: isWin ? stake.color : isLoss ? "#EF4444" : "#E5E7EB",
          background: isWin
            ? `linear-gradient(135deg, ${stake.color}0a, white 60%)`
            : isLoss
              ? "linear-gradient(135deg, #EF44440a, white 60%)"
              : "white",
        }}
      >
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
          {t("result.title")} — {t(`stake.${stake.id}`)} ({stake.mult}x)
        </div>

        <div className="flex items-center justify-center gap-6 mb-4">
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
              {t("result.pick")}
            </div>
            <div className="font-fifa text-3xl text-gray-700" dir="ltr">
              {userHome}–{userAway}
            </div>
          </div>
          <div className="w-px h-12 bg-gray-200" />
          <div className="text-center">
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
              {t("result.actual")}
            </div>
            <div className="font-fifa text-3xl text-gray-900" dir="ltr">
              {actualHome}–{actualAway}
            </div>
          </div>
        </div>

        <div
          className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl font-fifa text-3xl md:text-4xl shadow-lg"
          style={{
            background: isWin
              ? `linear-gradient(135deg, ${stake.color}, ${stake.ring})`
              : isLoss
                ? "linear-gradient(135deg, #EF4444, #F87171)"
                : "linear-gradient(135deg, #9CA3AF, #D1D5DB)",
            color: "white",
          }}
        >
          {isWin ? (
            <TrendingUp className="w-7 h-7" />
          ) : isLoss ? (
            <TrendingDown className="w-7 h-7" />
          ) : (
            <XCircle className="w-7 h-7" />
          )}
          <span dir="ltr">
            {gambleScore === null
              ? t("result.pending")
              : `${gambleScore > 0 ? "+" : ""}${gambleScore}`}
          </span>
        </div>

        {isExact && (
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-100 text-yellow-800 font-bold text-xs uppercase tracking-widest">
            <Trophy className="w-4 h-4" /> {t("result.exact")}
          </div>
        )}

        {stake.mult > 1 && (
          <p className="mt-4 text-xs text-gray-500">
            {t("result.base")}: <span className="font-bold">{pointsEarned}</span>
            {" · "}
            {t("result.mult")}: <span className="font-bold">{stake.mult}x</span>
          </p>
        )}
      </motion.div>
      <Confetti active={confetti} />
    </>
  );
}
