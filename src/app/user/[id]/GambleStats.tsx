"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp, TrendingDown, Trophy } from "lucide-react";
import { computeGambleScore, getAllStakes, getStakeById } from "@/lib/gamble";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";

interface FinishedPrediction {
  match_id: string;
  points_earned: number;
  scored: boolean;
}

interface Props {
  isSelf: boolean;
  predictions: FinishedPrediction[];
}

export default function GambleStats({ isSelf, predictions }: Props) {
  const [ready, setReady] = useState(false);
  const [totals, setTotals] = useState({
    total: 0,
    biggestWin: 0,
    biggestLoss: 0,
    gambles: 0,
    exactHits: 0,
  });

  useEffect(() => {
    if (!isSelf) {
      setReady(true);
      return;
    }
    const stakes = getAllStakes();
    let total = 0;
    let biggestWin = 0;
    let biggestLoss = 0;
    let gambles = 0;
    let exactHits = 0;

    predictions.forEach((p) => {
      const stake = getStakeById(stakes[p.match_id]);
      if (stake.mult > 1) gambles += 1;
      const score = computeGambleScore(p.points_earned, p.scored, stake.mult);
      if (score === null) return;
      total += score;
      if (score > biggestWin) biggestWin = score;
      if (score < biggestLoss) biggestLoss = score;
      if (p.points_earned === 3) exactHits += 1;
    });

    setTotals({ total, biggestWin, biggestLoss, gambles, exactHits });
    setReady(true);
  }, [isSelf, predictions]);

  if (!isSelf || !ready) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 mb-10 rounded-3xl border border-gray-200 bg-white p-6 relative overflow-hidden"
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: HOST_TRI_GRADIENT }}
      />

      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-red-500" />
        <h3 className="font-fifa text-2xl uppercase text-gray-900">
          Your Gamble Ledger
        </h3>
        <span className="ml-2 text-[10px] uppercase tracking-widest text-gray-400">
          on-device
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-4">
          <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
            Net gamble
          </div>
          <div
            className={`font-fifa text-3xl ${
              totals.total > 0
                ? "text-emerald-600"
                : totals.total < 0
                  ? "text-red-500"
                  : "text-gray-500"
            }`}
          >
            {totals.total > 0 ? "+" : ""}
            {totals.total}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-emerald-50 to-white p-4">
          <div className="text-[10px] uppercase tracking-widest text-emerald-700 font-bold mb-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Biggest win
          </div>
          <div className="font-fifa text-3xl text-emerald-600">
            +{totals.biggestWin}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-red-50 to-white p-4">
          <div className="text-[10px] uppercase tracking-widest text-red-700 font-bold mb-2 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> Biggest loss
          </div>
          <div className="font-fifa text-3xl text-red-500">
            {totals.biggestLoss}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-yellow-50 to-white p-4">
          <div className="text-[10px] uppercase tracking-widest text-yellow-700 font-bold mb-2 flex items-center gap-1">
            <Trophy className="w-3 h-3" /> Exact hits
          </div>
          <div className="font-fifa text-3xl text-yellow-600">
            {totals.exactHits}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Gamble numbers live on this device. Your global points on the
        leaderboard use base scoring.
      </p>
    </motion.div>
  );
}
