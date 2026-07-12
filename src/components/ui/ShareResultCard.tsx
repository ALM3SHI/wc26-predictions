"use client";

// ─────────────────────────────────────────────────────────────
// Shareable exact-score result card
//
// Generates an SVG poster of the user's win, converts it to a PNG
// Blob, and offers the Web Share API when available (fall-back:
// download the PNG). SVG-first so we get pixel-crisp typography
// without a canvas ref dance.
// ─────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Share2, X, Trophy } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { localizeTeam } from "@/lib/i18n-data";
import { getStakeByMult } from "@/lib/gamble";

interface Props {
  open: boolean;
  onClose: () => void;
  homeTeam: string;
  awayTeam: string;
  userHome: number;
  userAway: number;
  actualHome: number;
  actualAway: number;
  pointsAwarded: number;
  stakeMultiplier: number;
  displayName: string;
}

const CARD_W = 1080;
const CARD_H = 1350; // 4:5, ideal for IG / X

function buildSvg({
  displayName,
  homeTeam,
  awayTeam,
  userHome,
  userAway,
  actualHome,
  actualAway,
  pointsAwarded,
  stakeMultiplier,
  tagline,
  labelExact,
  labelPick,
  labelPoints,
  labelActual,
}: {
  displayName: string;
  homeTeam: string;
  awayTeam: string;
  userHome: number;
  userAway: number;
  actualHome: number;
  actualAway: number;
  pointsAwarded: number;
  stakeMultiplier: number;
  tagline: string;
  labelExact: string;
  labelPick: string;
  labelPoints: string;
  labelActual: string;
}): string {
  const stake = getStakeByMult(stakeMultiplier);
  const exact = userHome === actualHome && userAway === actualAway;
  const heroColor = exact ? "#F59E0B" : stake.color;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_W} ${CARD_H}" width="${CARD_W}" height="${CARD_H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0B1220"/>
      <stop offset="0.55" stop-color="#0A1F4A"/>
      <stop offset="1" stop-color="#3B0A16"/>
    </linearGradient>
    <linearGradient id="tri" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#C8102E"/>
      <stop offset="0.33" stop-color="#C8102E"/>
      <stop offset="0.33" stop-color="#002868"/>
      <stop offset="0.66" stop-color="#002868"/>
      <stop offset="0.66" stop-color="#006847"/>
      <stop offset="1" stop-color="#006847"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.35" r="0.6">
      <stop offset="0" stop-color="${heroColor}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${heroColor}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>

  <!-- Tri stripe -->
  <rect x="0" y="80" width="${CARD_W}" height="14" fill="url(#tri)"/>

  <!-- Brand -->
  <text x="80" y="60" font-family="system-ui,sans-serif" font-weight="900" font-size="42" fill="#ffffff" opacity="0.95">WC26</text>
  <text x="${CARD_W - 80}" y="60" text-anchor="end" font-family="system-ui,sans-serif" font-weight="700" font-size="24" fill="#ffffff" opacity="0.6">${escapeXml(tagline)}</text>

  <!-- Result label -->
  <g transform="translate(${CARD_W / 2}, 260)">
    <rect x="-260" y="-46" width="520" height="92" rx="46" fill="${heroColor}" opacity="0.15"/>
    <text text-anchor="middle" dominant-baseline="middle" font-family="system-ui,sans-serif" font-weight="900" font-size="46" fill="${heroColor}">
      ${exact ? escapeXml(labelExact) : "+" + pointsAwarded + " " + escapeXml(labelPoints)}
    </text>
  </g>

  <!-- Teams block -->
  <g transform="translate(${CARD_W / 2}, 620)">
    <text text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="44" fill="#FFFFFF" opacity="0.9">
      ${escapeXml(homeTeam)} · ${escapeXml(awayTeam)}
    </text>

    <text text-anchor="middle" y="90" font-family="system-ui,sans-serif" font-weight="900" font-size="200" fill="#FFFFFF">
      ${userHome}–${userAway}
    </text>

    <text text-anchor="middle" y="150" font-family="system-ui,sans-serif" font-weight="700" font-size="32" fill="#FFFFFF" opacity="0.6">
      ${escapeXml(labelPick)}
    </text>

    <text text-anchor="middle" y="260" font-family="system-ui,sans-serif" font-weight="800" font-size="60" fill="${heroColor}">
      ${actualHome}–${actualAway}
    </text>
    <text text-anchor="middle" y="300" font-family="system-ui,sans-serif" font-weight="700" font-size="26" fill="#FFFFFF" opacity="0.6">
      ${escapeXml(labelActual)}
    </text>
  </g>

  <!-- Player + points strip -->
  <g transform="translate(0, ${CARD_H - 200})">
    <rect x="60" y="0" width="${CARD_W - 120}" height="140" rx="32" fill="#FFFFFF" opacity="0.06"/>
    <text x="100" y="88" font-family="system-ui,sans-serif" font-weight="800" font-size="46" fill="#FFFFFF">
      ${escapeXml(displayName)}
    </text>
    <g transform="translate(${CARD_W - 100}, 70)">
      <text text-anchor="end" font-family="system-ui,sans-serif" font-weight="900" font-size="72" fill="${heroColor}">
        +${pointsAwarded}
      </text>
      <text text-anchor="end" y="40" font-family="system-ui,sans-serif" font-weight="700" font-size="24" fill="#FFFFFF" opacity="0.6">
        ${stakeMultiplier}x · ${escapeXml(labelPoints)}
      </text>
    </g>
  </g>
</svg>`;
}

function escapeXml(v: string | number): string {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

async function svgToPngBlob(svg: string, w: number, h: number): Promise<Blob> {
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("svg load failed"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d ctx unavailable");
    ctx.drawImage(img, 0, 0, w, h);
    return await new Promise<Blob>((res, rej) =>
      canvas.toBlob(
        (b) => (b ? res(b) : rej(new Error("toBlob failed"))),
        "image/png",
        1,
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function ShareResultCard(props: Props) {
  const { t, lang } = useI18n();
  const [busy, setBusy] = useState<"share" | "download" | null>(null);

  const svg = useMemo(
    () =>
      buildSvg({
        displayName: props.displayName || "player",
        homeTeam: localizeTeam(props.homeTeam, lang),
        awayTeam: localizeTeam(props.awayTeam, lang),
        userHome: props.userHome,
        userAway: props.userAway,
        actualHome: props.actualHome,
        actualAway: props.actualAway,
        pointsAwarded: props.pointsAwarded,
        stakeMultiplier: props.stakeMultiplier,
        tagline: t("share.tagline"),
        labelExact: t("result.exact"),
        labelPick: t("result.pick"),
        labelPoints: t("home.points"),
        labelActual: t("result.actual"),
      }),
    [props, t, lang],
  );

  const doAction = async (kind: "share" | "download") => {
    setBusy(kind);
    try {
      const blob = await svgToPngBlob(svg, CARD_W, CARD_H);
      const filename = `wc26-${props.homeTeam}-${props.awayTeam}-${props.userHome}-${props.userAway}.png`;

      if (
        kind === "share" &&
        typeof navigator !== "undefined" &&
        "canShare" in navigator
      ) {
        const file = new File([blob], filename, { type: "image/png" });
        const nav = navigator as Navigator & {
          canShare?: (data: { files: File[] }) => boolean;
          share?: (data: { files: File[]; title?: string }) => Promise<void>;
        };
        if (nav.canShare?.({ files: [file] }) && nav.share) {
          await nav.share({ files: [file], title: t("share.result.title") });
          return;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(null);
    }
  };

  return (
    <AnimatePresence>
      {props.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={props.onClose}
          className="fixed inset-0 z-[95] bg-black/70 backdrop-blur px-4 flex items-center justify-center"
          role="dialog"
          aria-label={t("share.result.title")}
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-3xl bg-white p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-bold text-gray-900">
                <Trophy className="w-4 h-4 text-yellow-500" />
                {t("share.result.title")}
              </div>
              <button
                type="button"
                onClick={props.onClose}
                aria-label={t("share.close")}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            {/* Preview */}
            <div
              className="rounded-2xl overflow-hidden border border-gray-200 aspect-[4/5] bg-gray-900"
              dangerouslySetInnerHTML={{ __html: svg }}
            />

            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => doAction("share")}
                disabled={busy !== null}
                className="flex-1 inline-flex items-center justify-center gap-1.5 gradient-purple-cyan text-white font-bold py-2.5 rounded-xl active:scale-95 disabled:opacity-60"
              >
                <Share2 className="w-4 h-4" />
                {t("share.title")}
              </button>
              <button
                type="button"
                onClick={() => doAction("download")}
                disabled={busy !== null}
                className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-800 font-bold py-2.5 px-3 rounded-xl active:scale-95 disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                {t("share.download")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
