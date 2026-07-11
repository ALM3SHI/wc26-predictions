"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  target: string; // ISO timestamp
  onLock?: () => void;
  label?: string;
  accentColor?: string;
  compact?: boolean;
}

interface Parts {
  h: string;
  m: string;
  s: string;
  locked: boolean;
}

function computeParts(target: number): Parts {
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) {
    return { h: "00", m: "00", s: "00", locked: true };
  }
  const h = Math.floor(diff / (1000 * 60 * 60));
  const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((diff % (1000 * 60)) / 1000);
  return {
    h: h.toString().padStart(2, "0"),
    m: m.toString().padStart(2, "0"),
    s: s.toString().padStart(2, "0"),
    locked: false,
  };
}

function Digit({
  value,
  color,
  compact,
}: {
  value: string;
  color: string;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-black text-white font-fifa rounded-md border ${
        compact ? "px-2 py-1 text-2xl" : "px-3 py-2 text-4xl md:text-5xl"
      }`}
      style={{ borderColor: `${color}55` }}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={value}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-100%", opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="inline-block tabular-nums"
          style={{ color }}
        >
          {value}
        </motion.span>
      </AnimatePresence>
      {/* seam */}
      <div className="absolute inset-x-0 top-1/2 h-px bg-white/10 pointer-events-none" />
    </div>
  );
}

export function CountdownDigits({
  target,
  onLock,
  label,
  accentColor = "#22D3EE",
  compact,
}: Props) {
  const targetMs = new Date(target).getTime();
  const [parts, setParts] = useState<Parts>(() => computeParts(targetMs));
  const onLockRef = useRef(onLock);
  onLockRef.current = onLock;

  useEffect(() => {
    if (isNaN(targetMs)) return;
    setParts(computeParts(targetMs));
    const iv = setInterval(() => {
      const next = computeParts(targetMs);
      setParts(next);
      if (next.locked) {
        clearInterval(iv);
        onLockRef.current?.();
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [targetMs]);

  if (parts.locked) {
    return (
      <div className="flex flex-col items-center">
        {label && (
          <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
            {label}
          </span>
        )}
        <span
          className={`font-fifa tracking-widest ${
            compact ? "text-2xl" : "text-4xl md:text-5xl"
          }`}
          style={{ color: "#EF4444" }}
        >
          MATCH LIVE
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-2">
          {label}
        </span>
      )}
      <div className={`flex items-center ${compact ? "gap-1" : "gap-2"}`}>
        <Digit value={parts.h} color={accentColor} compact={compact} />
        <span
          className={`font-fifa ${compact ? "text-xl" : "text-3xl"} text-gray-400`}
        >
          :
        </span>
        <Digit value={parts.m} color={accentColor} compact={compact} />
        <span
          className={`font-fifa ${compact ? "text-xl" : "text-3xl"} text-gray-400`}
        >
          :
        </span>
        <Digit value={parts.s} color={accentColor} compact={compact} />
      </div>
    </div>
  );
}
