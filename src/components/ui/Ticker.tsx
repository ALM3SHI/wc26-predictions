"use client";

import { getFlagPath } from "@/lib/utils";
import type { Match } from "@/lib/types";

interface Props {
  matches: Pick<
    Match,
    "id" | "home_team" | "away_team" | "home_score" | "away_score" | "start_time" | "status"
  >[];
  emptyText?: string;
}

const LIVE = ["1H", "HT", "2H", "ET", "BT", "P"];
const FINISHED = ["FT", "AET", "PEN"];

function formatShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function Ticker({ matches, emptyText = "No matches scheduled" }: Props) {
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
        <img
          src={getFlagPath(m.home_team)}
          alt=""
          className="w-5 h-5 rounded-full object-cover border border-white/20"
        />
        <span>{m.home_team}</span>
        {isLive || isFinished ? (
          <span className="font-fifa text-base">
            {m.home_score ?? 0}–{m.away_score ?? 0}
          </span>
        ) : (
          <span className="text-white/50">vs</span>
        )}
        <span>{m.away_team}</span>
        <img
          src={getFlagPath(m.away_team)}
          alt=""
          className="w-5 h-5 rounded-full object-cover border border-white/20"
        />
        {isLive && (
          <span className="ml-2 inline-flex items-center gap-1 text-red-400">
            <span className="live-dot" /> LIVE
          </span>
        )}
        {isFinished && (
          <span className="ml-2 text-emerald-400">FT</span>
        )}
        {!isLive && !isFinished && (
          <span className="ml-2 text-sky-300/80 font-normal normal-case">
            {formatShort(m.start_time)}
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
    >
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[#002868] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[#C8102E] to-transparent z-10" />

      {isEmpty ? (
        <div className="text-center text-sm font-bold uppercase tracking-widest opacity-70">
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
