import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import PredictionForm from "./PredictionForm";
import GambleResult from "./GambleResult";
import { RichBadgesLoader } from "./RichBadgesLoader";
import { TeamBadge } from "@/components/ui/TeamBadge";
import { HostSeal } from "@/components/ui/HostSeal";
import { CommunityConsensus } from "@/components/ui/CommunityConsensus";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { getServerT } from "@/lib/i18n-server";
import {
  formatMatchDate,
  localizeRound,
  localizeTeam,
} from "@/lib/i18n-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MatchPage(props: {
  params: Promise<{ id: string }>;
}) {
  const params = await props.params;
  const matchId = params.id;
  const [supabase, i18n] = await Promise.all([createClient(), getServerT()]);
  const { t, lang, dir } = i18n;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/match/" + matchId);
  }

  // Match + user's prediction don't depend on each other.
  const [matchRes, predictionRes] = await Promise.all([
    supabase.from("matches").select("*").eq("id", matchId).single(),
    supabase
      .from("predictions")
      .select("*")
      .eq("match_id", matchId)
      .eq("user_id", user.id)
      .single(),
  ]);

  const { data: match, error: matchError } = matchRes;
  const prediction = predictionRes.data;

  if (matchError || !match) {
    notFound();
  }

  const isKicked = new Date(match.start_time).getTime() <= Date.now();

  // Consensus can piggyback on the DB — no third-party lookup. The rich
  // football-data.org context now streams in via <Suspense> below, so it
  // never blocks the score + prediction form.
  const allPredsRes = isKicked
    ? await supabase
        .from("predictions")
        .select("home_prediction, away_prediction")
        .eq("match_id", matchId)
    : { data: [] as { home_prediction: number; away_prediction: number }[] };

  const consensus = { home: 0, draw: 0, away: 0 };
  (allPredsRes.data || []).forEach((p) => {
    if (p.home_prediction > p.away_prediction) consensus.home += 1;
    else if (p.home_prediction < p.away_prediction) consensus.away += 1;
    else consensus.draw += 1;
  });

  const formattedDate = formatMatchDate(match.start_time, lang);
  const isLive = ["1H", "HT", "2H", "ET", "BT", "P"].includes(match.status);
  const isFinished = ["FT", "AET", "PEN"].includes(match.status);

  return (
    <div
      className="min-h-screen pt-8 pb-6 px-4 sm:px-6 relative overflow-hidden"
      dir={dir}
    >
      <div className="absolute top-0 end-[-20%] w-[600px] h-[600px] bg-wc-green/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 start-[-20%] w-[600px] h-[600px] bg-wc-purple/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 wc-border-gradient p-1 bg-white rounded-[2rem] shadow-sm">
        <div className="p-6 sm:p-12 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/bracket"
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 rtl-flip-auto" />
              {t("match.back")}
            </Link>
            <HostSeal size={56} />
          </div>

          <div className="text-center mb-10">
            <h1 className="font-fifa text-5xl sm:text-7xl tracking-tighter mb-4 uppercase text-gray-900">
              {t("match.matchday")}
            </h1>
            <div
              className="mx-auto tri-underline"
              style={{ width: 180, background: HOST_TRI_GRADIENT }}
            />

            <div className="inline-flex flex-wrap items-center justify-center gap-4 text-sm font-bold tracking-widest uppercase mt-6">
              <span className="flex items-center gap-2 text-gray-700">
                <CalendarDays className="w-4 h-4" /> {formattedDate}
              </span>
              <span className="text-gray-300">|</span>
              <span className="text-wc-purple">
                {localizeRound(match.round, lang)}
              </span>
              {isLive && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="inline-flex items-center gap-2 text-red-500">
                    <span className="live-dot" /> {t("bracket.live.label")}
                  </span>
                </>
              )}
            </div>

            {match.venue && (
              <div className="flex items-center justify-center gap-2 text-gray-500 text-xs font-semibold tracking-widest uppercase mt-3">
                <MapPin className="w-3.5 h-3.5" />
                {match.venue}
              </div>
            )}
          </div>

          {/* Scoreboard */}
          <div className="relative flex flex-col items-center justify-center mb-12">
            <div className="flex items-center justify-center gap-6 sm:gap-10 w-full">
              <TeamBadge
                team={match.home_team}
                size="xl"
                showName={false}
                from="left"
                delay={0.1}
              />

              <div className="relative">
                <div
                  className="rounded-[1.4rem] px-6 py-3 shadow-lg text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, #002868, #0a1a4a 60%, #0a0f1f)",
                  }}
                >
                  {isLive || isFinished ? (
                    <div
                      className="flex items-center gap-4 font-fifa text-5xl sm:text-6xl"
                      dir="ltr"
                    >
                      <span>{match.home_score ?? 0}</span>
                      <div className="flex flex-col items-center justify-center w-10 h-14 rounded-lg bg-white/10 border border-white/20">
                        <span className="text-[0.55rem] font-bold tracking-widest text-white/60">
                          {isLive ? t("bracket.live.label") : match.status}
                        </span>
                      </div>
                      <span>{match.away_score ?? 0}</span>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-4 font-fifa text-5xl sm:text-6xl text-white/70"
                      dir="ltr"
                    >
                      <span>-</span>
                      <div className="flex flex-col items-center justify-center w-10 h-14 rounded-lg bg-white/10 border border-white/20">
                        <span className="text-[0.55rem] font-bold tracking-widest text-white/50">
                          {lang === "ar" ? "×" : "VS"}
                        </span>
                      </div>
                      <span>-</span>
                    </div>
                  )}
                </div>
                <div
                  className="tri-underline mt-2"
                  style={{ background: HOST_TRI_GRADIENT }}
                />
              </div>

              <TeamBadge
                team={match.away_team}
                size="xl"
                showName={false}
                from="right"
                delay={0.1}
              />
            </div>

            <div className="flex justify-between w-full max-w-md mt-6 font-fifa text-xl md:text-2xl text-gray-700 uppercase">
              <span className="flex-1 text-center truncate px-2">
                {localizeTeam(match.home_team, lang)}
              </span>
              <span className="w-12" />
              <span className="flex-1 text-center truncate px-2">
                {localizeTeam(match.away_team, lang)}
              </span>
            </div>
          </div>

          <PredictionForm
            match={match}
            prediction={prediction || null}
            userId={user.id}
          />

          {/* Third-party enrichment streams in on its own timeline — if
              football-data.org is slow it silently drops off, never
              blocking the prediction UI. */}
          <Suspense fallback={null}>
            <RichBadgesLoader apiFixtureId={match.api_fixture_id ?? null} />
          </Suspense>

          {isKicked && (
            <CommunityConsensus
              home={consensus.home}
              draw={consensus.draw}
              away={consensus.away}
              homeTeam={match.home_team}
              awayTeam={match.away_team}
            />
          )}

          {isFinished && prediction && (
            <div className="mt-10">
              <GambleResult
                matchId={match.id}
                pointsEarned={prediction.points_earned}
                scored={prediction.scored}
                userHome={prediction.home_prediction}
                userAway={prediction.away_prediction}
                actualHome={match.home_score ?? 0}
                actualAway={match.away_score ?? 0}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
