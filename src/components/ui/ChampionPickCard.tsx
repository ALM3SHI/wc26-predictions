"use client";

// ─────────────────────────────────────────────────────────────
// Home page teaser card for the champion prediction. Shows the
// current pick if any, otherwise a call-to-action. Silently
// short-circuits to null while the meta_predictions migration
// hasn't been applied yet (the query returns an error we swallow).
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { localizeTeam } from "@/lib/i18n-data";
import { Flag } from "@/components/ui/Flag";
import { HOST_GOLD } from "@/lib/wc26-theme";
import { getChampionPick } from "@/lib/meta-predictions";

export function ChampionPickCard() {
  const { t, lang, dir } = useI18n();
  const supabase = createClient();
  const [state, setState] = useState<
    { team: string | null; ready: boolean; hide: boolean }
  >({ team: null, ready: false, hide: false });

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setState({ team: null, ready: true, hide: true });
        return;
      }
      try {
        const pick = await getChampionPick(supabase, user.id);
        setState({
          team: pick?.payload.team ?? null,
          ready: true,
          hide: false,
        });
      } catch {
        // Migration not yet applied — hide the card entirely.
        setState({ team: null, ready: true, hide: true });
      }
    })();
  }, [supabase]);

  if (!state.ready || state.hide) return null;

  const hasPick = !!state.team;

  return (
    <Link href="/predict/champion" className="block group" dir={dir}>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-3xl p-4 md:p-5 overflow-hidden shadow-sm border transition-transform group-active:scale-[0.98]"
        style={{
          background: hasPick
            ? "linear-gradient(135deg, #FFFBEB, white 70%)"
            : "linear-gradient(135deg, #FFB81C, #F59E0B 60%, #C8102E)",
          borderColor: hasPick ? "#FFDA6B" : "transparent",
          color: hasPick ? undefined : "white",
        }}
      >
        <div className="flex items-center gap-4 relative z-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md"
            style={{
              background: hasPick
                ? `linear-gradient(135deg, ${HOST_GOLD}, #FFDA6B)`
                : "rgba(255,255,255,0.2)",
              backdropFilter: "blur(4px)",
            }}
          >
            {hasPick && state.team ? (
              <Flag
                team={state.team}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <Trophy className="w-6 h-6 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div
              className="text-[10px] uppercase tracking-widest font-bold opacity-80"
              style={{ color: hasPick ? "#B45309" : "rgba(255,255,255,0.9)" }}
            >
              {hasPick
                ? t("meta.champion.your")
                : t("meta.champion.cta.home")}
            </div>
            <div
              className="font-fifa text-xl md:text-2xl leading-tight"
              style={{ color: hasPick ? "#111" : "white" }}
            >
              {hasPick && state.team
                ? localizeTeam(state.team, lang)
                : t("meta.champion.title")}
            </div>
            <div
              className="text-xs mt-1 opacity-90"
              style={{ color: hasPick ? "#6B7280" : "rgba(255,255,255,0.9)" }}
            >
              {hasPick
                ? t("meta.change")
                : t("meta.champion.cta.homeSub")}
            </div>
          </div>

          <ArrowRight
            className="w-5 h-5 rtl-flip-auto shrink-0"
            style={{ color: hasPick ? "#B45309" : "white" }}
          />
        </div>
      </motion.div>
    </Link>
  );
}
