"use client";

// ─────────────────────────────────────────────────────────────
// BattlePassPath — vertical, scrollable 20-tier path.
//
// Each tier renders as a chunky pill on alternating sides of a
// central spine. Unlocked tiers glow in their own accent; locked
// ones sit muted with the XP threshold visible. A sticky header
// tracks the current level + progress ring so the user always
// knows how far they are from the next unlock.
// ─────────────────────────────────────────────────────────────

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Sparkles, Zap, Star } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import {
  TIERS,
  MAX_TIER,
  nextTier,
  tierProgress,
  tierByLevel,
  xpToNext,
  type RewardKind,
} from "@/lib/battle-pass";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { localizeNumber } from "@/lib/i18n-data";

interface Props {
  xp: number;
  tier: number;
  displayName: string;
}

function KindPill({ kind, label }: { kind: RewardKind; label: string }) {
  const color =
    kind === "milestone"
      ? "#F59E0B"
      : kind === "functional"
        ? "#3B82F6"
        : "#94A3B8";
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest"
      style={{
        color,
        background: `${color}18`,
      }}
    >
      {kind === "milestone" ? (
        <Star className="w-2.5 h-2.5" />
      ) : kind === "functional" ? (
        <Zap className="w-2.5 h-2.5" />
      ) : (
        <Sparkles className="w-2.5 h-2.5" />
      )}
      {label}
    </span>
  );
}

export default function BattlePassPath({ xp, tier, displayName }: Props) {
  const { t, lang, dir } = useI18n();
  const nxt = nextTier(tier);
  const progress = tierProgress(xp, tier);
  const remaining = xpToNext(xp, tier);

  return (
    <div
      className="min-h-screen pt-6 pb-32 relative overflow-hidden bg-gradient-to-b from-white to-gray-50"
      dir={dir}
    >
      <div className="max-w-3xl mx-auto px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip-auto" />
          {t("nav.home")}
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-fifa text-4xl md:text-5xl uppercase text-gray-900 leading-none">
            {t("bp.title")}
          </h1>
          <div
            className="tri-underline mt-3 w-40"
            style={{ background: HOST_TRI_GRADIENT }}
          />
          <p className="text-gray-500 text-sm mt-3">{t("bp.sub")}</p>
        </motion.div>

        {/* Progress hero */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-5 mb-8 text-white relative overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #002868, #0a1a4a 50%, #C8102E)",
          }}
        >
          <div className="absolute -top-10 -end-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center font-fifa text-3xl">
              <span dir="ltr">{localizeNumber(tier, lang)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-widest opacity-80 font-bold">
                {t("bp.level")} · {displayName || ""}
              </div>
              <div className="font-fifa text-2xl uppercase leading-tight truncate">
                {t(tierByLevel(tier).titleKey)}
              </div>
              {nxt ? (
                <div className="text-xs opacity-90 mt-1">
                  <span dir="ltr">{localizeNumber(remaining, lang)}</span>{" "}
                  {t("bp.remaining")}
                </div>
              ) : (
                <div className="text-xs opacity-90 mt-1">{t("bp.max")}</div>
              )}
            </div>
            <div className="text-end">
              <div className="text-[9px] uppercase tracking-widest opacity-70">
                {t("bp.progress")}
              </div>
              <div className="font-fifa text-2xl" dir="ltr">
                {localizeNumber(xp, lang)}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-2 rounded-full bg-white/15 overflow-hidden relative z-10">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #FFB81C, #FFDA6B)" }}
            />
          </div>
        </motion.div>

        {/* Tier list — alternating sides on desktop, single column on mobile */}
        <div className="relative">
          <div
            className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-1 rounded-full hidden md:block"
            style={{
              background: `linear-gradient(180deg, #FFB81C, #C8102E, #002868)`,
              opacity: 0.15,
            }}
          />

          <div className="space-y-3">
            {TIERS.map((tr, i) => {
              const unlocked = tier >= tr.level;
              const side = i % 2 === 0 ? "start" : "end";
              return (
                <motion.div
                  key={tr.level}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ delay: (i % 6) * 0.04 }}
                  className={`md:flex md:items-stretch ${
                    side === "start" ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  <div className="md:w-1/2 md:px-4">
                    <div
                      className={`relative rounded-2xl border-2 p-4 flex items-center gap-3 overflow-hidden ${
                        unlocked ? "" : "opacity-70"
                      }`}
                      style={{
                        borderColor: unlocked ? `${tr.color}66` : "#E5E7EB",
                        background: unlocked
                          ? `linear-gradient(135deg, ${tr.color}12, white 60%)`
                          : "white",
                      }}
                    >
                      {tr.level === MAX_TIER && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background:
                              "radial-gradient(circle at 90% 10%, rgba(255,184,28,0.15), transparent 60%)",
                          }}
                        />
                      )}

                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                        style={{
                          background: unlocked ? tr.color : "#F3F4F6",
                          color: unlocked ? "white" : "#9CA3AF",
                          boxShadow: unlocked
                            ? `0 8px 20px ${tr.color}55`
                            : undefined,
                        }}
                      >
                        {unlocked ? tr.icon : <Lock className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span
                            className="font-fifa text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full"
                            style={{
                              color: unlocked ? tr.color : "#6B7280",
                              background: unlocked
                                ? `${tr.color}18`
                                : "#F3F4F6",
                            }}
                            dir="ltr"
                          >
                            T{tr.level}
                          </span>
                          <KindPill
                            kind={tr.kind}
                            label={t(`bp.kind.${tr.kind}`)}
                          />
                          {unlocked && (
                            <span
                              className="text-[9px] font-bold uppercase tracking-widest ms-auto"
                              style={{ color: tr.color }}
                            >
                              {t("bp.unlocked")}
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-sm text-gray-900 truncate">
                          {t(tr.titleKey)}
                        </div>
                        <div className="text-xs text-gray-500 leading-tight mt-0.5">
                          {t(tr.rewardKey)}
                        </div>
                      </div>

                      <div
                        className="text-end shrink-0 font-fifa text-lg"
                        style={{ color: unlocked ? tr.color : "#9CA3AF" }}
                        dir="ltr"
                      >
                        {localizeNumber(tr.xp, lang)}
                      </div>
                    </div>
                  </div>

                  {/* Spine spacer for desktop */}
                  <div className="hidden md:block md:w-0" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
