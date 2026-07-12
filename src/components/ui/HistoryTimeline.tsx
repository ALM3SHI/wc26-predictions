"use client";

import { motion } from "framer-motion";
import { History } from "lucide-react";
import type { FDSeason } from "@/lib/football-data";
import { HOST_TRI_GRADIENT, HOST_GOLD } from "@/lib/wc26-theme";
import { getFlagPath } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { localizeTeam } from "@/lib/i18n-data";

const S: Record<string, { en: string; ar: string }> = {
  title: { en: "Every WC Winner", ar: "أبطال كأس العالم" },
  champion: { en: "Champion", ar: "البطل" },
};

interface Props {
  history: Array<{ year: number; season: FDSeason }>;
}

export function HistoryTimeline({ history }: Props) {
  const { lang } = useI18n();
  const tx = (k: string) => S[k]?.[lang] ?? S[k]?.en ?? k;

  if (!history.length) return null;

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 md:p-6 relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: HOST_TRI_GRADIENT }}
      />

      <div className="flex items-center gap-3 mb-6">
        <History className="w-5 h-5 text-gray-700" />
        <div>
          <h3 className="font-fifa text-2xl md:text-3xl uppercase text-gray-900 leading-none">
            {tx("title")}
          </h3>
          <p className="text-xs text-gray-500 mt-1" dir="ltr">
            {history[history.length - 1].year} — {history[0].year}
          </p>
        </div>
      </div>

      <div className="relative overflow-x-auto pb-4" dir="ltr">
        <div
          className="absolute top-1/2 left-4 right-4 h-1 -translate-y-1/2 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${HOST_GOLD}, ${HOST_GOLD}66, ${HOST_GOLD})`,
          }}
        />

        <div className="relative flex gap-4 min-w-max px-4">
          {history.map((h, i) => {
            const w = h.season.winner!;
            return (
              <motion.div
                key={h.season.id}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="relative flex flex-col items-center min-w-[110px]"
              >
                <div className="font-fifa text-xl text-gray-900">{h.year}</div>
                <div
                  className="w-3 h-3 rounded-full my-2"
                  style={{
                    background: HOST_GOLD,
                    boxShadow: `0 0 12px ${HOST_GOLD}`,
                  }}
                />
                <div className="flex flex-col items-center bg-gradient-to-br from-yellow-50 to-white border border-yellow-100 rounded-2xl p-3 min-w-[110px]">
                  <img
                    src={getFlagPath(w.name)}
                    alt={w.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-yellow-400 shadow"
                  />
                  <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-2">
                    {tx("champion")}
                  </div>
                  <div className="font-fifa text-sm text-gray-900 text-center truncate max-w-[100px]">
                    {localizeTeam(w.shortName || w.name, lang)}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
