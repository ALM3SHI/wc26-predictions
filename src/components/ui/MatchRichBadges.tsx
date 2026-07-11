"use client";

import { motion } from "framer-motion";
import { Clock, Users, MapPin, Timer, Zap, Trophy } from "lucide-react";
import type { FDMatch } from "@/lib/football-data";
import { getFlagPath } from "@/lib/utils";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";

interface Props {
  rich: FDMatch | null;
}

const DURATION_LABEL: Record<string, { text: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  REGULAR: { text: "Regular Time", color: "#10B981", icon: Clock },
  EXTRA_TIME: { text: "Extra Time", color: "#F59E0B", icon: Timer },
  PENALTY_SHOOTOUT: { text: "Penalties", color: "#EF4444", icon: Zap },
};

/**
 * Extra context from football-data.org: halftime score, duration
 * (regular/ET/PEN), matchday, group, and referee w/ nationality flag.
 * Silently no-ops if data is unavailable.
 */
export function MatchRichBadges({ rich }: Props) {
  if (!rich) return null;

  const hasHT =
    rich.score.halfTime.home !== null && rich.score.halfTime.away !== null;
  const durationInfo = DURATION_LABEL[rich.score.duration];
  const ref = rich.referees?.[0] ?? null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 mb-6 rounded-3xl border border-gray-200 bg-white p-4 relative overflow-hidden"
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: HOST_TRI_GRADIENT }}
      />

      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-gray-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
          Match info · football-data
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Halftime */}
        {hasHT && (
          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-3">
            <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">
              Halftime
            </div>
            <div className="font-fifa text-2xl text-gray-900">
              {rich.score.halfTime.home}–{rich.score.halfTime.away}
            </div>
          </div>
        )}

        {/* Duration */}
        {durationInfo && (
          <div
            className="rounded-2xl border p-3"
            style={{
              borderColor: `${durationInfo.color}44`,
              background: `linear-gradient(135deg, ${durationInfo.color}0f, white 60%)`,
            }}
          >
            <div className="text-[9px] uppercase tracking-widest font-bold mb-1"
              style={{ color: durationInfo.color }}
            >
              Ended in
            </div>
            <div
              className="font-fifa text-lg leading-tight"
              style={{ color: durationInfo.color }}
            >
              {durationInfo.text}
            </div>
          </div>
        )}

        {/* Matchday / group */}
        {(rich.matchday || rich.group) && (
          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-blue-50 to-white p-3">
            <div className="text-[9px] uppercase tracking-widest text-blue-600 font-bold mb-1">
              Fixture
            </div>
            <div className="font-fifa text-sm text-gray-900 leading-tight">
              {rich.group ? rich.group.replace(/_/g, " ") : ""}
            </div>
            {rich.matchday && (
              <div className="text-[10px] text-gray-500">
                Matchday {rich.matchday}
              </div>
            )}
          </div>
        )}

        {/* Referee */}
        {ref && (
          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-yellow-50 to-white p-3">
            <div className="text-[9px] uppercase tracking-widest text-yellow-700 font-bold mb-1">
              Referee
            </div>
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={getFlagPath(ref.nationality)}
                alt={ref.nationality}
                className="w-5 h-5 rounded-full object-cover border border-gray-200 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-gray-900 truncate">
                  {ref.name}
                </div>
                <div className="text-[10px] text-gray-500 truncate">
                  {ref.nationality}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Winner */}
        {rich.score.winner && (
          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-purple-50 to-white p-3">
            <div className="text-[9px] uppercase tracking-widest text-purple-700 font-bold mb-1 flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Winner
            </div>
            <div className="font-fifa text-sm text-gray-900 truncate">
              {rich.score.winner === "DRAW"
                ? "Draw"
                : rich.score.winner === "HOME_TEAM"
                  ? rich.homeTeam.shortName
                  : rich.awayTeam.shortName}
            </div>
          </div>
        )}

        {/* Kickoff time */}
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-red-50 to-white p-3">
          <div className="text-[9px] uppercase tracking-widest text-red-700 font-bold mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Kickoff
          </div>
          <div className="text-xs text-gray-900 leading-tight">
            {new Date(rich.utcDate).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
