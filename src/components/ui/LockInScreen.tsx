"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { getFlagPath } from "@/lib/utils";
import { getStakeById, type StakeId } from "@/lib/gamble";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";

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
  autoDismissMs = 2200,
}: Props) {
  const stake = getStakeById(stakeId);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(onClose, autoDismissMs);
    return () => clearTimeout(t);
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
          className="fixed inset-0 z-[100] flex items-center justify-center cursor-pointer"
          style={{
            background:
              "radial-gradient(circle at 50% 40%, rgba(200,16,46,0.4), rgba(0,40,104,0.85) 50%, rgba(0,0,0,0.98) 100%)",
          }}
          role="dialog"
          aria-label="Prediction locked"
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

          <div className="relative z-10 max-w-2xl w-full px-6 text-center text-white">
            {/* Flags rush in */}
            <div className="flex items-center justify-center gap-8 mb-8">
              <motion.img
                initial={{ x: -280, opacity: 0, rotate: -12 }}
                animate={{ x: 0, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.15 }}
                src={getFlagPath(homeTeam)}
                alt={homeTeam}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-2xl"
              />
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 14, delay: 0.5 }}
                className="font-fifa text-6xl md:text-8xl"
                style={{ color: stake.color, textShadow: `0 0 30px ${stake.glow}` }}
              >
                {homeScore}–{awayScore}
              </motion.div>
              <motion.img
                initial={{ x: 280, opacity: 0, rotate: 12 }}
                animate={{ x: 0, opacity: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.15 }}
                src={getFlagPath(awayTeam)}
                alt={awayTeam}
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-white shadow-2xl"
              />
            </div>

            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 160, damping: 14 }}
            >
              <h2 className="font-fifa text-5xl md:text-7xl tracking-widest mb-3 sweep-shine">
                LOCKED IN
              </h2>
              <div
                className="inline-block px-4 py-2 rounded-full font-bold text-sm tracking-widest uppercase"
                style={{
                  background: stake.color,
                  color: "white",
                  boxShadow: `0 0 30px ${stake.glow}`,
                }}
              >
                {stake.mult}x — {stake.label} Stake
              </div>
              <div
                className="mt-6 mx-auto tri-underline"
                style={{
                  width: "220px",
                  background: HOST_TRI_GRADIENT,
                }}
              />
              <p className="mt-6 text-white/70 text-xs uppercase tracking-widest">
                Tap anywhere to continue
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
