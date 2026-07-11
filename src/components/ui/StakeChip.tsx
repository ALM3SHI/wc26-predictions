"use client";

import { motion } from "framer-motion";
import type { Stake } from "@/lib/gamble";

interface Props {
  stake: Stake;
  active: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

const SIZE_MAP = {
  sm: { box: "w-14 h-14", text: "text-lg" },
  md: { box: "w-20 h-20", text: "text-2xl" },
  lg: { box: "w-24 h-24", text: "text-3xl" },
};

export function StakeChip({ stake, active, disabled, size = "md", onClick }: Props) {
  const s = SIZE_MAP[size];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.92, rotate: -6 }}
      className={`chip ${active ? "chip-active" : "chip-idle"} ${s.box} ${
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
      } ${active ? "ring-4 ring-offset-2 ring-offset-white" : ""}`}
      style={{
        color: stake.color,
        // @ts-expect-error CSS var passthrough
        "--tw-ring-color": stake.ring,
        boxShadow: active
          ? `0 0 0 6px ${stake.color} inset, 0 0 30px ${stake.glow}, 0 12px 32px rgba(0,0,0,0.3)`
          : undefined,
      }}
      aria-pressed={active}
      aria-label={`${stake.label} — ${stake.mult}x stake`}
    >
      <span className={`font-fifa ${s.text} text-white drop-shadow-lg`}>
        {stake.mult}x
      </span>
    </motion.button>
  );
}
