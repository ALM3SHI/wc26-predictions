"use client";

// ─────────────────────────────────────────────────────────────
// Flag — <img> wrapper with graceful fallback.
//
// 1. Tries the resolved /flags/<slug>.png first.
// 2. If it 404s, switches to a rendered SVG showing the team's
//    initials in a deterministic gradient background — no more
//    broken image glyphs for teams whose PNG we haven't shipped.
// 3. Purely visual — no external calls, no async work.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { getFlagPath } from "@/lib/utils";

interface Props {
  team: string;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

function initialsFor(name: string): string {
  const clean = name.replace(/[^\p{L}\s]/gu, "").trim();
  if (!clean) return "?";
  const parts = clean.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic hue per team so the same team always renders the
// same background — the pattern feels intentional, not random.
function hueFor(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) % 360;
  }
  return h;
}

function InitialsAvatar({
  team,
  className,
  style,
}: {
  team: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const initials = useMemo(() => initialsFor(team), [team]);
  const hue = useMemo(() => hueFor(team), [team]);
  const bg = `linear-gradient(135deg, hsl(${hue}, 70%, 45%), hsl(${(hue + 40) % 360}, 65%, 30%))`;
  return (
    <div
      role="img"
      aria-label={team}
      className={`inline-flex items-center justify-center rounded-full text-white font-bold ${className ?? ""}`}
      style={{
        background: bg,
        boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.15)",
        fontSize: "40%",
        letterSpacing: "0.02em",
        ...style,
      }}
    >
      <span style={{ fontSize: "40%" }}>{initials}</span>
    </div>
  );
}

export function Flag({ team, className = "", alt, style }: Props) {
  const [broken, setBroken] = useState(false);
  const src = useMemo(() => getFlagPath(team), [team]);
  const isPlaceholder = src.endsWith("/flags/tbd.png");

  if (broken || isPlaceholder) {
    return <InitialsAvatar team={team} className={className} style={style} />;
  }

  return (
    <img
      src={src}
      alt={alt ?? team ?? ""}
      className={className}
      style={style}
      onError={() => setBroken(true)}
    />
  );
}
