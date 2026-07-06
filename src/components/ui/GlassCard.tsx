"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

/* ── Types ────────────────────────────────────────────── */
interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  glow?: "purple" | "green" | "cyan";
}

/* ── Glow class map ───────────────────────────────────── */
const glowClasses: Record<string, string> = {
  purple: "neon-glow-purple",
  green: "neon-glow-green",
  cyan: "neon-glow-cyan",
};

/* ── Component ────────────────────────────────────────── */
export function GlassCard({
  children,
  className = "",
  onClick,
  hover = false,
  glow,
}: GlassCardProps) {
  const baseClass = hover ? "glass-hover" : "glass";
  const glowClass = glow ? glowClasses[glow] : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`${baseClass} ${glowClass} ${className}`.trim()}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}
