"use client";

import { motion } from "framer-motion";
import { getFlagPath } from "@/lib/utils";

interface Props {
  team: string;
  size?: "sm" | "md" | "lg" | "xl";
  showName?: boolean;
  from?: "left" | "right" | "up" | "down";
  delay?: number;
  className?: string;
}

const SIZE_MAP = {
  sm: { flag: "w-8 h-8", name: "text-sm" },
  md: { flag: "w-12 h-12", name: "text-base" },
  lg: { flag: "w-20 h-20", name: "text-xl" },
  xl: { flag: "w-28 h-28", name: "text-2xl" },
};

const OFFSETS = {
  left: { x: -80, y: 0 },
  right: { x: 80, y: 0 },
  up: { x: 0, y: -40 },
  down: { x: 0, y: 40 },
};

export function TeamBadge({
  team,
  size = "md",
  showName = true,
  from = "up",
  delay = 0,
  className = "",
}: Props) {
  const s = SIZE_MAP[size];
  const off = OFFSETS[from];

  return (
    <motion.div
      initial={{ ...off, opacity: 0, scale: 0.7 }}
      animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 18, delay }}
      className={`flex items-center gap-3 flag-wave-hover ${className}`}
    >
      <img
        src={getFlagPath(team)}
        alt={team}
        className={`${s.flag} rounded-full object-cover shadow-md border border-gray-100`}
      />
      {showName && (
        <span className={`font-fifa uppercase text-gray-900 ${s.name}`}>
          {team}
        </span>
      )}
    </motion.div>
  );
}
