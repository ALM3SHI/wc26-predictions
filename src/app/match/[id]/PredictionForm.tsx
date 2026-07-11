"use client";

import { useEffect, useState } from "react";
import { Match, Prediction } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { ScoreDial } from "@/components/ui/ScoreDial";
import { StakeSelector } from "@/components/ui/StakeSelector";
import { CountdownDigits } from "@/components/ui/CountdownDigits";
import { LockInScreen } from "@/components/ui/LockInScreen";
import { Confetti } from "@/components/ui/Confetti";
import { sfx } from "@/components/ui/SoundFX";
import {
  getStake,
  setStake,
  getStakeById,
  type StakeId,
} from "@/lib/gamble";
import { HOST_RED, HOST_BLUE } from "@/lib/wc26-theme";
import { useI18n } from "@/lib/i18n";

interface Props {
  match: Match;
  prediction: Prediction | null;
  userId: string;
}

export default function PredictionForm({ match, prediction, userId }: Props) {
  const { t } = useI18n();
  const [homeScore, setHomeScore] = useState<number>(
    prediction ? prediction.home_prediction : 1,
  );
  const [awayScore, setAwayScore] = useState<number>(
    prediction ? prediction.away_prediction : 0,
  );
  const [stakeId, setStakeId] = useState<StakeId>("safe");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [lockInOpen, setLockInOpen] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const selectedStake = getStakeById(stakeId);

  useEffect(() => {
    setStakeId(getStake(match.id));
  }, [match.id]);

  useEffect(() => {
    setIsLocked(new Date(match.start_time).getTime() <= Date.now());
  }, [match.start_time]);

  const onStakeChange = (id: StakeId) => {
    setStakeId(id);
    sfx.chip();
  };

  const bumpHome = (n: number) => {
    setHomeScore(n);
    sfx.tick();
  };
  const bumpAway = (n: number) => {
    setAwayScore(n);
    sfx.tick();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setMessage({ type: "error", text: t("match.locked") });
      sfx.fail();
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.from("predictions").upsert(
      {
        match_id: match.id,
        user_id: userId,
        home_prediction: homeScore,
        away_prediction: awayScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id,user_id" },
    );

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
      sfx.fail();
      return;
    }

    setStake(match.id, stakeId);
    setLoading(false);
    setLockInOpen(true);
    sfx.lockIn();
    if (selectedStake.mult >= 3) setConfetti(true);
    setMessage({ type: "success", text: t("match.saved") });
  };

  const closeLockIn = () => {
    setLockInOpen(false);
    setConfetti(false);
    router.refresh();
  };

  return (
    <>
      <div className="mt-4 relative overflow-hidden">
        <div className="mb-8 flex flex-col items-center gap-2">
          <CountdownDigits
            target={match.start_time}
            label={t("match.countdown")}
            accentColor={isLocked ? "#EF4444" : "#06B6D4"}
            onLock={() => setIsLocked(true)}
          />
          <div className="tri-underline w-40 mt-3" />
        </div>

        <p className="text-gray-500 mb-8 font-semibold text-center px-2">
          {isLocked ? t("match.locked") : t("match.dial")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div
            className="rounded-3xl p-4 md:p-8 border border-gray-200 bg-white shadow-sm"
            style={{
              backgroundImage:
                "radial-gradient(circle at 15% 20%, rgba(200,16,46,0.05), transparent 40%), radial-gradient(circle at 85% 80%, rgba(0,40,104,0.05), transparent 40%)",
            }}
          >
            <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-12">
              <ScoreDial
                value={homeScore}
                onChange={bumpHome}
                disabled={isLocked || loading}
                accentColor={HOST_RED}
                label={match.home_team}
              />
              <div className="flex flex-col items-center pt-4">
                <span className="font-fifa text-3xl md:text-5xl text-gray-300 leading-none">
                  –
                </span>
                <span className="mt-3 text-[9px] md:text-[10px] uppercase tracking-widest text-gray-400 font-bold whitespace-nowrap">
                  {t("match.fulltime")}
                </span>
              </div>
              <ScoreDial
                value={awayScore}
                onChange={bumpAway}
                disabled={isLocked || loading}
                accentColor={HOST_BLUE}
                label={match.away_team}
              />
            </div>
          </div>

          {!isLocked && (
            <StakeSelector
              value={stakeId}
              onChange={onStakeChange}
              disabled={loading}
            />
          )}

          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center justify-center gap-2 p-4 rounded-xl ${
                message.type === "success"
                  ? "bg-wc-green/10 text-wc-green border border-wc-green/20"
                  : "bg-wc-red/10 text-wc-red border border-wc-red/20"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{message.text}</span>
            </motion.div>
          )}

          {!isLocked && (
            <div className="flex justify-center">
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative min-w-[220px] px-6 py-4 rounded-2xl font-fifa text-lg md:text-xl tracking-widest uppercase text-white shadow-xl disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center justify-center gap-3 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${selectedStake.color}, ${selectedStake.ring})`,
                  boxShadow: `0 12px 40px ${selectedStake.glow}`,
                }}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Lock className="w-5 h-5" />
                )}
                {prediction ? t("cta.update") : t("cta.lock")}
                <span className="ml-1 text-white/70 text-sm">
                  ({selectedStake.mult}x)
                </span>
              </motion.button>
            </div>
          )}
        </form>
      </div>

      <LockInScreen
        open={lockInOpen}
        onClose={closeLockIn}
        homeTeam={match.home_team}
        awayTeam={match.away_team}
        homeScore={homeScore}
        awayScore={awayScore}
        stakeId={stakeId}
      />
      <Confetti active={confetti} />
    </>
  );
}
