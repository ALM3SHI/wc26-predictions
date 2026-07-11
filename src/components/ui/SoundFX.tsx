"use client";

// Web Audio API tones — no audio file dependency.
// Controlled by localStorage "wc26.sound" (default: enabled).

function isEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = window.localStorage.getItem("wc26.sound");
    return v === null ? true : v === "true";
  } catch {
    return false;
  }
}

let ctx: AudioContext | null = null;
function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

function tone(freq: number, ms: number, delay = 0, type: OscillatorType = "sine", gain = 0.15) {
  if (!isEnabled()) return;
  const c = getCtx();
  if (!c) return;
  const now = c.currentTime + delay / 1000;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, now + ms / 1000);
  osc.connect(g).connect(c.destination);
  osc.start(now);
  osc.stop(now + ms / 1000 + 0.02);
}

export const sfx = {
  chip() {
    tone(660, 90, 0, "square", 0.08);
    tone(880, 90, 40, "square", 0.06);
  },
  lockIn() {
    tone(440, 120, 0, "triangle", 0.12);
    tone(660, 140, 100, "triangle", 0.12);
    tone(880, 200, 220, "triangle", 0.14);
    tone(1320, 300, 400, "sine", 0.1);
  },
  win() {
    tone(523, 100, 0, "triangle", 0.14);
    tone(659, 100, 90, "triangle", 0.14);
    tone(784, 160, 180, "triangle", 0.14);
    tone(1047, 280, 320, "sine", 0.12);
  },
  fail() {
    tone(300, 220, 0, "sawtooth", 0.08);
    tone(180, 260, 120, "sawtooth", 0.06);
  },
  tick() {
    tone(1200, 40, 0, "square", 0.04);
  },
};
