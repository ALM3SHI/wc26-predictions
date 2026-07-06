"use client";

import { useState } from "react";
import { Match, Prediction } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { NeonButton } from "@/components/ui/NeonButton";
import { GlassCard } from "@/components/ui/GlassCard";

interface Props {
  match: Match;
  prediction: Prediction | null;
  userId: string;
}

export default function PredictionForm({ match, prediction, userId }: Props) {
  const [homeScore, setHomeScore] = useState<number | "">(
    prediction ? prediction.home_prediction : ""
  );
  const [awayScore, setAwayScore] = useState<number | "">(
    prediction ? prediction.away_prediction : ""
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const router = useRouter();
  const supabase = createClient();

  // Match is locked if it has already started
  const isLocked = new Date(match.start_time).getTime() < Date.now();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setMessage({ type: "error", text: "Match is locked." });
      return;
    }
    if (homeScore === "" || awayScore === "") {
      setMessage({ type: "error", text: "Please enter a valid score." });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase
      .from("predictions")
      .upsert(
        {
          match_id: match.id,
          user_id: userId,
          home_prediction: Number(homeScore),
          away_prediction: Number(awayScore),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "match_id,user_id" }
      );

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
      return;
    }

    setMessage({ type: "success", text: "Prediction saved!" });
    setLoading(false);
    router.refresh(); // Refresh RSC data
  };

  return (
    <GlassCard className="mt-8 p-6 md:p-8 max-w-2xl mx-auto text-center" glow="purple">
      <h3 className="font-display font-bold text-2xl mb-2">Your Prediction</h3>
      <p className="text-white/50 mb-8">
        {isLocked
          ? "This match is locked. Predictions can no longer be edited."
          : "Enter your predicted scoreline below before kickoff."}
      </p>

      <form onSubmit={handleSubmit}>
        <div className="flex items-center justify-center gap-4 md:gap-8 mb-8">
          {/* Home Team Input */}
          <div className="flex flex-col items-center gap-3">
            {match.home_team_logo ? (
              <img src={match.home_team_logo} alt={match.home_team} className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/10" />
            )}
            <span className="font-bold font-display text-lg hidden sm:block">{match.home_team}</span>
            <input
              type="number"
              min="0"
              max="20"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value === "" ? "" : parseInt(e.target.value))}
              disabled={isLocked || loading}
              className="w-20 md:w-24 h-24 text-center font-display font-black text-4xl md:text-5xl rounded-2xl bg-wc-surface border border-wc-purple/30 focus:border-wc-purple focus:outline-none focus:ring-2 focus:ring-wc-purple/50 disabled:opacity-50 transition-all"
            />
          </div>

          <span className="font-display font-black text-3xl text-white/30">-</span>

          {/* Away Team Input */}
          <div className="flex flex-col items-center gap-3">
            {match.away_team_logo ? (
              <img src={match.away_team_logo} alt={match.away_team} className="w-16 h-16 object-contain" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/10" />
            )}
            <span className="font-bold font-display text-lg hidden sm:block">{match.away_team}</span>
            <input
              type="number"
              min="0"
              max="20"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value === "" ? "" : parseInt(e.target.value))}
              disabled={isLocked || loading}
              className="w-20 md:w-24 h-24 text-center font-display font-black text-4xl md:text-5xl rounded-2xl bg-wc-surface border border-wc-purple/30 focus:border-wc-purple focus:outline-none focus:ring-2 focus:ring-wc-purple/50 disabled:opacity-50 transition-all"
            />
          </div>
        </div>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center justify-center gap-2 p-4 rounded-xl mb-6 ${
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
          <NeonButton
            type="submit"
            variant="purple"
            size="lg"
            className="w-full sm:w-auto min-w-[200px]"
            disabled={loading}
            loading={loading}
          >
            {prediction ? "Update Prediction" : "Save Prediction"}
          </NeonButton>
        )}
      </form>
    </GlassCard>
  );
}
