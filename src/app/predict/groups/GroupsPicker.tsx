"use client";

// ─────────────────────────────────────────────────────────────
// Group standings picker
//
// For every group we render the 4 teams as reorderable rows.
// Move-up / move-down buttons drive the state — no drag-and-drop
// library since a) it's overkill for 4 items and b) we want touch
// gestures to feel snappy without a heavy dependency.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  LayoutGrid,
  Loader2,
  Check,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n";
import { localizeRound, localizeTeam } from "@/lib/i18n-data";
import { Flag } from "@/components/ui/Flag";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import {
  getGroupStandingsPick,
  upsertGroupStandingsPick,
} from "@/lib/meta-predictions";
import type { GroupStandingsPayload } from "@/lib/types";

interface Props {
  userId: string;
  groups: Array<{ group: string; teams: string[] }>;
  // Server-detected: once every group-stage match has kicked off,
  // this flag flips to true and the picker enters read-only archive
  // mode regardless of what's in meta_predictions.
  forcedLock?: boolean;
}

export default function GroupsPicker({ userId, groups, forcedLock }: Props) {
  const { t, lang, dir } = useI18n();
  const supabase = createClient();

  const [order, setOrder] = useState<Record<string, string[]>>({});
  const [current, setCurrent] = useState<GroupStandingsPayload | null>(null);
  const [locked, setLocked] = useState<boolean>(!!forcedLock);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const pick = await getGroupStandingsPick(supabase, userId);
      // Start from either the user's saved order or the current standings
      // order returned by football-data as a sensible default.
      const initial: Record<string, string[]> = {};
      for (const g of groups) {
        const saved = pick?.payload?.[g.group];
        initial[g.group] =
          saved && Array.isArray(saved) && saved.length === g.teams.length
            ? saved
            : [...g.teams];
      }
      setOrder(initial);
      if (pick) {
        setCurrent(pick.payload);
        // Lock if the DB row says so OR if the server-side flag
        // told us the group stage is already resolved.
        setLocked((prev) => prev || !!pick.locked_at);
      }
      setReady(true);
    })();
  }, [supabase, userId, groups]);

  const move = (group: string, from: number, to: number) => {
    setOrder((prev) => {
      const arr = [...(prev[group] ?? [])];
      if (to < 0 || to >= arr.length) return prev;
      [arr[from], arr[to]] = [arr[to], arr[from]];
      return { ...prev, [group]: arr };
    });
  };

  const save = async () => {
    setSaving(true);
    await upsertGroupStandingsPick(supabase, userId, order);
    setCurrent(order);
    setSaving(false);
  };

  const dirty =
    ready &&
    JSON.stringify(order) !== JSON.stringify(current ?? {});

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
            <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow">
              <LayoutGrid className="w-7 h-7" />
            </div>
            <div>
              <h1 className="font-fifa text-3xl md:text-4xl uppercase text-gray-900 leading-none">
                {t("meta.groups.title")}
              </h1>
              <div
                className="tri-underline mt-3 w-32"
                style={{ background: HOST_TRI_GRADIENT }}
              />
            </div>
          </div>
          <p className="text-gray-500 text-sm max-w-xl">
            {t("meta.groups.sub")}
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

        {ready && groups.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
            {t("insights.ticker.empty")}
          </div>
        )}

        {ready && groups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((g) => {
              const rows = order[g.group] ?? g.teams;
              return (
                <div
                  key={g.group}
                  className="rounded-2xl border border-gray-200 overflow-hidden bg-white"
                >
                  <div className="px-3 py-2 bg-gradient-to-r from-gray-900 to-gray-700 text-white">
                    <span className="font-fifa text-lg uppercase tracking-wider">
                      {localizeRound(g.group, lang)}
                    </span>
                  </div>
                  <ul>
                    {rows.map((team, i) => (
                      <li
                        key={team}
                        className={`flex items-center gap-2 px-3 py-2 border-b border-gray-50 last:border-b-0 ${
                          i === 0
                            ? "bg-amber-50/40"
                            : i === 1
                            ? "bg-emerald-50/40"
                            : ""
                        }`}
                      >
                        <span
                          className={`inline-block w-5 h-5 rounded-full text-[10px] leading-5 text-center font-bold text-white ${
                            i === 0
                              ? "bg-amber-400"
                              : i === 1
                              ? "bg-emerald-500"
                              : "bg-gray-300"
                          }`}
                          dir="ltr"
                        >
                          {i + 1}
                        </span>
                        <Flag
                          team={team}
                          className="w-5 h-5 rounded-full object-cover border border-gray-100"
                        />
                        <span className="flex-1 font-bold text-sm text-gray-900 truncate">
                          {localizeTeam(team, lang)}
                        </span>
                        {!locked && (
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => move(g.group, i, i - 1)}
                              disabled={i === 0}
                              aria-label="move up"
                              className="w-6 h-4 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 active:scale-90"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => move(g.group, i, i + 1)}
                              disabled={i === rows.length - 1}
                              aria-label="move down"
                              className="w-6 h-4 flex items-center justify-center text-gray-500 hover:text-gray-900 disabled:opacity-30 active:scale-90"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
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
