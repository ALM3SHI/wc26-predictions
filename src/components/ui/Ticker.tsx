"use client";

import { Flag } from "@/components/ui/Flag";
import type { Match } from "@/lib/types";
import { useI18n } from "@/lib/i18n";
import { formatMatchTimeShort, localizeTeam } from "@/lib/i18n-data";

interface Props {
  matches: Pick<
    Match,
    "id" | "home_team" | "away_team" | "home_score" | "away_score" | "start_time" | "status"
  >[];
  emptyText?: string;
}

const LIVE = ["1H", "HT", "2H", "ET", "BT", "P"];
const FINISHED = ["FT", "AET", "PEN"];

export function Ticker({ matches, emptyText = "No matches scheduled" }: Props) {
  const { t, lang } = useI18n();
  const items = matches.slice(0, 30);
  const isEmpty = items.length === 0;

  const cell = (m: Props["matches"][number], idx: number) => {
    const isLive = LIVE.includes(m.status);
    const isFinished = FINISHED.includes(m.status);
    return (
      <span
        key={`${m.id}-${idx}`}
        className="inline-flex items-center gap-2 px-4 text-sm font-bold uppercase tracking-wider"
      >
        <Flag
          team={m.home_team}
          alt=""
          className="w-5 h-5 rounded-full object-cover border border-white/20"
        />
        <span>{localizeTeam(m.home_team, lang)}</span>
        {isLive || isFinished ? (
          <span className="font-fifa text-base" dir="ltr">
            {m.home_score ?? 0}–{m.away_score ?? 0}
          </span>
        ) : (
          <span className="text-white/50">
            {lang === "ar" ? "×" : "vs"}
          </span>
        )}
        <span>{localizeTeam(m.away_team, lang)}</span>
        <Flag
          team={m.away_team}
          alt=""
          className="w-5 h-5 rounded-full object-cover border border-white/20"
        />
        {isLive && (
          <span className="ms-2 inline-flex items-center gap-1 text-red-400">
            <span className="live-dot" /> {t("bracket.live.label")}
          </span>
        )}
        {isFinished && <span className="ms-2 text-emerald-400">{t("match.fulltime")}</span>}
        {!isLive && !isFinished && (
          <span className="ms-2 text-sky-300/80 font-normal normal-case">
            {formatMatchTimeShort(m.start_time, lang)}
          </span>
        )}
        <span className="mx-3 text-white/30">·</span>
      </span>
    );
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-full py-2 text-white"
      style={{
        background:
          "linear-gradient(90deg, #002868 0%, #0a1330 40%, #300a10 60%, #C8102E 100%)",
      }}
      dir="ltr"
    >
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#002868] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#C8102E] to-transparent z-10" />

      {isEmpty ? (
        // Neutral empty state — the outer "red-blue" gradient of the
        // ticker still frames it, but we drop the alarming solid tint
        // so the empty state doesn't look like an error banner.
        <div className="mx-4 rounded-full bg-white/10 border border-white/15 py-1.5 text-center text-xs font-bold uppercase tracking-widest text-white/70">
          {emptyText}
        </div>
      ) : (
        <div className="ticker-track">
          {items.map((m, i) => cell(m, i))}
          {items.map((m, i) => cell(m, i + items.length))}
        </div>
      )}
    </div>
  );
}
