"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

/* ── Types ────────────────────────────────────────────── */
type Variant = "purple" | "green" | "cyan" | "red";
type Size = "sm" | "md" | "lg";

interface NeonButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  type?: "button" | "submit";
}

/* ── Style maps ───────────────────────────────────────── */
const variantStyles: Record<
  Variant,
  { gradient: string; glow: string; glowHover: string }
> = {
  purple: {
    gradient: "bg-gradient-to-r from-[#8B5CF6] to-[#A78BFA]",
    glow: "shadow-[0_0_20px_rgba(139,92,246,0.3)]",
    glowHover: "shadow-[0_0_30px_rgba(139,92,246,0.5),0_0_60px_rgba(139,92,246,0.2)]",
  },
  green: {
    gradient: "bg-gradient-to-r from-[#10B981] to-[#34D399]",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.3)]",
    glowHover: "shadow-[0_0_30px_rgba(16,185,129,0.5),0_0_60px_rgba(16,185,129,0.2)]",
  },
  cyan: {
    gradient: "bg-gradient-to-r from-[#06B6D4] to-[#22D3EE]",
    glow: "shadow-[0_0_20px_rgba(6,182,212,0.3)]",
    glowHover: "shadow-[0_0_30px_rgba(6,182,212,0.5),0_0_60px_rgba(6,182,212,0.2)]",
  },
  red: {
    gradient: "bg-gradient-to-r from-[#EF4444] to-[#F87171]",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.3)]",
    glowHover: "shadow-[0_0_30px_rgba(239,68,68,0.5),0_0_60px_rgba(239,68,68,0.2)]",
  },
};

const sizeStyles: Record<Size, string> = {
  sm: "px-4 py-2 text-sm rounded-lg gap-1.5",
  md: "px-6 py-3 text-base rounded-xl gap-2",
  lg: "px-8 py-4 text-lg rounded-2xl gap-2.5",
};

/* ── Spinner ──────────────────────────────────────────── */
function Spinner({ size }: { size: Size }) {
  const dim = size === "sm" ? "h-4 w-4" : size === "md" ? "h-5 w-5" : "h-6 w-6";
  return (
    <svg
      className={`animate-spin ${dim}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

/* ── Component ────────────────────────────────────────── */
export function NeonButton({
  children,
  onClick,
  className = "",
  variant = "purple",
  size = "md",
  disabled = false,
  loading = false,
  type = "button",
}: NeonButtonProps) {
  const v = variantStyles[variant];
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={isDisabled ? undefined : { scale: 1.04 }}
      whileTap={isDisabled ? undefined : { scale: 0.96 }}
      className={[
        /* layout */
        "relative inline-flex items-center justify-center font-display font-semibold",
        "text-white select-none",
        /* gradient & size */
        v.gradient,
        sizeStyles[size],
        /* glow */
        v.glow,
        `hover:${v.glowHover}`,
        /* transitions */
        "transition-shadow duration-300 ease-out",
        /* disabled / loading */
        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
        /* custom */
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading && <Spinner size={size} />}
      <span className={loading ? "opacity-70" : ""}>{children}</span>
    </motion.button>
  );
}
