"use client";

// ─────────────────────────────────────────────────────────────
// AdminDashboard — quick health check tab shown before the CRUD
// tabs. Everything is derived server-side via the /api/admin/stats
// route so we don't ship every row to the browser.
// ─────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Activity,
  Flame,
  Trophy,
  BarChart3,
  Clock,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { localizeNumber, localizeTeam } from "@/lib/i18n-data";

interface Stats {
  dau: number;
  today: number;
  streaks: number;
  matchesLeft: number;
  avgGoals: number;
  hotMatch: {
    home: string;
    away: string;
    count: number;
  } | null;
}

export function AdminDashboard() {
  const { t, lang } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/stats", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const Tile = ({
    icon: Icon,
    label,
    value,
    tint,
  }: {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    tint: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-gray-100 bg-white p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ background: tint }}
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
    </motion.div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 border border-gray-200 shadow-sm relative overflow-hidden">
        <div
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: HOST_TRI_GRADIENT }}
        />
        <div className="flex items-center gap-2 mb-1">
          <BarChart3 className="w-5 h-5 text-wc-purple" />
          <h2 className="text-xl font-bold text-gray-900">
            {t("admin.dash.title")}
          </h2>
        </div>
      </div>

      {loading || !stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-gray-100 bg-white p-4 h-24 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Tile
              icon={Users}
              label={t("admin.dash.dau")}
              value={localizeNumber(stats.dau, lang)}
              tint="#8B5CF6"
            />
            <Tile
              icon={Activity}
              label={t("admin.dash.today")}
              value={localizeNumber(stats.today, lang)}
              tint="#06B6D4"
            />
            <Tile
              icon={Flame}
              label={t("admin.dash.streaks")}
              value={localizeNumber(stats.streaks, lang)}
              tint="#EF4444"
            />
            <Tile
              icon={Clock}
              label={t("admin.dash.matchesLeft")}
              value={localizeNumber(stats.matchesLeft, lang)}
              tint="#F59E0B"
            />
            <Tile
              icon={BarChart3}
              label={t("admin.dash.avg")}
              value={stats.avgGoals.toFixed(1)}
              tint="#10B981"
            />
            {stats.hotMatch && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-yellow-200 bg-gradient-to-br from-yellow-50 to-white p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center text-white">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="text-[10px] uppercase tracking-widest text-yellow-700 font-bold">
                    {t("admin.dash.hot")}
                  </div>
                </div>
                <div className="font-bold text-sm text-gray-900 leading-tight">
                  {localizeTeam(stats.hotMatch.home, lang)} ×{" "}
                  {localizeTeam(stats.hotMatch.away, lang)}
                </div>
                <div className="text-[10px] text-yellow-700 mt-1" dir="ltr">
                  {localizeNumber(stats.hotMatch.count, lang)} predictions
                </div>
              </motion.div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
