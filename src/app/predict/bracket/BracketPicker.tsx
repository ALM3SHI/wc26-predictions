"use client";

// ─────────────────────────────────────────────────────────────
// Bracket picker
//
// One column per knockout round. Matches whose teams are still
// TBD render as empty placeholders (`— vs —`) so the QF/SF/Final
// don't fabricate matchups that the tournament hasn't actually
// produced yet. Real teams only appear once the DB row carries
// them.
//
// Payload shape:
//   { r16: { match_id: winner_team }, qf: {...}, sf: {...}, final: winner_team }
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2, Check, Lock, LayoutGrid } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { localizeRound, localizeTeam } from "@/lib/i18n-data";
import { Flag } from "@/components/ui/Flag";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import {
  getBracketPick,
  upsertBracketPick,
} from "@/lib/meta-predictions";
import type { BracketPayload } from "@/lib/types";

interface MatchRow {
  id: string;
  round: string;
  home_team: string;
  away_team: string;
  start_time: string;
  status: string;
}

interface Props {
  userId: string;
  matches: MatchRow[];
}

// Map DB round labels to bracket payload keys.
const ROUND_KEY: Record<string, keyof BracketPayload> = {
  "Round of 32": "r16", // WC26 doesn't have R32 in payload — collapse
  "Round of 16": "r16",
  "Quarter-finals": "qf",
  "Semi-finals": "sf",
  Final: "final",
};

const ORDERED_ROUNDS = [
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
];

export default function BracketPicker({ userId, matches }: Props) {
  const { t, lang, dir } = useI18n();
  const supabase = createClient();

  const [picks, setPicks] = useState<BracketPayload>({});
  const [current, setCurrent] = useState<BracketPayload | null>(null);
  const [locked, setLocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, MatchRow[]>();
    for (const m of matches) {
      const arr = map.get(m.round) ?? [];
      arr.push(m);
      map.set(m.round, arr);
    }
    return ORDERED_ROUNDS.filter((r) => map.has(r)).map((r) => ({
      round: r,
      matches: map.get(r)!,
    }));
  }, [matches]);

  useEffect(() => {
    (async () => {
      const pick = await getBracketPick(supabase, userId);
      if (pick) {
        setCurrent(pick.payload);
        setPicks(pick.payload);
        setLocked(!!pick.locked_at);
      }
      setReady(true);
    })();
  }, [supabase, userId]);

  const pickWinner = (round: string, matchId: string, team: string) => {
    if (locked) return;
    const key = ROUND_KEY[round];
    if (!key) return;
    setPicks((prev) => {
      const next: BracketPayload = { ...prev };
      if (key === "final") {
        next.final = team;
      } else {
        const bucket = { ...(next[key] as Record<string, string> | undefined) };
        bucket[matchId] = team;
        next[key] = bucket;
      }
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    await upsertBracketPick(supabase, userId, picks);
    setCurrent(picks);
    setSaving(false);
  };

  const winnerFor = (round: string, matchId: string): string | undefined => {
    const key = ROUND_KEY[round];
    if (!key) return undefined;
    if (key === "final") return picks.final;
    const bucket = picks[key] as Record<string, string> | undefined;
    return bucket?.[matchId];
  };

  const dirty =
    ready && JSON.stringify(picks) !== JSON.stringify(current ?? {});

  return (
    <div
      className="min-h-screen pt-8 pb-32 px-4 sm:px-6 relative overflow-hidden"
      dir={dir}
    >
      <div className="max-w-6xl mx-auto relative z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip-auto" />
          {t("nav.home")}
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow">
              <LayoutGrid className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-fifa text-3xl md:text-4xl uppercase text-gray-900 leading-none">
                {t("meta.bracket.title")}
              </h1>
              <div
                className="tri-underline mt-3 w-32"
                style={{ background: HOST_TRI_GRADIENT }}
              />
            </div>
          </div>
          <p className="text-gray-500 text-sm max-w-xl">
            {t("meta.bracket.sub")}
          </p>
          {locked && (
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
              <Lock className="w-3 h-3" /> {t("meta.locked")}
            </div>
          )}
        </div>

        {!ready && (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        )}

        {ready && grouped.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            {t("bracket.empty")}
          </div>
        )}

        {ready && grouped.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {grouped.map((col) => (
              <div key={col.round}>
                <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">
                  {localizeRound(col.round, lang)}
                </div>
                <div className="space-y-3">
                  {col.matches.map((m) => {
                    const chosen = winnerFor(col.round, m.id);
                    const homeResolved =
                      m.home_team && m.home_team !== "TBD";
                    const awayResolved =
                      m.away_team && m.away_team !== "TBD";
                    const isPlaceholder = !homeResolved || !awayResolved;

                    if (isPlaceholder) {
                      return (
                        <div
                          key={m.id}
                          className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 overflow-hidden opacity-70"
                        >
                          {(["home", "away"] as const).map((slot) => (
                            <div
                              key={slot}
                              className="w-full flex items-center gap-3 px-3 py-2.5 border-b border-dashed border-gray-100 last:border-b-0 text-start"
                            >
                              <div className="w-6 h-6 rounded-full border border-dashed border-gray-300 shrink-0" />
                              <span className="flex-1 text-sm font-bold text-gray-400 truncate uppercase tracking-widest">
                                TBD
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={m.id}
                        className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
                      >
                        {[m.home_team, m.away_team].map((team) => {
                          const active = chosen === team;
                          return (
                            <button
                              key={team}
                              type="button"
                              onClick={() =>
                                pickWinner(col.round, m.id, team)
                              }
                              disabled={locked}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 border-b border-gray-100 last:border-b-0 text-start transition-colors ${
                                active
                                  ? "bg-emerald-50"
                                  : "hover:bg-gray-50 disabled:hover:bg-transparent"
                              }`}
                            >
                              <Flag
                                team={team}
                                className="w-6 h-6 rounded-full object-cover border border-gray-100 shrink-0"
                              />
                              <span
                                className={`flex-1 text-sm font-bold truncate ${
                                  active ? "text-emerald-700" : "text-gray-900"
                                }`}
                              >
                                {localizeTeam(team, lang)}
                              </span>
                              {active && (
                                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ready && !locked && dirty && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+96px)] md:bottom-6 z-30 flex justify-center px-4"
        >
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white shadow-xl gradient-purple-cyan disabled:opacity-60"
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
