"use client";

// ─────────────────────────────────────────────────────────────
// WeeklySummary — Sunday recap page for the user.
// Reads pre-aggregated numbers from the server component parent
// and offers a share-friendly SVG card via the ShareCard modal
// pattern from ShareResultCard.
// ─────────────────────────────────────────────────────────────

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Target,
  Zap,
  Trophy,
  Sparkles,
  Share2,
  Download,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { localizeNumber, localizeTeam } from "@/lib/i18n-data";
import { AvatarFrame } from "@/components/ui/AvatarFrame";
import { Flag } from "@/components/ui/Flag";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";

interface Props {
  displayName: string;
  avatarUrl: string | null;
  favoriteTeam: string | null;
  tier: number;
  picks: number;
  scored: number;
  accuracy: number;
  xpGained: number;
  biggestWin: number;
  biggestHome: string | null;
  biggestAway: string | null;
  biggestScoreHome: number;
  biggestScoreAway: number;
}

const CARD_W = 1080;
const CARD_H = 1350;

function escapeXml(v: string | number): string {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildSvg(p: {
  displayName: string;
  tier: number;
  picks: number;
  accuracy: number;
  xpGained: number;
  biggestWin: number;
  labelWeek: string;
  labelPicks: string;
  labelAccuracy: string;
  labelXp: string;
  labelTier: string;
  labelBrand: string;
}): string {
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
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="0" y="80" width="${CARD_W}" height="14" fill="url(#tri)"/>
  <text x="80" y="60" font-family="system-ui,sans-serif" font-weight="900" font-size="42" fill="#ffffff" opacity="0.95">WC26</text>
  <text x="${CARD_W - 80}" y="60" text-anchor="end" font-family="system-ui,sans-serif" font-weight="700" font-size="24" fill="#ffffff" opacity="0.6">${escapeXml(p.labelBrand)}</text>

  <g transform="translate(${CARD_W / 2}, 240)">
    <text text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="48" fill="#FFB81C">${escapeXml(p.labelWeek)}</text>
    <text text-anchor="middle" y="80" font-family="system-ui,sans-serif" font-weight="900" font-size="72" fill="#FFFFFF">${escapeXml(p.displayName)}</text>
  </g>

  <g transform="translate(${CARD_W / 2}, 500)">
    <g transform="translate(-360, 0)">
      <text text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="26" fill="#FFFFFF" opacity="0.7">${escapeXml(p.labelPicks)}</text>
      <text text-anchor="middle" y="70" font-family="system-ui,sans-serif" font-weight="900" font-size="96" fill="#FFFFFF">${p.picks}</text>
    </g>
    <g transform="translate(0, 0)">
      <text text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="26" fill="#FFFFFF" opacity="0.7">${escapeXml(p.labelAccuracy)}</text>
      <text text-anchor="middle" y="70" font-family="system-ui,sans-serif" font-weight="900" font-size="96" fill="#10B981">${p.accuracy}%</text>
    </g>
    <g transform="translate(360, 0)">
      <text text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="26" fill="#FFFFFF" opacity="0.7">${escapeXml(p.labelXp)}</text>
      <text text-anchor="middle" y="70" font-family="system-ui,sans-serif" font-weight="900" font-size="96" fill="#FFB81C">+${p.xpGained}</text>
    </g>
  </g>

  <g transform="translate(${CARD_W / 2}, 900)">
    <rect x="-320" y="-70" width="640" height="140" rx="70" fill="#FFFFFF" opacity="0.08"/>
    <text text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="28" fill="#FFFFFF" opacity="0.7">${escapeXml(p.labelTier)}</text>
    <text text-anchor="middle" y="52" font-family="system-ui,sans-serif" font-weight="900" font-size="72" fill="#FFFFFF">T${p.tier}</text>
  </g>

  <g transform="translate(${CARD_W / 2}, ${CARD_H - 120})">
    <text text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="26" fill="#FFFFFF" opacity="0.5">wc26.predictions</text>
  </g>
</svg>`;
}

async function svgToPng(svg: string): Promise<Blob> {
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
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d ctx unavailable");
    ctx.drawImage(img, 0, 0, CARD_W, CARD_H);
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

export default function WeeklySummary(props: Props) {
  const { t, lang, dir } = useI18n();
  const [busy, setBusy] = useState<"share" | "download" | null>(null);
  const [showSharePreview, setShowSharePreview] = useState(false);

  const empty = props.picks === 0;

  const svg = buildSvg({
    displayName: props.displayName || "player",
    tier: props.tier,
    picks: props.picks,
    accuracy: props.accuracy,
    xpGained: props.xpGained,
    biggestWin: props.biggestWin,
    labelWeek: t("summary.week"),
    labelPicks: t("summary.picks"),
    labelAccuracy: t("summary.accuracy"),
    labelXp: "XP",
    labelTier: t("summary.tierNow"),
    labelBrand: t("share.tagline"),
  });

  const doAction = async (kind: "share" | "download") => {
    setBusy(kind);
    try {
      const blob = await svgToPng(svg);
      const filename = `wc26-week-${props.displayName || "recap"}.png`;
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
          await nav.share({ files: [file], title: t("summary.share.title") });
          return;
        }
      }
      const u = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = u;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(u);
    } finally {
      setBusy(null);
    }
  };

  const Stat = ({
    icon: Icon,
    label,
    value,
    color,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    color: string;
  }) => (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ background: color }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
          {label}
        </div>
      </div>
      <div className="font-fifa text-3xl text-gray-900" dir="ltr">
        {value}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pt-8 pb-24 px-4 sm:px-6" dir={dir}>
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip-auto" />
          {t("nav.home")}
        </Link>

        <div className="mb-6">
          <h1 className="font-fifa text-3xl md:text-4xl uppercase text-gray-900 leading-none">
            {t("summary.title")}
          </h1>
          <p className="text-gray-500 text-sm mt-2">{t("summary.sub")}</p>
        </div>

        {/* Player row */}
        <div className="rounded-3xl bg-white border border-gray-200 p-5 flex items-center gap-4 mb-6 relative overflow-hidden">
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: HOST_TRI_GRADIENT }}
          />
          <AvatarFrame src={props.avatarUrl} tier={props.tier} size={64} />
          <div className="flex-1 min-w-0">
            <div className="font-fifa text-xl text-gray-900 uppercase truncate">
              {props.displayName}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
              {props.favoriteTeam && (
                <span className="inline-flex items-center gap-1">
                  <Flag
                    team={props.favoriteTeam}
                    className="w-3 h-3 rounded-full object-cover"
                  />
                  {localizeTeam(props.favoriteTeam, lang)}
                </span>
              )}
              <span dir="ltr">T{props.tier}</span>
            </div>
          </div>
        </div>

        {empty ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">
            {t("summary.empty")}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <Stat
                icon={Target}
                label={t("summary.picks")}
                value={localizeNumber(props.picks, lang)}
                color="#3B82F6"
              />
              <Stat
                icon={Sparkles}
                label={t("summary.accuracy")}
                value={`${props.accuracy}%`}
                color="#10B981"
              />
              <Stat
                icon={Zap}
                label={t("summary.pointsGained")}
                value={`+${localizeNumber(props.xpGained, lang)}`}
                color="#F59E0B"
              />
              <Stat
                icon={Trophy}
                label={t("summary.biggestWin")}
                value={`+${localizeNumber(props.biggestWin, lang)}`}
                color="#EF4444"
              />
            </div>

            {props.biggestHome && props.biggestAway && (
              <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-4 mb-6 flex items-center gap-3">
                <Trophy className="w-5 h-5 text-yellow-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] uppercase tracking-widest text-yellow-700 font-bold">
                    {t("summary.biggestWin")}
                  </div>
                  <div className="font-bold text-sm text-gray-900 truncate">
                    {localizeTeam(props.biggestHome, lang)}{" "}
                    <span className="font-fifa" dir="ltr">
                      {props.biggestScoreHome}–{props.biggestScoreAway}
                    </span>{" "}
                    {localizeTeam(props.biggestAway, lang)}
                  </div>
                </div>
              </div>
            )}

            {/* Share */}
            <motion.button
              type="button"
              onClick={() => setShowSharePreview(true)}
              whileTap={{ scale: 0.98 }}
              className="w-full inline-flex items-center justify-center gap-2 gradient-purple-cyan text-white font-bold py-3 rounded-2xl"
            >
              <Share2 className="w-4 h-4" />
              {t("summary.share.title")}
            </motion.button>
          </>
        )}
      </div>

      {/* Share preview modal */}
      {showSharePreview && (
        <div
          onClick={() => setShowSharePreview(false)}
          className="fixed inset-0 z-[95] bg-black/70 backdrop-blur px-4 flex items-center justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-md w-full rounded-3xl bg-white p-4 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-bold text-gray-900 flex items-center gap-2">
                <Share2 className="w-4 h-4 text-wc-purple" />
                {t("summary.share.title")}
              </div>
              <button
                type="button"
                onClick={() => setShowSharePreview(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
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
          </div>
        </div>
      )}
    </div>
  );
}
