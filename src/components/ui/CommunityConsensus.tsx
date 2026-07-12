"use client";

import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { localizeTeam } from "@/lib/i18n-data";
import { HOST_RED, HOST_BLUE, HOST_GREEN } from "@/lib/wc26-theme";

interface Props {
  home: number;
  draw: number;
  away: number;
  homeTeam: string;
  awayTeam: string;
}

export function CommunityConsensus({
  home,
  draw,
  away,
  homeTeam,
  awayTeam,
}: Props) {
  const { t, lang } = useI18n();
  const total = home + draw + away;

  if (total === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 text-center">
        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center justify-center gap-1 mb-1">
          <Users className="w-3 h-3" /> {t("match.consensus")}
        </div>
        <div className="text-sm text-gray-500">{t("match.consensus.empty")}</div>
      </div>
    );
  }

  const hPct = Math.round((home / total) * 100);
  const dPct = Math.round((draw / total) * 100);
  const aPct = 100 - hPct - dPct;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 rounded-2xl border border-gray-200 bg-white p-4"
    >
      <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold flex items-center gap-1 mb-3">
        <Users className="w-3 h-3" /> {t("match.consensus")} · {total}
      </div>

      <div className="flex items-center h-8 rounded-full overflow-hidden bg-gray-100 shadow-inner">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${hPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="h-full flex items-center justify-center text-white text-xs font-bold"
          style={{
            background: `linear-gradient(90deg, ${HOST_RED}, ${HOST_RED}dd)`,
          }}
        >
          {hPct >= 8 ? `${hPct}%` : ""}
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${dPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="h-full flex items-center justify-center text-white text-xs font-bold"
          style={{
            background: `linear-gradient(90deg, ${HOST_GREEN}, ${HOST_GREEN}dd)`,
          }}
        >
          {dPct >= 8 ? `${dPct}%` : ""}
        </motion.div>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${aPct}%` }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          className="h-full flex items-center justify-center text-white text-xs font-bold"
          style={{
            background: `linear-gradient(90deg, ${HOST_BLUE}, ${HOST_BLUE}dd)`,
          }}
        >
          {aPct >= 8 ? `${aPct}%` : ""}
        </motion.div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="flex flex-col items-center">
          <span
            className="w-2 h-2 rounded-full mb-1"
            style={{ background: HOST_RED }}
          />
          <span className="text-gray-500 truncate max-w-full text-center">
            {localizeTeam(homeTeam, lang)}
          </span>
          <span className="font-bold text-gray-900" dir="ltr">{hPct}%</span>
        </div>
        <div className="flex flex-col items-center">
          <span
            className="w-2 h-2 rounded-full mb-1"
            style={{ background: HOST_GREEN }}
          />
          <span className="text-gray-500">{t("match.consensus.draw")}</span>
          <span className="font-bold text-gray-900" dir="ltr">{dPct}%</span>
        </div>
        <div className="flex flex-col items-center">
          <span
            className="w-2 h-2 rounded-full mb-1"
            style={{ background: HOST_BLUE }}
          />
          <span className="text-gray-500 truncate max-w-full text-center">
            {localizeTeam(awayTeam, lang)}
          </span>
          <span className="font-bold text-gray-900" dir="ltr">{aPct}%</span>
        </div>
      </div>
    </motion.div>
  );
}
