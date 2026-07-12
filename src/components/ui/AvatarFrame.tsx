"use client";

// ─────────────────────────────────────────────────────────────
// AvatarFrame — reusable avatar wrapper that reflects the user's
// current Battle Pass tier. Frames map to visual bands:
//   T1-2   → plain
//   T3-5   → bronze
//   T6-10  → silver
//   T11-15 → gold
//   T16-19 → diamond (animated conic ring)
//   T20    → legend (dual-ring + glow)
//
// Renders as a plain <div><img/></div> when no tier is supplied,
// so it's a safe drop-in anywhere in the codebase.
// ─────────────────────────────────────────────────────────────

import { motion } from "framer-motion";

interface Props {
  src: string | null | undefined;
  tier?: number;
  size?: number; // pixel diameter of the avatar itself
  alt?: string;
  className?: string;
}

function frameForTier(tier?: number) {
  if (!tier || tier <= 2) {
    return {
      band: "none" as const,
      ring: "#E5E7EB",
      glow: "transparent",
      label: null as string | null,
    };
  }
  if (tier <= 5) {
    return {
      band: "bronze" as const,
      ring: "#B45309",
      glow: "rgba(180,83,9,0.35)",
      label: "T3",
    };
  }
  if (tier <= 10) {
    return {
      band: "silver" as const,
      ring: "#9CA3AF",
      glow: "rgba(156,163,175,0.4)",
      label: "T6",
    };
  }
  if (tier <= 15) {
    return {
      band: "gold" as const,
      ring: "#F59E0B",
      glow: "rgba(245,158,11,0.5)",
      label: "T11",
    };
  }
  if (tier <= 19) {
    return {
      band: "diamond" as const,
      ring: "#22D3EE",
      glow: "rgba(34,211,238,0.55)",
      label: "T16",
    };
  }
  return {
    band: "legend" as const,
    ring: "#FFB81C",
    glow: "rgba(255,184,28,0.65)",
    label: "T20",
  };
}

export function AvatarFrame({
  src,
  tier,
  size = 64,
  alt = "",
  className = "",
}: Props) {
  const f = frameForTier(tier);
  const pad = f.band === "none" ? 0 : Math.max(3, Math.round(size * 0.06));
  const outer = size + pad * 2;

  const img = (
    <img
      src={src || "/images/default-avatar.png"}
      alt={alt}
      className="rounded-full object-cover"
      style={{ width: size, height: size, display: "block" }}
    />
  );

  if (f.band === "none") {
    return (
      <div
        className={`shrink-0 rounded-full ${className}`}
        style={{
          width: size,
          height: size,
          border: "2px solid rgba(255,255,255,0.9)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        }}
      >
        {img}
      </div>
    );
  }

  if (f.band === "diamond" || f.band === "legend") {
    // Animated conic ring — spins slowly, tinted to the band.
    return (
      <div
        className={`relative shrink-0 ${className}`}
        style={{ width: outer, height: outer }}
      >
        <motion.div
          aria-hidden
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(from 0deg, ${f.ring}, white, ${f.ring})`,
            filter: `drop-shadow(0 0 12px ${f.glow})`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: f.band === "legend" ? 6 : 9, ease: "linear", repeat: Infinity }}
        />
        {f.band === "legend" && (
          <motion.div
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{
              background: "conic-gradient(from 180deg, #FFB81C, transparent 25%, #FFB81C 60%, transparent 90%)",
              opacity: 0.7,
              mixBlendMode: "screen",
            }}
            animate={{ rotate: -360 }}
            transition={{ duration: 4, ease: "linear", repeat: Infinity }}
          />
        )}
        <div
          className="absolute rounded-full bg-white"
          style={{ inset: pad }}
        >
          {img}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`shrink-0 rounded-full ${className}`}
      style={{
        width: outer,
        height: outer,
        padding: pad,
        background: `linear-gradient(135deg, ${f.ring}, ${f.ring}88)`,
        boxShadow: `0 0 18px ${f.glow}`,
      }}
    >
      <div className="rounded-full bg-white" style={{ padding: 2 }}>
        {img}
      </div>
    </div>
  );
}
