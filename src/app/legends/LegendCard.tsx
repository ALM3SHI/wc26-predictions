"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Flag } from "@/components/ui/Flag";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { Confetti } from "@/components/ui/Confetti";
import { useI18n } from "@/lib/i18n";
import { localizeRound, localizeTeam } from "@/lib/i18n-data";

interface Props {
  rank: number;
  displayName: string;
  avatarUrl: string | null;
  userId: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  matchId: string;
  matchDate: string;
  round: string;
  isTop?: boolean;
}

export function LegendCard(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [fired, setFired] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const { lang } = useI18n();

  useEffect(() => {
    if (!props.isTop || fired) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setConfetti(true);
            setFired(true);
            io.disconnect();
            setTimeout(() => setConfetti(false), 2600);
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [props.isTop, fired]);

  const locale = lang === "ar" ? "ar-EG-u-ca-gregory" : "en-US";
  const exactLabel = lang === "ar" ? "دقيقة +٣" : "Exact +3";

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, rotate: -0.5 }}
      whileInView={{ opacity: 1, y: 0, rotate: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ type: "spring", stiffness: 160, damping: 20 }}
      className="relative rounded-3xl border border-gray-200 bg-white p-6 shadow-md overflow-hidden"
    >
      <div
        className="absolute inset-y-0 start-0 w-1.5"
        style={{ background: HOST_TRI_GRADIENT }}
      />

      {/* EXACT seal */}
      <div className="absolute top-3 end-3 rotate-12">
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-[10px] font-black uppercase tracking-widest border border-yellow-300">
          <Sparkles className="w-3 h-3" /> {exactLabel}
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div
          className="font-fifa text-4xl text-gray-300 leading-none w-10 text-center"
          dir="ltr"
        >
          {props.rank.toString().padStart(2, "0")}
        </div>
        <Link
          href={`/user/${props.userId}`}
          className="flex items-center gap-3 hover:opacity-80"
        >
          <img
            src={props.avatarUrl || "/images/default-avatar.png"}
            alt={props.displayName}
            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow"
          />
          <div>
            <div className="font-fifa text-xl uppercase text-gray-900 leading-tight">
              {props.displayName}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
              {localizeRound(props.round, lang)}
            </div>
          </div>
        </Link>
      </div>

      <Link
        href={`/match/${props.matchId}`}
        className="flex items-center justify-center gap-2 sm:gap-4 py-3 sm:py-4 px-2 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-md transition flex-nowrap"
      >
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <Flag
            team={props.homeTeam}
            alt=""
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-gray-200 shrink-0"
          />
          <span className={`font-fifa uppercase truncate ${lang === "ar" ? "text-base sm:text-lg" : "text-lg sm:text-xl"} text-gray-800 max-w-[70px] sm:max-w-[100px]`}>
            {localizeTeam(props.homeTeam, lang)}
          </span>
        </div>
        <span
          className="font-fifa text-2xl sm:text-3xl md:text-4xl text-gray-900 whitespace-nowrap shrink-0"
          dir="ltr"
        >
          {props.homeScore}–{props.awayScore}
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <span className={`font-fifa uppercase truncate ${lang === "ar" ? "text-base sm:text-lg" : "text-lg sm:text-xl"} text-gray-800 max-w-[70px] sm:max-w-[100px]`}>
            {localizeTeam(props.awayTeam, lang)}
          </span>
          <Flag
            team={props.awayTeam}
            alt=""
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-gray-200 shrink-0"
          />
        </div>
      </Link>

      <div className="mt-3 text-center text-[10px] uppercase tracking-widest text-gray-400 font-bold">
        {new Date(props.matchDate).toLocaleDateString(locale, {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}
      </div>

      <Confetti active={confetti} />
    </motion.div>
  );
}
