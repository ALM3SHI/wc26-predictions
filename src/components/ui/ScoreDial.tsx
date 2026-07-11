"use client";

import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronUp, ChevronDown } from "lucide-react";

interface Props {
  value: number;
  onChange: (n: number) => void;
  disabled?: boolean;
  max?: number;
  min?: number;
  accentColor?: string;
  label?: string;
}

const DIGIT_HEIGHT = 96; // matches Tailwind h-24 in the visible window

/**
 * Slot-machine style score picker. The whole 0..max column of numbers
 * lives in a translated container; the "window" clips everything but
 * the currently selected digit. Wheel, drag, tap ↑↓ and keyboard arrows
 * all cycle the value.
 */
export function ScoreDial({
  value,
  onChange,
  disabled,
  max = 9,
  min = 0,
  accentColor = "#C8102E",
  label,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const clamp = useCallback(
    (n: number) => Math.max(min, Math.min(max, n)),
    [min, max],
  );

  const bump = useCallback(
    (delta: number) => {
      if (disabled) return;
      onChange(clamp(value + delta));
    },
    [clamp, disabled, onChange, value],
  );

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (disabled) return;
      e.preventDefault();
      bump(e.deltaY > 0 ? 1 : -1);
    },
    [bump, disabled],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const digits = Array.from({ length: max - min + 1 }, (_, i) => i + min);

  return (
    <div className="flex flex-col items-center gap-3">
      {label && (
        <span className="text-[10px] uppercase tracking-widest font-bold text-gray-500">
          {label}
        </span>
      )}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => bump(-1)}
          disabled={disabled || value <= min}
          className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-30 transition"
          aria-label="Decrease score"
        >
          <ChevronUp className="w-5 h-5 text-gray-600" />
        </button>

        <div
          ref={containerRef}
          tabIndex={disabled ? -1 : 0}
          role="spinbutton"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              bump(-1);
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              bump(1);
            } else if (/^[0-9]$/.test(e.key)) {
              const n = parseInt(e.key, 10);
              if (n >= min && n <= max) onChange(n);
            }
          }}
          className={`relative overflow-hidden rounded-2xl border-2 w-24 md:w-28 h-24 md:h-28 select-none outline-none focus:ring-4 focus:ring-offset-2 ${
            disabled ? "opacity-60" : ""
          }`}
          style={{
            borderColor: accentColor,
            boxShadow: disabled
              ? undefined
              : `0 0 0 4px ${accentColor}18, inset 0 -12px 24px rgba(0,0,0,0.15), inset 0 12px 24px rgba(255,255,255,0.4)`,
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.05) 100%), white",
            // @ts-expect-error CSS var
            "--tw-ring-color": accentColor,
          }}
          onClick={() => bump(1)}
        >
          {/* horizontal window bands */}
          <div className="absolute inset-x-0 top-0 h-1/4 pointer-events-none bg-gradient-to-b from-white/80 to-transparent z-10" />
          <div className="absolute inset-x-0 bottom-0 h-1/4 pointer-events-none bg-gradient-to-t from-white/80 to-transparent z-10" />

          {/* Digit column */}
          <motion.div
            className="flex flex-col items-center"
            animate={{ y: -value * DIGIT_HEIGHT }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            style={{ paddingTop: 0 }}
          >
            {digits.map((d) => (
              <div
                key={d}
                className="flex items-center justify-center font-fifa text-5xl md:text-6xl text-gray-900"
                style={{ height: DIGIT_HEIGHT, width: "100%" }}
              >
                {d}
              </div>
            ))}
          </motion.div>
        </div>

        <button
          type="button"
          onClick={() => bump(1)}
          disabled={disabled || value >= max}
          className="p-1 rounded-full hover:bg-gray-100 disabled:opacity-30 transition"
          aria-label="Increase score"
        >
          <ChevronDown className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
}
