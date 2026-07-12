// ─────────────────────────────────────────────────────────────
// MatchPreview — server-rendered scouting card
//
// Reads what we already have in Supabase (finished matches +
// user predictions) to compute:
//   • WDL form for each team (last 5 matches)
//   • Head-to-head between these two teams (if any)
//   • The signed-in user's accuracy in matches involving either
//     team so they can calibrate their pick.
//
// No new external API calls — purely derived from cloud state.
// ─────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server";
import { getServerT } from "@/lib/i18n-server";
import { Flag } from "@/components/ui/Flag";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { localizeTeam } from "@/lib/i18n-data";

interface Props {
  homeTeam: string;
  awayTeam: string;
  userId: string;
}

const FINISHED = ["FT", "AET", "PEN"];

type WDL = "W" | "D" | "L";

interface FinishedMatchRow {
  id: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  start_time: string;
}

function outcomeFor(row: FinishedMatchRow, team: string): WDL | null {
  if (row.home_score === null || row.away_score === null) return null;
  const won =
    (row.home_team === team && row.home_score > row.away_score) ||
    (row.away_team === team && row.away_score > row.home_score);
  const lost =
    (row.home_team === team && row.home_score < row.away_score) ||
    (row.away_team === team && row.away_score < row.home_score);
  return won ? "W" : lost ? "L" : "D";
}

function badgeColor(o: WDL) {
  return o === "W"
    ? { bg: "#10B981", text: "white" }
    : o === "D"
      ? { bg: "#E5E7EB", text: "#374151" }
      : { bg: "#EF4444", text: "white" };
}

function TeamForm({
  team,
  results,
  lang,
}: {
  team: string;
  results: WDL[];
  lang: "en" | "ar";
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3 flex items-center gap-3">
      <Flag
        team={team}
        className="w-8 h-8 rounded-full object-cover border border-gray-100 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="font-bold text-sm text-gray-900 truncate">
          {localizeTeam(team, lang)}
        </div>
        <div className="flex items-center gap-1 mt-1">
          {results.length === 0 ? (
            <span className="text-[10px] text-gray-400">—</span>
          ) : (
            results.map((r, i) => {
              const c = badgeColor(r);
              return (
                <span
                  key={i}
                  className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[9px] font-bold"
                  style={{ background: c.bg, color: c.text }}
                  dir="ltr"
                >
                  {r}
                </span>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default async function MatchPreview({
  homeTeam,
  awayTeam,
  userId,
}: Props) {
  const [supabase, i18n] = await Promise.all([
    createClient(),
    getServerT(),
  ]);
  const { t, lang, dir } = i18n;

  // Pull the last 10 finished matches for each team + any prior H2H, all
  // in one round trip via three parallel promises.
  const [homeMatches, awayMatches, h2hMatches, userPreds] = await Promise.all([
    supabase
      .from("matches")
      .select("id, home_team, away_team, home_score, away_score, status, start_time")
      .or(`home_team.eq.${homeTeam},away_team.eq.${homeTeam}`)
      .in("status", FINISHED)
      .order("start_time", { ascending: false })
      .limit(10),
    supabase
      .from("matches")
      .select("id, home_team, away_team, home_score, away_score, status, start_time")
      .or(`home_team.eq.${awayTeam},away_team.eq.${awayTeam}`)
      .in("status", FINISHED)
      .order("start_time", { ascending: false })
      .limit(10),
    supabase
      .from("matches")
      .select("id, home_team, away_team, home_score, away_score, status, start_time")
      .or(
        `and(home_team.eq.${homeTeam},away_team.eq.${awayTeam}),and(home_team.eq.${awayTeam},away_team.eq.${homeTeam})`,
      )
      .in("status", FINISHED)
      .order("start_time", { ascending: false })
      .limit(1),
    supabase
      .from("predictions")
      .select(
        "points_earned, scored, matches(home_team, away_team, status)",
      )
      .eq("user_id", userId)
      .eq("scored", true),
  ]);

  const homeForm = (
    ((homeMatches.data as FinishedMatchRow[]) ?? [])
      .map((r) => outcomeFor(r, homeTeam))
      .filter((v): v is WDL => !!v)
      .slice(0, 5)
  );

  const awayForm = (
    ((awayMatches.data as FinishedMatchRow[]) ?? [])
      .map((r) => outcomeFor(r, awayTeam))
      .filter((v): v is WDL => !!v)
      .slice(0, 5)
  );

  const h2h = ((h2hMatches.data as FinishedMatchRow[]) ?? [])[0] ?? null;

  // Personal hit rate: scored predictions on matches involving either
  // team. Not the world's most rigorous metric but it's directional.
  const relevant = (
    (userPreds.data as
      | Array<{
          points_earned: number;
          scored: boolean;
          matches: {
            home_team: string;
            away_team: string;
            status: string;
          } | null;
        }>
      | null) ?? []
  ).filter((p) => {
    const m = p.matches;
    if (!m) return false;
    return (
      m.home_team === homeTeam ||
      m.away_team === homeTeam ||
      m.home_team === awayTeam ||
      m.away_team === awayTeam
    );
  });

  const hits = relevant.filter((p) => p.points_earned > 0).length;
  const hitrate = relevant.length > 0 ? Math.round((hits / relevant.length) * 100) : null;

  return (
    <div
      className="rounded-3xl border border-gray-200 bg-white p-4 md:p-5 mb-6 relative overflow-hidden"
      dir={dir}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: HOST_TRI_GRADIENT }}
      />

      <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-3">
        {t("preview.title")}
      </div>

      {/* Form */}
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">
          {t("preview.form")}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <TeamForm team={homeTeam} results={homeForm} lang={lang} />
          <TeamForm team={awayTeam} results={awayForm} lang={lang} />
        </div>
      </div>

      {/* H2H */}
      <div className="mb-3">
        <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">
          {t("preview.h2h")}
        </div>
        {h2h ? (
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Flag
                team={h2h.home_team}
                className="w-6 h-6 rounded-full object-cover"
              />
              <span className="text-sm font-bold text-gray-900 truncate">
                {localizeTeam(h2h.home_team, lang)}
              </span>
            </div>
            <span className="font-fifa text-lg text-gray-900" dir="ltr">
              {h2h.home_score}–{h2h.away_score}
            </span>
            <div className="flex items-center gap-2 min-w-0 justify-end">
              <span className="text-sm font-bold text-gray-900 truncate">
                {localizeTeam(h2h.away_team, lang)}
              </span>
              <Flag
                team={h2h.away_team}
                className="w-6 h-6 rounded-full object-cover"
              />
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-500 italic">{t("preview.h2h.empty")}</p>
        )}
      </div>

      {/* Personal hit rate */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-2">
          {t("preview.your.hitrate")}
        </div>
        {hitrate === null ? (
          <p className="text-xs text-gray-500 italic">{t("preview.no.data")}</p>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${hitrate}%`,
                  background:
                    hitrate >= 70
                      ? "#10B981"
                      : hitrate >= 40
                        ? "#F59E0B"
                        : "#EF4444",
                }}
              />
            </div>
            <div
              className="font-fifa text-lg text-gray-900 min-w-[46px] text-end"
              dir="ltr"
            >
              {hitrate}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
