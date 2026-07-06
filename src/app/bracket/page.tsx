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
    { title: "Previous (Last 24h)", matches: previousMatches, color: "text-white/60", line: "from-white/20" },
  ];

  return (
    <div className="min-h-screen bg-wc-black pt-8 pb-24 px-4 sm:px-6">
      {/* Background Glows */}
      <div className="fixed top-[-100px] left-[-100px] w-[400px] h-[400px] bg-wc-purple/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-100px] right-[-100px] w-[400px] h-[400px] bg-wc-cyan/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <header className="mb-12 text-center">
          <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight mb-4">
            Knockout <span className="text-gradient gradient-purple-cyan">Bracket</span>
          </h1>
          <p className="text-white/60">
            Predict matches before kickoff. Green glowing matches are live!
          </p>
        </header>

        <div className="space-y-16">
          {dynamicGroups.map((group) => {
            if (group.matches.length === 0) return null;

            return (
              <section key={group.title} className="w-full">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className={`font-display font-bold text-2xl ${group.color}`}>
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
                        className={`block relative p-[1px] rounded-2xl overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98] ${
                          isLive
                            ? "bg-gradient-to-b from-wc-green/50 to-wc-green/10 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                            : "bg-white/10 hover:bg-white/20"
                        }`}
                      >
                        <div className="bg-wc-surface-light h-full rounded-2xl p-4 flex flex-col justify-between">
                          {/* Match Header */}
                          <div className="flex justify-between items-start mb-4 text-xs font-semibold uppercase tracking-wider text-white/50">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {isLive ? (
                                <span className="text-wc-green animate-pulse">Live</span>
                              ) : isFinished ? (
                                "FT"
                              ) : (
                                formatMatchTime(match.start_time)
                              )}
                            </span>
                            {match.prediction ? (
                              <span className="text-wc-purple-light flex items-center gap-1">
                                <Trophy className="w-3 h-3" />
                                Picked
                              </span>
                            ) : !isLocked ? (
                              <span className="text-wc-cyan">Predict</span>
                            ) : (
                              <span className="text-white/30">Locked</span>
                            )}
                          </div>

                          {/* Teams & Scores */}
                          <div className="space-y-3 font-display text-lg">
                            {/* Home Team */}
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                {match.home_team_logo ? (
                                  <img src={match.home_team_logo} alt={match.home_team} className="w-6 h-6 object-contain" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-white/10" />
                                )}
                                <span className="font-bold truncate max-w-[120px]">{match.home_team}</span>
                              </div>
                              <span className={`font-black ${isLive ? 'text-wc-green' : 'text-white'}`}>
                                {match.home_score ?? "-"}
                              </span>
                            </div>

                            {/* Away Team */}
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                {match.away_team_logo ? (
                                  <img src={match.away_team_logo} alt={match.away_team} className="w-6 h-6 object-contain" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-white/10" />
                                )}
                                <span className="font-bold truncate max-w-[120px]">{match.away_team}</span>
                              </div>
                              <span className={`font-black ${isLive ? 'text-wc-green' : 'text-white'}`}>
                                {match.away_score ?? "-"}
                              </span>
                            </div>
                          </div>

                          {/* Prediction Footer */}
                          {match.prediction && (
                            <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center text-sm">
                              <span className="text-white/40">Your Pick:</span>
                              <span className="font-display font-bold">
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
