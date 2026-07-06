import { createClient } from "@/lib/supabase/server";
import { Match, MatchRound, MATCH_ROUNDS_ORDER, MatchWithPrediction, Prediction } from "@/lib/types";
import Link from "next/link";
import { ChevronRight, Clock, Trophy } from "lucide-react";

// Helper to format date
function formatMatchTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BracketPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  // Fetch all matches
  const { data: matchesData, error: matchesError } = await supabase
    .from("matches")
    .select("*")
    .order("start_time", { ascending: true });

  if (matchesError) {
    return <div className="p-8 text-wc-red">Error loading matches.</div>;
  }

  // Fetch user predictions if logged in
  let predictions: Prediction[] = [];
  if (user) {
    const { data: userPredictions } = await supabase
      .from("predictions")
      .select("*")
      .eq("user_id", user.id);
    if (userPredictions) {
      predictions = userPredictions;
    }
  }

  // Combine matches with predictions
  const matches: MatchWithPrediction[] = (matchesData || []).map((match) => ({
    ...match,
    prediction: predictions.find((p) => p.match_id === match.id) || null,
  }));

  // Filter and Group dynamically by time (-24h to +24h)
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
    { title: "Live Now", matches: liveMatches, color: "text-wc-green", line: "from-wc-green/40" },
    { title: "Upcoming (Next 24h)", matches: upcomingMatches, color: "text-wc-cyan", line: "from-wc-cyan/40" },
    { title: "Previous (Last 24h)", matches: previousMatches, color: "text-gray-500", line: "from-gray-200" },
  ];

  return (
    <div className="min-h-screen pt-8 pb-24 px-4 sm:px-6">
      {/* Background Glows */}
      <div className="fixed top-[-100px] left-[-100px] w-[400px] h-[400px] bg-wc-purple/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-wc-cyan/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">


        <div className="space-y-16">
          {dynamicGroups.map((group) => {
            if (group.matches.length === 0) return null;

            return (
              <section key={group.title} className="w-full">
                <div className="flex items-center gap-4 mb-8">
                  <h2 className={`font-fifa text-3xl uppercase tracking-wide ${group.color} drop-shadow-[0_0_10px_currentColor]`}>
                    {group.title}
                  </h2>
                  <div className={`h-px flex-1 bg-gradient-to-r ${group.line} to-transparent`} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {group.matches.map((match) => {
                    const isLive = ["1H", "HT", "2H", "ET", "BT", "P"].includes(match.status);
                    const isFinished = ["FT", "AET", "PEN"].includes(match.status);
                    
                    // Determine if locked
                    const isLocked = new Date(match.start_time).getTime() < Date.now();

                    return (
                      <Link
                        key={match.id}
                        href={`/match/${match.id}`}
                        className="block relative transition-transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <div className="bg-white rounded-[1.4rem] p-5 h-full flex flex-col relative z-10 overflow-hidden shadow-sm border border-gray-200">
                            
                            {/* Match Header */}
                            <div className="flex justify-between items-center mb-5 text-xs font-bold uppercase tracking-widest text-gray-500">
                              <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                <Clock className="w-3.5 h-3.5" />
                                {isLive ? (
                                  <span className="text-wc-green animate-pulse">LIVE NOW</span>
                                ) : isFinished ? (
                                  "FULL TIME"
                                ) : (
                                  formatMatchTime(match.start_time)
                                )}
                              </span>
                              {match.prediction ? (
                                <span className="text-wc-purple flex items-center gap-1 bg-purple-50 px-2 py-1 rounded-md">
                                  <Trophy className="w-3.5 h-3.5" />
                                  PICKED
                                </span>
                              ) : !isLocked ? (
                                <span className="text-wc-cyan bg-cyan-50 px-2 py-1 rounded-md">PREDICT</span>
                              ) : (
                                <span className="text-gray-400 bg-gray-100 px-2 py-1 rounded-md">LOCKED</span>
                              )}
                            </div>

                            {/* Teams & Scores Block */}
                            <div className="flex flex-col gap-3 font-display">
                              {/* Home Team */}
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                  {match.home_team_logo ? (
                                    <img src={match.home_team_logo} alt={match.home_team} className="w-12 h-10 object-cover rounded-tr-xl rounded-bl-xl rounded-tl-sm rounded-br-sm border-2 border-gray-100" />
                                  ) : (
                                    <div className="w-12 h-10 bg-gray-100 rounded-tr-xl rounded-bl-xl rounded-tl-sm rounded-br-sm" />
                                  )}
                                  <span className="font-fifa text-2xl uppercase tracking-wide text-gray-900">{match.home_team}</span>
                                </div>
                                <div className={`w-12 h-12 flex items-center justify-center rounded-xl font-fifa text-3xl ${isLive || isFinished ? 'bg-wc-cyan text-white' : 'bg-gray-100 text-gray-400'}`}>
                                  {match.home_score ?? "-"}
                                </div>
                              </div>

                              {/* Away Team */}
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                  {match.away_team_logo ? (
                                    <img src={match.away_team_logo} alt={match.away_team} className="w-12 h-10 object-cover rounded-tr-xl rounded-bl-xl rounded-tl-sm rounded-br-sm border-2 border-gray-100" />
                                  ) : (
                                    <div className="w-12 h-10 bg-gray-100 rounded-tr-xl rounded-bl-xl rounded-tl-sm rounded-br-sm" />
                                  )}
                                  <span className="font-fifa text-2xl uppercase tracking-wide text-gray-900">{match.away_team}</span>
                                </div>
                                <div className={`w-12 h-12 flex items-center justify-center rounded-xl font-fifa text-3xl ${isLive || isFinished ? 'bg-wc-cyan text-white' : 'bg-gray-100 text-gray-400'}`}>
                                  {match.away_score ?? "-"}
                                </div>
                              </div>
                            </div>

                            {/* Prediction Footer */}
                            {match.prediction && (
                              <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Your Pick</span>
                                <span className="font-fifa text-2xl text-wc-purple">
                                  {match.prediction.home_prediction} - {match.prediction.away_prediction}
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
