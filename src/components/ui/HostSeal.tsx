"use client";

import { HOST_RED, HOST_BLUE, HOST_GREEN, HOST_GOLD } from "@/lib/wc26-theme";

interface Props {
  size?: number;
  className?: string;
}

/**
 * Rotating "26" ornament framed by the host tri-color ring.
 * Pure SVG so it scales cleanly at any size, no dependency.
 */
export function HostSeal({ size = 80, className = "" }: Props) {
  const r = size / 2;
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        className="host-seal"
      >
        <defs>
          <linearGradient id="hostRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={HOST_RED} />
            <stop offset="33%" stopColor={HOST_BLUE} />
            <stop offset="66%" stopColor={HOST_GREEN} />
            <stop offset="100%" stopColor={HOST_GOLD} />
          </linearGradient>
        </defs>
        <circle
          cx={r}
          cy={r}
          r={r - 4}
          fill="none"
          stroke="url(#hostRing)"
          strokeWidth={4}
          strokeDasharray="6 4"
        />
        <circle cx={r} cy={r} r={r - 12} fill="white" opacity={0.6} />
      </svg>
      <span
        className="absolute font-fifa font-black"
        style={{
          fontSize: size * 0.5,
          color: HOST_BLUE,
          lineHeight: 1,
        }}
      >
        26
      </span>
    </div>
  );
}
