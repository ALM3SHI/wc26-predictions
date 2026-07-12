"use client";

// ─────────────────────────────────────────────────────────────
// First-run onboarding
//
// Renders a full-screen 3-step flow the first time a signed-in
// user lands on the app after profiles.onboarding_completed is
// still false:
//   1. Welcome hero
//   2. Favorite team pick (searchable grid, skippable)
//   3. How the multiplier works (3-card explainer)
//
// On finish we set profiles.onboarding_completed = true and
// persist favorite_team if the user picked one.
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Search,
  Trophy,
  Flame,
  Zap,
  Sparkles,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { WC26_TEAMS } from "@/lib/wc26-teams";
import { localizeTeam } from "@/lib/i18n-data";
import { Flag } from "@/components/ui/Flag";
import { HOST_TRI_GRADIENT, HOST_GOLD } from "@/lib/wc26-theme";
import { STAKES, getStakeById } from "@/lib/gamble";

interface Props {
  userId: string;
  onDone: () => void;
}

const TOTAL_STEPS = 3;

export function OnboardingFlow({ userId, onDone }: Props) {
  const { t, lang, dir } = useI18n();
  const [step, setStep] = useState(1);
  const [team, setTeam] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return WC26_TEAMS;
    return WC26_TEAMS.filter((t) => {
      const en = t.name.toLowerCase();
      const ar = localizeTeam(t.name, "ar").toLowerCase();
      return en.includes(q) || ar.includes(q);
    });
  }, [query]);

  // Prevent body scroll while the sheet is open — modal semantics.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const next = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));

  const finish = async () => {
    setSaving(true);
    await supabase
      .from("profiles")
      .update({
        favorite_team: team,
        onboarding_completed: true,
      })
      .eq("id", userId);
    setSaving(false);
    onDone();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-white"
      dir={dir}
    >
      <div className="max-w-2xl mx-auto h-full flex flex-col px-4 pt-6 pb-safe">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-4">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i < step ? "bg-wc-purple" : "bg-gray-200"
              }`}
            />
          ))}
        </div>
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-6">
          {t("ob.step")} <span dir="ltr">{step}</span> {t("ob.of")}{" "}
          <span dir="ltr">{TOTAL_STEPS}</span>
        </p>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center flex flex-col items-center pt-8"
              >
                <div
                  className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6 text-white shadow-xl"
                  style={{
                    background: HOST_TRI_GRADIENT,
                    boxShadow: `0 20px 60px rgba(0,40,104,0.35)`,
                  }}
                >
                  <Sparkles className="w-10 h-10" />
                </div>
                <h1 className="font-fifa text-4xl md:text-5xl uppercase text-gray-900 mb-3">
                  {t("ob.welcome.title")}
                </h1>
                <p className="text-gray-500 max-w-sm mx-auto">
                  {t("ob.welcome.sub")}
                </p>

                <div className="grid grid-cols-3 gap-3 mt-10 w-full max-w-sm">
                  {[
                    { icon: Trophy, label: t("ob.team.title") },
                    { icon: Zap, label: t("ob.stake.title") },
                    { icon: Flame, label: t("ob.streak.title") },
                  ].map((v) => (
                    <div
                      key={v.label}
                      className="rounded-2xl border border-gray-200 p-3 flex flex-col items-center gap-2 text-center"
                    >
                      <v.icon className="w-5 h-5 text-wc-purple" />
                      <div className="text-[10px] font-bold text-gray-600 leading-tight">
                        {v.label}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="team"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col h-full"
              >
                <h1 className="font-fifa text-3xl md:text-4xl uppercase text-gray-900 mb-2">
                  {t("ob.team.title")}
                </h1>
                <p className="text-gray-500 mb-4 text-sm">
                  {t("ob.team.sub")}
                </p>

                <div className="relative mb-4">
                  <Search
                    className={`absolute ${
                      dir === "rtl" ? "right-3" : "left-3"
                    } top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`}
                  />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t("ob.team.search")}
                    className={`w-full ${
                      dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4"
                    } py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-wc-purple focus:outline-none text-sm text-gray-900`}
                  />
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 overflow-y-auto pb-6">
                  {filtered.map((tm) => {
                    const active = team === tm.name;
                    return (
                      <button
                        key={tm.name}
                        type="button"
                        onClick={() => setTeam(active ? null : tm.name)}
                        className={`relative rounded-2xl border-2 p-3 flex flex-col items-center gap-2 transition-all active:scale-95 ${
                          active
                            ? "border-wc-purple bg-purple-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Flag
                          team={tm.name}
                          className="w-10 h-10 rounded-full object-cover shadow border border-gray-100"
                        />
                        <div className="text-[10px] font-bold text-gray-700 text-center leading-tight line-clamp-2">
                          {localizeTeam(tm.name, lang)}
                        </div>
                        {active && (
                          <div className="absolute top-1 end-1 w-4 h-4 rounded-full bg-wc-purple text-white flex items-center justify-center">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="stake"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col"
              >
                <h1 className="font-fifa text-3xl md:text-4xl uppercase text-gray-900 mb-2">
                  {t("ob.stake.title")}
                </h1>
                <p className="text-gray-500 mb-6 text-sm">{t("ob.stake.sub")}</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  {STAKES.map((s) => {
                    const stake = getStakeById(s.id);
                    return (
                      <div
                        key={s.id}
                        className="rounded-2xl border-2 p-3 flex flex-col items-center text-center"
                        style={{
                          borderColor: `${stake.color}55`,
                          background: `linear-gradient(135deg, ${stake.color}0f, white 60%)`,
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-fifa text-lg mb-2"
                          style={{
                            background: stake.color,
                            boxShadow: `0 6px 20px ${stake.glow}`,
                          }}
                        >
                          {stake.mult}x
                        </div>
                        <div className="font-bold text-sm text-gray-900">
                          {t(`stake.${s.id}`)}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 leading-tight">
                          {t(`stake.${s.id}.tagline`)}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white"
                    style={{ background: HOST_GOLD }}
                  >
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-900">
                      {t("ob.streak.title")}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 leading-snug">
                      {t("ob.streak.sub")}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer nav */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 mt-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={back}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-900 px-3 py-2"
            >
              <ArrowLeft className="w-4 h-4 rtl-flip-auto" />
              {t("ob.back")}
            </button>
          ) : (
            <span />
          )}

          {step === 2 && !team && (
            <button
              type="button"
              onClick={next}
              className="text-sm font-bold text-gray-400 px-3 py-2"
            >
              {t("ob.team.skip")}
            </button>
          )}

          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 gradient-purple-cyan text-white font-bold px-5 py-2.5 rounded-xl active:scale-95"
            >
              {t("ob.next")}
              <ArrowRight className="w-4 h-4 rtl-flip-auto" />
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={saving}
              className="inline-flex items-center gap-1.5 gradient-purple-cyan text-white font-bold px-5 py-2.5 rounded-xl active:scale-95 disabled:opacity-60"
            >
              {t("ob.finish")}
              <ArrowRight className="w-4 h-4 rtl-flip-auto" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
