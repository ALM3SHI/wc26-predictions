"use client";

import { motion } from "framer-motion";
import { Clock, Users, MapPin, Timer, Zap, Trophy } from "lucide-react";
import type { FDMatch } from "@/lib/football-data";
import { getFlagPath } from "@/lib/utils";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { useI18n } from "@/lib/i18n";
import {
  formatMatchTimeShort,
  localizeTeam,
} from "@/lib/i18n-data";

interface Props {
  rich: FDMatch | null;
}

interface DurationEntry {
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
}

const DURATION: Record<string, DurationEntry> = {
  REGULAR: { color: "#10B981", icon: Clock, labelKey: "rich.dur.regular" },
  EXTRA_TIME: { color: "#F59E0B", icon: Timer, labelKey: "rich.dur.et" },
  PENALTY_SHOOTOUT: { color: "#EF4444", icon: Zap, labelKey: "rich.dur.pen" },
};

const RICH_STRINGS: Record<string, { en: string; ar: string }> = {
  "rich.title": { en: "Match info · football-data", ar: "معلومات المباراة · football-data" },
  "rich.halftime": { en: "Halftime", ar: "الشوط الأول" },
  "rich.endedin": { en: "Ended in", ar: "انتهت بـ" },
  "rich.dur.regular": { en: "Regular Time", ar: "الوقت الأصلي" },
  "rich.dur.et": { en: "Extra Time", ar: "الوقت الإضافي" },
  "rich.dur.pen": { en: "Penalties", ar: "ركلات الترجيح" },
  "rich.fixture": { en: "Fixture", ar: "الجولة" },
  "rich.matchday": { en: "Matchday", ar: "الجولة" },
  "rich.referee": { en: "Referee", ar: "الحكم" },
  "rich.winner": { en: "Winner", ar: "الفائز" },
  "rich.kickoff": { en: "Kickoff", ar: "الانطلاق" },
  "rich.draw": { en: "Draw", ar: "تعادل" },
};

export function MatchRichBadges({ rich }: Props) {
  const { lang } = useI18n();
  if (!rich) return null;

  const s = (k: string) => RICH_STRINGS[k]?.[lang] ?? RICH_STRINGS[k]?.en ?? k;

  const hasHT =
    rich.score.halfTime.home !== null && rich.score.halfTime.away !== null;
  const durationInfo = DURATION[rich.score.duration];
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
          {s("rich.title")}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {hasHT && (
          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-3">
            <div className="text-[9px] uppercase tracking-widest text-gray-500 font-bold mb-1">
              {s("rich.halftime")}
            </div>
            <div className="font-fifa text-2xl text-gray-900" dir="ltr">
              {rich.score.halfTime.home}–{rich.score.halfTime.away}
            </div>
          </div>
        )}

        {durationInfo && (
          <div
            className="rounded-2xl border p-3"
            style={{
              borderColor: `${durationInfo.color}44`,
              background: `linear-gradient(135deg, ${durationInfo.color}0f, white 60%)`,
            }}
          >
            <div
              className="text-[9px] uppercase tracking-widest font-bold mb-1"
              style={{ color: durationInfo.color }}
            >
              {s("rich.endedin")}
            </div>
            <div
              className="font-fifa text-lg leading-tight"
              style={{ color: durationInfo.color }}
            >
              {s(durationInfo.labelKey)}
            </div>
          </div>
        )}

        {(rich.matchday || rich.group) && (
          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-blue-50 to-white p-3">
            <div className="text-[9px] uppercase tracking-widest text-blue-600 font-bold mb-1">
              {s("rich.fixture")}
            </div>
            <div className="font-fifa text-sm text-gray-900 leading-tight">
              {rich.group ? rich.group.replace(/_/g, " ") : ""}
            </div>
            {rich.matchday && (
              <div className="text-[10px] text-gray-500">
                {s("rich.matchday")} <span dir="ltr">{rich.matchday}</span>
              </div>
            )}
          </div>
        )}

        {ref && (
          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-yellow-50 to-white p-3">
            <div className="text-[9px] uppercase tracking-widest text-yellow-700 font-bold mb-1">
              {s("rich.referee")}
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
                  {localizeTeam(ref.nationality, lang)}
                </div>
              </div>
            </div>
          </div>
        )}

        {rich.score.winner && (
          <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-purple-50 to-white p-3">
            <div className="text-[9px] uppercase tracking-widest text-purple-700 font-bold mb-1 flex items-center gap-1">
              <Trophy className="w-3 h-3" /> {s("rich.winner")}
            </div>
            <div className="font-fifa text-sm text-gray-900 truncate">
              {rich.score.winner === "DRAW"
                ? s("rich.draw")
                : rich.score.winner === "HOME_TEAM"
                  ? localizeTeam(rich.homeTeam.shortName, lang)
                  : localizeTeam(rich.awayTeam.shortName, lang)}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-red-50 to-white p-3">
          <div className="text-[9px] uppercase tracking-widest text-red-700 font-bold mb-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> {s("rich.kickoff")}
          </div>
          <div className="text-xs text-gray-900 leading-tight">
            {formatMatchTimeShort(rich.utcDate, lang)}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
