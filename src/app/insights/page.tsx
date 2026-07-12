import Link from "next/link";
import { ArrowLeft, Flame, TrendingUp } from "lucide-react";
import {
  getTopScorers,
  getStandings,
  getHistoricWinners,
  getAllMatches,
} from "@/lib/football-data";
import type { MatchStatus } from "@/lib/types";
import { GoldenBoot } from "@/components/ui/GoldenBoot";
import { GroupStandings } from "@/components/ui/GroupStandings";
import { HistoryTimeline } from "@/components/ui/HistoryTimeline";
import { HostSeal } from "@/components/ui/HostSeal";
import { Ticker } from "@/components/ui/Ticker";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InsightsPage() {
  const { t, dir } = await getServerT();
  const [scorers, standings, history, allMatches] = await Promise.all([
    getTopScorers(15),
    getStandings(),
    getHistoricWinners(),
    getAllMatches(),
  ]);

  const now = Date.now();
  const in24h = now + 24 * 60 * 60 * 1000;
  const tickerMatches = allMatches
    .filter((m) => {
      const time = new Date(m.utcDate).getTime();
      return (
        m.status === "IN_PLAY" ||
        m.status === "PAUSED" ||
        (time >= now - 3 * 60 * 60 * 1000 && time <= in24h)
      );
    })
    .slice(0, 20)
    .map((m) => ({
      id: String(m.id),
      home_team: m.homeTeam.name,
      away_team: m.awayTeam.name,
      home_score: m.score.fullTime.home,
      away_score: m.score.fullTime.away,
      start_time: m.utcDate,
      status: (m.status === "IN_PLAY"
        ? "1H"
        : m.status === "PAUSED"
          ? "HT"
          : m.status === "FINISHED"
            ? "FT"
            : "NS") as MatchStatus,
    }));

  const totalGoals = allMatches
    .filter((m) => m.status === "FINISHED")
    .reduce(
      (sum, m) =>
        sum +
        (m.score.fullTime.home ?? 0) +
        (m.score.fullTime.away ?? 0),
      0,
    );

  const playedMatches = allMatches.filter((m) => m.status === "FINISHED").length;
  const totalMatches = allMatches.length;
  const avgGoals =
    playedMatches > 0 ? (totalGoals / playedMatches).toFixed(2) : "0.00";

  return (
    <div
      className="min-h-screen pt-8 pb-6 px-4 sm:px-6 relative overflow-hidden"
      dir={dir}
    >
      <div
        className="absolute top-0 end-0 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none opacity-30"
        style={{ background: "radial-gradient(circle, #FFB81C, transparent)" }}
      />
      <div
        className="absolute bottom-0 start-0 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none opacity-30"
        style={{ background: "radial-gradient(circle, #002868, transparent)" }}
      />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 rtl-flip-auto" />
            {t("nav.home")}
          </Link>
          <HostSeal size={56} />
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest text-blue-600">
            <TrendingUp className="w-4 h-4" /> {t("insights.pre")}
          </div>
          <h1 className="font-fifa text-5xl sm:text-7xl uppercase text-gray-900 leading-none mb-3">
            {t("insights.title")}
          </h1>
          <div
            className="mx-auto tri-underline mb-4"
            style={{ width: 240, background: HOST_TRI_GRADIENT }}
          />
          <p className="text-gray-500 max-w-xl mx-auto">{t("insights.sub")}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center relative overflow-hidden">
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: "#C8102E" }}
            />
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
              {t("insights.total")}
            </div>
            <div className="font-fifa text-3xl text-gray-900" dir="ltr">
              {totalGoals}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center relative overflow-hidden">
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: "#002868" }}
            />
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
              {t("insights.avg")}
            </div>
            <div className="font-fifa text-3xl text-gray-900" dir="ltr">
              {avgGoals}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4 text-center relative overflow-hidden">
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: "#006847" }}
            />
            <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
              {t("insights.played")}
            </div>
            <div className="font-fifa text-3xl text-gray-900" dir="ltr">
              {playedMatches}
              <span className="text-lg text-gray-400">/{totalMatches}</span>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <Ticker
            matches={tickerMatches}
            emptyText={t("insights.ticker.empty")}
          />
        </div>

        <div className="mb-10">
          <GoldenBoot scorers={scorers} />
        </div>

        <div className="mb-10">
          <GroupStandings groups={standings} />
        </div>

        <div className="mb-10">
          <HistoryTimeline history={history} />
        </div>

        <div className="text-center text-[10px] uppercase tracking-widest text-gray-400 mt-8">
          <span className="inline-flex items-center gap-1">
            <Flame className="w-3 h-3 text-red-500" /> {t("insights.footer")}
          </span>
        </div>
      </div>
    </div>
  );
}
