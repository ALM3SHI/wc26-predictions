"use client";

import { motion } from "framer-motion";
import { Crown, Award } from "lucide-react";
import Link from "next/link";
import type { FDScorer } from "@/lib/football-data";
import { HOST_RED, HOST_BLUE, HOST_GREEN, HOST_GOLD } from "@/lib/wc26-theme";
import { getFlagPath } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { localizeTeam } from "@/lib/i18n-data";

const S: Record<string, { en: string; ar: string }> = {
  empty: {
    en: "Golden Boot race hasn't opened yet. Check back after Matchday 1.",
    ar: "سباق الحذاء الذهبي لم يفتح بعد. عُد بعد الجولة الأولى.",
  },
  title: { en: "Golden Boot Race", ar: "سباق الحذاء الذهبي" },
  live: {
    en: "Live — updated from football-data.org",
    ar: "مباشر — يُحدَّث من football-data.org",
  },
  goals: { en: "goals", ar: "أهداف" },
  age: { en: "age", ar: "العمر" },
  liveTable: { en: "Live table", ar: "جدول مباشر" },
  more: { en: "More insights →", ar: "المزيد من الإحصائيات →" },
};

interface Props {
  scorers: FDScorer[];
}

function ageFrom(iso: string): number {
  const d = new Date(iso);
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age -= 1;
  return age;
}

const STEP_COLORS = [HOST_GOLD, HOST_BLUE, HOST_RED];

export function GoldenBoot({ scorers }: Props) {
  const { lang } = useI18n();
  const tx = (k: string) => S[k]?.[lang] ?? S[k]?.en ?? k;

  if (!scorers.length) {
    return (
      <div className="rounded-3xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
        {tx("empty")}
      </div>
    );
  }

  const top3 = scorers.slice(0, 3);
  const rest = scorers.slice(3);

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 md:p-6 overflow-hidden relative">
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{
          background: `linear-gradient(90deg, ${HOST_GOLD}, ${HOST_RED}, ${HOST_BLUE}, ${HOST_GREEN})`,
        }}
      />

      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white"
          style={{
            background: `linear-gradient(135deg, ${HOST_GOLD}, #FFDA6B)`,
            boxShadow: `0 8px 30px ${HOST_GOLD}55`,
          }}
        >
          <Crown className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-fifa text-2xl md:text-3xl uppercase text-gray-900 leading-none">
            {tx("title")}
          </h3>
          <p className="text-xs text-gray-500 mt-1">{tx("live")}</p>
        </div>
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
        {top3.map((s, i) => {
          const color = STEP_COLORS[i];
          const player = s.player.name;
          const nat = s.player.nationality;
          return (
            <motion.div
              key={s.player.id}
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 0.1 + i * 0.1,
                type: "spring",
                stiffness: 180,
                damping: 18,
              }}
              className="rounded-2xl p-3 md:p-4 border-2 text-center relative overflow-hidden min-w-0"
              style={{
                borderColor: `${color}55`,
                background: `linear-gradient(135deg, ${color}10, white 60%)`,
              }}
            >
              <div
                className="absolute top-1 right-1 font-fifa text-2xl md:text-3xl opacity-20"
                style={{ color }}
              >
                {i + 1}
              </div>
              <img
                src={getFlagPath(nat)}
                alt={nat}
                className="w-10 h-10 md:w-14 md:h-14 mx-auto rounded-full object-cover border-2 shadow"
                style={{ borderColor: color }}
              />
              <div className="font-bold text-xs md:text-sm text-gray-900 mt-2 truncate">
                {player}
              </div>
              <div className="text-[9px] uppercase tracking-widest text-gray-500 truncate">
                {localizeTeam(s.team.shortName, lang)}
              </div>
              <div
                className="font-fifa text-2xl md:text-4xl mt-2"
                style={{ color }}
                dir="ltr"
              >
                {s.goals}
              </div>
              <div
                className="text-[9px] uppercase tracking-widest text-gray-500"
                dir="ltr"
              >
                {s.playedMatches}g
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 4-10 list */}
      {rest.length > 0 && (
        <div className="space-y-1">
          {rest.map((s, i) => (
            <motion.div
              key={s.player.id}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.04 }}
              className="grid grid-cols-[24px_24px_1fr_auto_auto_auto] gap-3 items-center px-3 py-2 rounded-lg hover:bg-gray-50"
            >
              <span className="text-xs font-bold text-gray-400 text-center">
                {i + 4}
              </span>
              <img
                src={getFlagPath(s.player.nationality)}
                alt=""
                className="w-6 h-6 rounded-full object-cover border border-gray-100"
              />
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-900 truncate">
                  {s.player.name}
                </div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400 truncate">
                  {localizeTeam(s.team.shortName, lang)} · {tx("age")}{" "}
                  <span dir="ltr">{ageFrom(s.player.dateOfBirth)}</span>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 hidden md:block">
                A: <span className="font-bold text-gray-700" dir="ltr">{s.assists ?? 0}</span>
              </div>
              <div className="text-[10px] text-gray-400 hidden md:block">
                P: <span className="font-bold text-gray-700" dir="ltr">{s.penalties ?? 0}</span>
              </div>
              <div className="font-fifa text-xl text-gray-900 min-w-[36px] text-end" dir="ltr">
                {s.goals}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-widest text-gray-400">
        <div className="flex items-center gap-1">
          <Award className="w-3 h-3" /> {tx("liveTable")}
        </div>
        <Link href="/insights" className="text-wc-purple hover:underline">
          {tx("more")}
        </Link>
      </div>
    </div>
  );
}
