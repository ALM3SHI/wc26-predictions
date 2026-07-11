"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { getFlagPath } from "@/lib/utils";
import { getStakeById, type StakeId } from "@/lib/gamble";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { useI18n } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  stakeId: StakeId;
  autoDismissMs?: number;
}

export function LockInScreen({
  open,
  onClose,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  stakeId,
  autoDismissMs = 2400,
}: Props) {
  const stake = getStakeById(stakeId);
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const t2 = setTimeout(onClose, autoDismissMs);
    return () => clearTimeout(t2);
  }, [open, autoDismissMs, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer px-4"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, rgba(200,16,46,0.4), rgba(0,40,104,0.85) 50%, rgba(0,0,0,0.98) 100%)",
          }}
          role="dialog"
          aria-label={t("lockin.aria")}
        >
          {/* Stadium light sweeps */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.4, ease: "easeInOut", delay: 0.1 }}
            className="absolute inset-y-0 w-1/3 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,184,28,0.35), transparent)",
              filter: "blur(20px)",
            }}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: "-100%" }}
            transition={{ duration: 1.6, ease: "easeInOut", delay: 0.2 }}
            className="absolute inset-y-0 w-1/3 pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(0,168,168,0.35), transparent)",
              filter: "blur(20px)",
            }}
          />

          {/* Anime speed lines */}
          <div className="pointer-events-none absolute inset-0 opacity-20">
            <div
              className="absolute inset-0"
              style={{
                background:
                  "repeating-conic-gradient(from 0deg, transparent 0deg 8deg, rgba(255,255,255,0.4) 8deg 9deg)",
                animation: "hostSealSpin 8s linear infinite",
                maskImage:
                  "radial-gradient(circle at center, transparent 20%, black 40%, transparent 80%)",
                WebkitMaskImage:
                  "radial-gradient(circle at center, transparent 20%, black 40%, transparent 80%)",
              }}
            />
          </div>

          <div className="relative z-10 max-w-2xl w-full text-center text-white">
            {/* Flags + Score — one flex row that scales down */}
            <div className="flex items-center justify-center gap-2 sm:gap-6 md:gap-8 mb-6 md:mb-8 flex-nowrap">
              <motion.img
                initial={{ x: -240, opacity: 0, rotate: -12 }}
                animate={{ x: 0, opacity: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 18,
                  delay: 0.15,
                }}
                src={getFlagPath(homeTeam)}
                alt={homeTeam}
                className="w-14 h-14 sm:w-20 sm:h-20 md:w-32 md:h-32 rounded-full object-cover border-2 sm:border-4 border-white shadow-2xl shrink-0"
              />
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 180,
                  damping: 14,
                  delay: 0.5,
                }}
                className="font-fifa text-4xl sm:text-6xl md:text-8xl whitespace-nowrap leading-none"
                style={{
                  color: stake.color,
                  textShadow: `0 0 30px ${stake.glow}`,
                }}
              >
                {homeScore}<span className="mx-1">–</span>{awayScore}
              </motion.div>
              <motion.img
                initial={{ x: 240, opacity: 0, rotate: 12 }}
                animate={{ x: 0, opacity: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 18,
                  delay: 0.15,
                }}
                src={getFlagPath(awayTeam)}
                alt={awayTeam}
                className="w-14 h-14 sm:w-20 sm:h-20 md:w-32 md:h-32 rounded-full object-cover border-2 sm:border-4 border-white shadow-2xl shrink-0"
              />
            </div>

            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.7,
                type: "spring",
                stiffness: 160,
                damping: 14,
              }}
            >
              <h2 className="font-fifa text-4xl sm:text-5xl md:text-7xl tracking-widest mb-3 sweep-shine">
                {t("lockin.title")}
              </h2>
              <div
                className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-xs sm:text-sm tracking-widest uppercase"
                style={{
                  background: stake.color,
                  color: "white",
                  boxShadow: `0 0 30px ${stake.glow}`,
                }}
              >
                {stake.mult}x — {t(`stake.${stake.id}`)} {t("lockin.stake")}
              </div>
              <div
                className="mt-4 sm:mt-6 mx-auto tri-underline"
                style={{
                  width: "220px",
                  maxWidth: "60vw",
                  background: HOST_TRI_GRADIENT,
                }}
              />
              <p className="mt-4 sm:mt-6 text-white/70 text-[10px] sm:text-xs uppercase tracking-widest">
                {t("lockin.tap")}
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
