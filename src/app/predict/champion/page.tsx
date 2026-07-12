"use client";

// ─────────────────────────────────────────────────────────────
// Champion prediction picker
//
// Grid of every WC26 team. Tap to select, save button writes to
// meta_predictions with type='champion'. When locked_at is set,
// the picker is read-only.
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Search, Check, Loader2, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { WC26_TEAMS } from "@/lib/wc26-teams";
import { localizeTeam } from "@/lib/i18n-data";
import { Flag } from "@/components/ui/Flag";
import { HOST_GOLD, HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import {
  getChampionPick,
  upsertChampionPick,
} from "@/lib/meta-predictions";

export default function ChampionPredictionPage() {
  const { t, lang, dir } = useI18n();
  const router = useRouter();
  const supabase = createClient();

  const [userId, setUserId] = useState<string | null>(null);
  const [current, setCurrent] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/predict/champion");
        return;
      }
      setUserId(user.id);
      const pick = await getChampionPick(supabase, user.id);
      if (pick) {
        setCurrent(pick.payload.team);
        setSelected(pick.payload.team);
        setLocked(!!pick.locked_at);
      }
      setReady(true);
    })();
  }, [supabase, router]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return WC26_TEAMS;
    return WC26_TEAMS.filter((tm) => {
      const en = tm.name.toLowerCase();
      const ar = localizeTeam(tm.name, "ar").toLowerCase();
      return en.includes(q) || ar.includes(q);
    });
  }, [query]);

  const save = async () => {
    if (!userId || !selected) return;
    setSaving(true);
    await upsertChampionPick(supabase, userId, selected);
    setCurrent(selected);
    setSaving(false);
  };

  const dirty = selected !== null && selected !== current;
  const iconPos = dir === "rtl" ? "right-3" : "left-3";
  const inputPad = dir === "rtl" ? "pr-10 pl-4" : "pl-10 pr-4";

  return (
    <div
      className="min-h-screen pt-8 pb-32 px-4 sm:px-6 relative overflow-hidden"
      dir={dir}
    >
      <div className="max-w-4xl mx-auto relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip-auto" />
          {t("nav.home")}
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow"
              style={{ background: `linear-gradient(135deg, ${HOST_GOLD}, #FFDA6B)` }}
            >
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-fifa text-3xl md:text-4xl uppercase text-gray-900 leading-none">
                {t("meta.champion.title")}
              </h1>
              <div
                className="tri-underline mt-3 w-32"
                style={{ background: HOST_TRI_GRADIENT }}
              />
            </div>
          </div>
          <p className="text-gray-500 text-sm max-w-xl">
            {t("meta.champion.sub")}
          </p>
        </div>

        {/* Current pick card */}
        {ready && (
          <div className="rounded-3xl border border-gray-200 bg-white p-4 md:p-5 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-50 border border-yellow-100 flex items-center justify-center shrink-0">
              {current ? (
                <Flag
                  team={current}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <Trophy className="w-5 h-5 text-yellow-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                {t("meta.champion.your")}
              </div>
              <div className="font-fifa text-xl text-gray-900 truncate">
                {current
                  ? localizeTeam(current, lang)
                  : t("meta.champion.none")}
              </div>
            </div>
            {locked && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                <Lock className="w-3 h-3" /> {t("meta.locked")}
              </span>
            )}
          </div>
        )}

        {/* Team grid — hidden if locked */}
        {ready && !locked && (
          <>
            <div className="relative mb-4">
              <Search
                className={`absolute ${iconPos} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("ob.team.search")}
                className={`w-full ${inputPad} py-2.5 rounded-xl bg-white border border-gray-200 focus:border-wc-purple focus:outline-none text-sm text-gray-900`}
              />
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-6">
              {filtered.map((tm) => {
                const active = selected === tm.name;
                return (
                  <button
                    key={tm.name}
                    type="button"
                    onClick={() => setSelected(tm.name)}
                    className={`relative rounded-2xl border-2 p-3 flex flex-col items-center gap-2 transition-all active:scale-95 ${
                      active
                        ? "border-yellow-400 bg-yellow-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
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
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-1 end-1 w-4 h-4 rounded-full bg-yellow-500 text-white flex items-center justify-center"
                      >
                        <Check className="w-3 h-3" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {!ready && (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Sticky save bar */}
      {ready && !locked && dirty && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+72px)] md:bottom-6 z-30 flex justify-center px-4"
        >
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white shadow-xl disabled:opacity-60"
            style={{
              background: `linear-gradient(135deg, ${HOST_GOLD}, #F59E0B)`,
              boxShadow: `0 12px 40px rgba(255,184,28,0.5)`,
            }}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {t("meta.pick")}
          </button>
        </motion.div>
      )}
    </div>
  );
}
