"use client";

import { useEffect, useState } from "react";

interface Props {
  active: boolean;
  count?: number;
  durationMs?: number;
  colors?: string[];
}

const DEFAULT_COLORS = ["#C8102E", "#002868", "#006847", "#FFB81C", "#FFFFFF"];

interface Piece {
  id: number;
  left: number;
  tx: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
}

export function Confetti({
  active,
  count = 60,
  durationMs = 2500,
  colors = DEFAULT_COLORS,
}: Props) {
  const [pieces, setPieces] = useState<Piece[]>([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }
    const next: Piece[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      tx: (Math.random() - 0.5) * 240,
      delay: Math.random() * 400,
      duration: 1600 + Math.random() * 1400,
      color: colors[i % colors.length],
      rotate: Math.random() * 360,
    }));
    setPieces(next);
    const t = setTimeout(() => setPieces([]), durationMs + 800);
    return () => clearTimeout(t);
  }, [active, count, durationMs, colors]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.duration}ms`,
            transform: `rotate(${p.rotate}deg)`,
            // @ts-expect-error CSS var passthrough
            "--tx": `${p.tx}px`,
          }}
        />
      ))}
    </div>
  );
}
