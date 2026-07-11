"use client";

import { useMemo } from "react";

interface Props {
  color?: string;
  count?: number;
  size?: number;
}

/**
 * Absolutely-positioned fire burst that sits behind an element.
 * Uses radial gradients + CSS keyframes only (no canvas / lib).
 * Renders a ring of flame tongues that flicker and rise.
 */
export function FireBurst({
  color = "#FF6B00",
  count = 10,
  size = 100,
}: Props) {
  const flames = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (360 / count) * i + Math.random() * 12 - 6;
        const delay = i * 0.08 + Math.random() * 0.2;
        const height = 40 + Math.random() * 30;
        const width = 14 + Math.random() * 6;
        return { angle, delay, height, width, key: i };
      }),
    [count],
  );

  return (
    <div
      className="pointer-events-none absolute inset-0 flex items-center justify-center"
      aria-hidden="true"
      style={{ width: "100%", height: "100%" }}
    >
      <div
        className="relative"
        style={{ width: size, height: size }}
      >
        {flames.map((f) => (
          <span
            key={f.key}
            className="absolute left-1/2 top-1/2 origin-bottom fire-tongue"
            style={{
              width: f.width,
              height: f.height,
              marginLeft: -f.width / 2,
              marginTop: -size / 2 - f.height + 20,
              transform: `translate(-50%, -50%) rotate(${f.angle}deg) translateY(-${size / 2}px)`,
              transformOrigin: "center bottom",
              background: `radial-gradient(ellipse at 50% 90%, ${color} 0%, ${color}cc 30%, #FFB800aa 60%, transparent 100%)`,
              borderRadius: "50% 50% 40% 40% / 60% 60% 40% 40%",
              filter: "blur(1px)",
              animation: `fireFlicker 700ms ease-in-out ${f.delay}s infinite alternate`,
              opacity: 0.9,
            }}
          />
        ))}
        {/* Core glow */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}55 0%, ${color}22 40%, transparent 70%)`,
            animation: "corePulse 900ms ease-in-out infinite alternate",
          }}
        />
      </div>
    </div>
  );
}
