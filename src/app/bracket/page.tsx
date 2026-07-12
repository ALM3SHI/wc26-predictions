import { createClient } from "@/lib/supabase/server";
import { MatchWithPrediction, Prediction } from "@/lib/types";
import Link from "next/link";
import { Clock, Trophy, Flame, Sparkles } from "lucide-react";
import { Flag } from "@/components/ui/Flag";
import { Ticker } from "@/components/ui/Ticker";
import { HostSeal } from "@/components/ui/HostSeal";
import { StakeBadge } from "@/components/ui/StakeBadge";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { getServerT } from "@/lib/i18n-server";
import { formatMatchDateShort, localizeTeam } from "@/lib/i18n-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BracketPage() {
  const [supabase, i18n] = await Promise.all([createClient(), getServerT()]);
  const { t, lang, dir } = i18n;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Matches list + the current user's predictions are independent — fetch
  // them in parallel to save a full Supabase round trip.
  const [matchesRes, predsRes] = await Promise.all([
    supabase.from("matches").select("*").order("start_time", { ascending: true }),
    user
      ? supabase.from("predictions").select("*").eq("user_id", user.id)
      : Promise.resolve({ data: [] as Prediction[], error: null }),
  ]);

  const { data: matchesData, error: matchesError } = matchesRes;

  if (matchesError) {
    return <div className="p-8 text-wc-red">Error loading matches.</div>;
  }

  const predictions: Prediction[] = predsRes.data || [];

  const matches: MatchWithPrediction[] = (matchesData || []).map((match) => ({
    ...match,
    prediction: predictions.find((p) => p.match_id === match.id) || null,
  }));

  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;

  const liveMatches: MatchWithPrediction[] = [];
  const upcomingMatches: MatchWithPrediction[] = [];
  const previousMatches: MatchWithPrediction[] = [];

  matches.forEach((m) => {
    const matchTime = new Date(m.start_time).getTime();
    const isLive = ["1H", "HT", "2H", "ET", "BT", "P"].includes(m.status);

    if (isLive) {
      liveMatches.push(m);
    } else if (matchTime >= now && matchTime <= now + DAY_MS) {
      upcomingMatches.push(m);
    } else if (matchTime < now && matchTime >= now - DAY_MS) {
      previousMatches.push(m);
    }
  });

  const dynamicGroups = [
    {
      key: "live",
      title: t("bracket.live"),
      window: null,
      icon: Flame,
      matches: liveMatches,
      accent: "#DC2626",
      soft: "bg-red-50 text-red-600 border-red-100",
    },
    {
      key: "upcoming",
      title: t("bracket.upcoming"),
      window: t("bracket.upcoming.window"),
      icon: Sparkles,
      matches: upcomingMatches,
      accent: "#0891B2",
      soft: "bg-cyan-50 text-cyan-700 border-cyan-100",
    },
    {
      key: "previous",
      title: t("bracket.previous"),
      window: t("bracket.previous.window"),
      icon: Trophy,
      matches: previousMatches,
      accent: "#6B7280",
      soft: "bg-gray-50 text-gray-600 border-gray-200",
    },
  ];

  const tickerMatches = [
    ...liveMatches,
    ...upcomingMatches,
    ...matches.filter(
      (m) =>
        !liveMatches.includes(m) &&
        !upcomingMatches.includes(m) &&
        !previousMatches.includes(m),
    ),
  ].slice(0, 30);

  return (
    <div className="min-h-screen pt-6 pb-6 px-4 sm:px-6" dir={dir}>
      {/* Background Glows */}
      <div className="fixed top-[-100px] start-[-100px] w-[400px] h-[400px] bg-wc-purple/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-100px] end-[-100px] w-[400px] h-[400px] bg-wc-cyan/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
          <div className="flex items-center gap-4">
            <HostSeal size={64} />
            <div>
              <h1 className="font-fifa text-4xl md:text-5xl uppercase text-gray-900 tracking-tight">
                {t("bracket.title")}
              </h1>
              <div
                className="tri-underline w-32 mt-2"
                style={{ background: HOST_TRI_GRADIENT }}
              />
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div className="mb-10">
          <Ticker matches={tickerMatches} emptyText={t("bracket.empty")} />
        </div>

        <div className="space-y-10">
          {dynamicGroups.map((group) => {
            if (group.matches.length === 0) return null;
            const Icon = group.icon;

            return (
              <section key={group.key} className="w-full">
                {/* Modern section header — single-line pill w/ icon & count */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 border bg-white shadow-sm shrink-0"
                    style={{ borderColor: `${group.accent}33` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: group.accent }} />
                    <span
                      className="font-bold text-sm tracking-wide whitespace-nowrap"
                      style={{ color: group.accent }}
                    >
                      {group.title}
                    </span>
                  </div>
                  {group.window && (
                    <span
                      className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border whitespace-nowrap ${group.soft}`}
                    >
                      {group.window}
                    </span>
                  )}
                  <span
                    className="text-[10px] font-bold text-gray-400 whitespace-nowrap"
                    dir="ltr"
                  >
                    {group.matches.length}
                  </span>
                  <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.matches.map((match, idx) => {
                    const isLive = ["1H", "HT", "2H", "ET", "BT", "P"].includes(
                      match.status,
                    );
                    const isFinished = ["FT", "AET", "PEN"].includes(
                      match.status,
                    );
                    const isLocked =
                      new Date(match.start_time).getTime() < Date.now();

                    return (
                      <Link
                        key={match.id}
                        href={`/match/${match.id}`}
                        className="block relative transition-transform hover:scale-[1.02] active:scale-[0.98]"
                        style={{
                          animation: `stakeDrop 500ms cubic-bezier(.34,1.56,.64,1) both`,
                          animationDelay: `${idx * 40}ms`,
                        }}
                      >
                        <div
                          className={`bg-white rounded-[1.4rem] p-5 h-full flex flex-col relative z-10 overflow-hidden shadow-sm border ${
                            isLive
                              ? "border-red-300 stadium-pulse"
                              : "border-gray-200"
                          }`}
                        >
                          <div
                            className="absolute inset-x-0 top-0 h-1 rounded-t-[1.4rem]"
                            style={{
                              background: HOST_TRI_GRADIENT,
                              opacity: 0.9,
                            }}
                          />

                          {/* Match Header */}
                          <div className="flex justify-between items-center mb-5 mt-1 text-xs font-bold uppercase tracking-widest text-gray-500">
                            <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                              <Clock className="w-3.5 h-3.5" />
                              {isLive ? (
                                <span className="text-red-500 inline-flex items-center gap-1">
                                  <span className="live-dot" />{" "}
                                  {t("bracket.live.label")}
                                </span>
                              ) : isFinished ? (
                                t("bracket.fulltime")
                              ) : (
                                formatMatchDateShort(match.start_time, lang)
                              )}
                            </span>
                            <div className="flex items-center gap-1">
                              <StakeBadge matchId={match.id} />
                              {match.prediction ? (
                                <span className="text-wc-purple flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-md">
                                  <Trophy className="w-3.5 h-3.5" />
                                  {t("bracket.picked")}
                                </span>
                              ) : !isLocked ? (
                                <span className="text-wc-cyan bg-cyan-50 px-2 py-1 rounded-md">
                                  {t("bracket.predict")}
                                </span>
                              ) : (
                                <span className="text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                                  {t("bracket.locked")}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Teams & Scores */}
                          <div className="flex flex-col gap-3 font-display">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-4">
                                <Flag
                                  team={match.home_team}
                                  className="w-8 h-8 object-cover rounded-full shadow-sm border border-gray-100"
                                />
                                <span className="font-bold text-gray-900 truncate max-w-[120px]">
                                  {localizeTeam(match.home_team, lang)}
                                </span>
                              </div>
                              <span
                                className="font-fifa text-xl text-gray-900"
                                dir="ltr"
                              >
                                {match.home_score !== null
                                  ? match.home_score
                                  : "-"}
                              </span>
                            </div>

                            <div className="flex justify-between items-center mt-2">
                              <div className="flex items-center gap-4">
                                <Flag
                                  team={match.away_team}
                                  className="w-8 h-8 object-cover rounded-full shadow-sm border border-gray-100"
                                />
                                <span className="font-bold text-gray-900 truncate max-w-[120px]">
                                  {localizeTeam(match.away_team, lang)}
                                </span>
                              </div>
                              <span
                                className="font-fifa text-xl text-gray-900"
                                dir="ltr"
                              >
                                {match.away_score !== null
                                  ? match.away_score
                                  : "-"}
                              </span>
                            </div>
                          </div>

                          {/* Prediction Footer */}
                          {match.prediction && (
                            <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                              <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">
                                {t("bracket.yourpick")}
                              </span>
                              <span
                                className="font-fifa text-2xl text-wc-purple"
                                dir="ltr"
                              >
                                {match.prediction.home_prediction} -{" "}
                                {match.prediction.away_prediction}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
