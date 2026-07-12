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

// SVG font stack that carries Arabic + Latin glyphs on every OS
// without requiring us to embed a base64-encoded webfont.
const FONT = '"Noto Sans Arabic","Segoe UI","San Francisco","Roboto","Helvetica","Arial",sans-serif';

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
  labelPoints,
  labelPick,
  labelActual,
  rtl,
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
  labelPoints: string;
  labelPick: string;
  labelActual: string;
  rtl: boolean;
}): string {
  const stake = getStakeByMult(stakeMultiplier);
  const exact = userHome === actualHome && userAway === actualAway;
  const heroColor = exact ? "#F59E0B" : stake.color;

  // The whole card lays out LTR at the SVG level. Individual Arabic
  // strings are wrapped in <text direction="rtl"> so their glyph
  // shaping is preserved but they never bleed into the numeric score
  // in the middle (that was the "collision" bug).
  const arabicAttrs = rtl
    ? 'direction="rtl" unicode-bidi="isolate"'
    : "";

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

  <rect x="0" y="80" width="${CARD_W}" height="14" fill="url(#tri)"/>

  <!-- Brand always LTR -->
  <text x="80" y="60" font-family="${FONT}" font-weight="900" font-size="42" fill="#ffffff" opacity="0.95">WC26</text>
  <text x="${CARD_W - 80}" y="60" text-anchor="end" font-family="${FONT}" font-weight="700" font-size="24" fill="#ffffff" opacity="0.6" ${arabicAttrs}>${escapeXml(tagline)}</text>

  <!-- Result badge -->
  <g transform="translate(${CARD_W / 2}, 260)">
    <rect x="-300" y="-52" width="600" height="104" rx="52" fill="${heroColor}" opacity="0.18"/>
    <text text-anchor="middle" dominant-baseline="middle" font-family="${FONT}" font-weight="900" font-size="42" fill="${heroColor}" ${arabicAttrs}>
      ${exact ? escapeXml(labelExact) : escapeXml("+" + pointsAwarded + " · " + labelPoints)}
    </text>
  </g>

  <!-- Team names — two isolated text elements so Arabic doesn't
       reorder around the middle score. -->
  <g transform="translate(${CARD_W / 2}, 500)">
    <text x="-260" text-anchor="end" font-family="${FONT}" font-weight="800" font-size="52" fill="#FFFFFF" opacity="0.92" ${arabicAttrs}>${escapeXml(homeTeam)}</text>
    <text x="260" text-anchor="start" font-family="${FONT}" font-weight="800" font-size="52" fill="#FFFFFF" opacity="0.92" ${arabicAttrs}>${escapeXml(awayTeam)}</text>
    <text x="0" y="10" text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="42" fill="#FFFFFF" opacity="0.6" direction="ltr">×</text>
  </g>

  <!-- Score column — LTR only. Two rows: user pick + actual. -->
  <g transform="translate(${CARD_W / 2}, 750)">
    <text text-anchor="middle" font-family="${FONT}" font-weight="700" font-size="30" fill="#FFFFFF" opacity="0.55" ${arabicAttrs}>${escapeXml(labelPick)}</text>
    <text text-anchor="middle" y="150" font-family="${FONT}" font-weight="900" font-size="180" fill="#FFFFFF" direction="ltr">${userHome}–${userAway}</text>

    <text text-anchor="middle" y="230" font-family="${FONT}" font-weight="700" font-size="26" fill="#FFFFFF" opacity="0.55" ${arabicAttrs}>${escapeXml(labelActual)}</text>
    <text text-anchor="middle" y="300" font-family="${FONT}" font-weight="800" font-size="70" fill="${heroColor}" direction="ltr">${actualHome}–${actualAway}</text>
  </g>

  <!-- Player + points strip -->
  <g transform="translate(0, ${CARD_H - 200})">
    <rect x="60" y="0" width="${CARD_W - 120}" height="140" rx="32" fill="#FFFFFF" opacity="0.06"/>
    <text x="100" y="88" font-family="${FONT}" font-weight="800" font-size="46" fill="#FFFFFF" ${arabicAttrs}>${escapeXml(displayName)}</text>
    <g transform="translate(${CARD_W - 100}, 70)">
      <text text-anchor="end" font-family="${FONT}" font-weight="900" font-size="72" fill="${heroColor}" direction="ltr">+${pointsAwarded}</text>
      <text text-anchor="end" y="40" font-family="${FONT}" font-weight="700" font-size="24" fill="#FFFFFF" opacity="0.6" direction="ltr">${stakeMultiplier}x</text>
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
        rtl: lang === "ar",
      }),
    [props, t, lang],
  );

  const doAction = async (kind: "share" | "download") => {
    setBusy(kind);
    try {
      const blob = await svgToPngBlob(svg, CARD_W, CARD_H);
      // File name is ASCII-only so Safari's "Save Image" prompt
      // doesn't refuse special characters.
      const filename = `wc26-${props.userHome}-${props.userAway}.png`;

      // Prefer the Web Share API when the OS advertises it AND we
      // can attach files. Some Safari builds report `share` without
      // `canShare({files})`, so we guard on both.
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
          try {
            await nav.share({
              files: [file],
              title: t("share.result.title"),
            });
            return;
          } catch (err) {
            // User cancelled or share failed — fall through to download.
            const name = (err as { name?: string }).name;
            if (name === "AbortError") return;
          }
        }
      }

      // Download path — force the browser to trigger a save dialog
      // instead of navigating to the blob URL (which "kicked users
      // out of the app" on iOS Safari).
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      // target="_self" ensures Safari treats this as an in-page
      // download, not a navigation to a new tab.
      a.target = "_self";
      document.body.appendChild(a);
      a.click();
      // Give Safari a tick to start the download before we revoke.
      setTimeout(() => {
        a.remove();
        URL.revokeObjectURL(url);
      }, 500);
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
