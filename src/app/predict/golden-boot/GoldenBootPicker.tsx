"use client";

// ─────────────────────────────────────────────────────────────
// Golden Boot picker client component
//
// Searchable list of the top scorers currently returned by
// football-data.org, tap-to-select then save. Same lock semantics
// as the champion picker.
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  Check,
  Loader2,
  Lock,
  ArrowLeft,
  Crown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { localizeTeam } from "@/lib/i18n-data";
import { Flag } from "@/components/ui/Flag";
import { HOST_GOLD, HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import type { FDScorer } from "@/lib/football-data";
import {
  getGoldenBootPick,
  upsertGoldenBootPick,
} from "@/lib/meta-predictions";
import type { GoldenBootPayload } from "@/lib/types";

interface Props {
  userId: string;
  scorers: FDScorer[];
}

export default function GoldenBootPicker({ userId, scorers }: Props) {
  const { t, lang, dir } = useI18n();
  const supabase = createClient();

  const [current, setCurrent] = useState<GoldenBootPayload | null>(null);
  const [selected, setSelected] = useState<GoldenBootPayload | null>(null);
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    (async () => {
      const pick = await getGoldenBootPick(supabase, userId);
      if (pick) {
        setCurrent(pick.payload);
        setSelected(pick.payload);
        setLocked(!!pick.locked_at);
      }
      setReady(true);
    })();
  }, [supabase, userId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scorers;
    return scorers.filter((s) => {
      const name = s.player.name.toLowerCase();
      const team = s.team.name.toLowerCase();
      const nat = s.player.nationality.toLowerCase();
      return name.includes(q) || team.includes(q) || nat.includes(q);
    });
  }, [query, scorers]);

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    await upsertGoldenBootPick(supabase, userId, selected);
    setCurrent(selected);
    setSaving(false);
  };

  const dirty =
    selected !== null &&
    (current === null || selected.player_id !== current.player_id);

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
              style={{
                background: `linear-gradient(135deg, ${HOST_GOLD}, #FFDA6B)`,
              }}
            >
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-fifa text-3xl md:text-4xl uppercase text-gray-900 leading-none">
                {t("meta.gb.title")}
              </h1>
              <div
                className="tri-underline mt-3 w-32"
                style={{ background: HOST_TRI_GRADIENT }}
              />
            </div>
          </div>
          <p className="text-gray-500 text-sm max-w-xl">{t("meta.gb.sub")}</p>
        </div>

        {/* Current pick card */}
        {ready && (
          <div className="rounded-3xl border border-gray-200 bg-white p-4 md:p-5 mb-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-50 border border-yellow-100 flex items-center justify-center shrink-0">
              {current ? (
                <Flag
                  team={current.team}
                  className="w-9 h-9 rounded-full object-cover"
                />
              ) : (
                <Crown className="w-5 h-5 text-yellow-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                {t("meta.gb.your")}
              </div>
              <div className="font-fifa text-xl text-gray-900 truncate">
                {current ? current.player_name : t("meta.gb.none")}
              </div>
              {current && (
                <div className="text-xs text-gray-500 mt-0.5">
                  {localizeTeam(current.team, lang)}
                </div>
              )}
            </div>
            {locked && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                <Lock className="w-3 h-3" /> {t("meta.locked")}
              </span>
            )}
          </div>
        )}

        {ready && !locked && scorers.length > 0 && (
          <>
            <div className="relative mb-4">
              <Search
                className={`absolute ${iconPos} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("meta.gb.search")}
                className={`w-full ${inputPad} py-2.5 rounded-xl bg-white border border-gray-200 focus:border-wc-purple focus:outline-none text-sm text-gray-900`}
              />
            </div>

            <div className="grid gap-2">
              {filtered.map((s) => {
                const isSel = selected?.player_id === s.player.id;
                return (
                  <button
                    key={s.player.id}
                    type="button"
                    onClick={() =>
                      setSelected({
                        player_id: s.player.id,
                        player_name: s.player.name,
                        team: s.team.name,
                      })
                    }
                    className={`relative flex items-center gap-3 rounded-2xl p-3 border-2 text-start transition-all active:scale-[0.98] ${
                      isSel
                        ? "border-yellow-400 bg-yellow-50"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <Flag
                      team={s.player.nationality}
                      className="w-9 h-9 rounded-full object-cover shadow border border-gray-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-gray-900 truncate">
                        {s.player.name}
                      </div>
                      <div className="text-[10px] uppercase tracking-widest text-gray-500 truncate">
                        {localizeTeam(s.team.shortName || s.team.name, lang)}
                      </div>
                    </div>
                    <div
                      className="font-fifa text-xl text-gray-900 min-w-[36px] text-end"
                      dir="ltr"
                    >
                      {s.goals}
                    </div>
                    {isSel && (
                      <div className="w-5 h-5 rounded-full bg-yellow-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {ready && !locked && scorers.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            {t("insights.ticker.empty")}
          </div>
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
