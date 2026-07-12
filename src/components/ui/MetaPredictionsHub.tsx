"use client";

// ─────────────────────────────────────────────────────────────
// Meta predictions hub — 2x2 tile grid on the home page linking
// to the four tournament-wide picks (champion, golden boot,
// group standings, bracket). Each tile carries the accent color
// of its own screen so the user builds a mental map fast.
// ─────────────────────────────────────────────────────────────

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Crown, LayoutGrid, GitBranch } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { HOST_GOLD, HOST_TRI_GRADIENT } from "@/lib/wc26-theme";

interface Tile {
  href: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export function MetaPredictionsHub() {
  const { t, dir } = useI18n();

  const tiles: Tile[] = [
    {
      href: "/predict/champion",
      title: t("meta.champion.title"),
      icon: Trophy,
      color: HOST_GOLD,
    },
    {
      href: "/predict/golden-boot",
      title: t("meta.gb.title"),
      icon: Crown,
      color: "#F59E0B",
    },
    {
      href: "/predict/groups",
      title: t("meta.groups.title"),
      icon: LayoutGrid,
      color: "#002868",
    },
    {
      href: "/predict/bracket",
      title: t("meta.bracket.title"),
      icon: GitBranch,
      color: "#C8102E",
    },
  ];

  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-4 md:p-5 relative overflow-hidden" dir={dir}>
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: HOST_TRI_GRADIENT }}
      />

      <div className="mb-4">
        <h3 className="font-fifa text-xl text-gray-900 uppercase">
          {t("meta.hub.title")}
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">{t("meta.hub.sub")}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile, i) => {
          const Icon = tile.icon;
          return (
            <Link key={tile.href} href={tile.href} className="block">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border-2 p-3 flex items-center gap-3 active:scale-95 transition-transform"
                style={{
                  borderColor: `${tile.color}44`,
                  background: `linear-gradient(135deg, ${tile.color}10, white 60%)`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{
                    background: tile.color,
                    boxShadow: `0 8px 20px ${tile.color}55`,
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-sm font-bold text-gray-900 leading-tight">
                  {tile.title}
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
