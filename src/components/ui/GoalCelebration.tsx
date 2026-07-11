"use client";

import { motion } from "framer-motion";

interface Props {
  active: boolean;
  label?: string;
  color?: string;
}

/**
 * "GOAL!" screen splash — a subtle stadium net + soccer ball drop
 * + bold text pop. Sits under a full-screen overlay.
 */
export function GoalCelebration({ active, label = "GOAL!", color = "#FFB81C" }: Props) {
  if (!active) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none fixed inset-0 z-[95] flex items-center justify-center"
    >
      {/* Net pattern behind */}
      <svg
        className="absolute inset-0 opacity-25"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <pattern id="netpat" width="4" height="6" patternUnits="userSpaceOnUse">
            <path d="M0 0 L4 6 M4 0 L0 6" stroke="white" strokeWidth="0.3" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#netpat)" />
      </svg>

      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at center, rgba(0,0,0,0.7), rgba(0,0,0,0.95))",
        }}
      />

      {/* Ball drop */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ animation: "ballBounce 800ms ease-out forwards" }}
      >
        <div className="text-6xl">⚽</div>
      </div>

      {/* Ring burst */}
      <div className="relative">
        <span
          className="ring-burst"
          style={{ color, width: 120, height: 120 }}
        />
        <span
          className="ring-burst"
          style={{
            color,
            width: 200,
            height: 200,
            animationDelay: "150ms",
          }}
        />
      </div>

      <motion.div
        initial={{ scale: 0.4, opacity: 0, rotate: -6 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 12 }}
        className="relative z-10 font-fifa text-6xl md:text-9xl tracking-widest"
        style={{
          color,
          textShadow: `0 0 40px ${color}, 0 8px 40px rgba(0,0,0,0.8)`,
          WebkitTextStroke: "1px rgba(0,0,0,0.4)",
        }}
      >
        {label}
      </motion.div>
    </motion.div>
  );
}
