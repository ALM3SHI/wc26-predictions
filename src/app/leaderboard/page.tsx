import { createClient } from "@/lib/supabase/server";
import { LeaderboardEntry } from "@/lib/types";
import { Trophy, Medal, Target, HelpCircle } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";

export const revalidate = 60; // Revalidate every minute

export default async function LeaderboardPage() {
  const supabase = await createClient();

  // Fetch the leaderboard view, ordered by rank
  const { data: leaderboard, error } = await supabase
    .from("leaderboard")
    .select("*")
    .order("rank", { ascending: true })
    .limit(100); // Show top 100

  // Get current user to highlight them in the list
  const { data: { user } } = await supabase.auth.getUser();

  if (error) {
    return <div className="p-8 text-wc-red text-center">Error loading leaderboard.</div>;
  }

  const entries: LeaderboardEntry[] = leaderboard || [];

  return (
    <div className="min-h-screen bg-white pt-8 pb-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-0 right-[20%] w-[500px] h-[500px] bg-wc-gold/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[-10%] w-[600px] h-[600px] bg-wc-purple/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="mb-12 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-yellow-50 flex items-center justify-center border border-yellow-100">
            <Trophy className="w-8 h-8 text-wc-gold" />
          </div>
          <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight mb-4 text-gray-900">
            Global <span className="text-gradient gradient-purple-cyan">Leaderboard</span>
          </h1>
          <p className="text-gray-500">
            The best football oracles in the world. Top 100 rankings.
          </p>
        </header>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-6 mb-8 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-wc-green" />
            Exact Score (3 pts)
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-wc-purple" />
            Correct Outcome (1 pt)
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            Wrong (0 pts)
          </div>
        </div>

        <div className="space-y-4">
          {entries.length === 0 ? (
            <GlassCard className="p-12 text-center text-gray-500 bg-white border border-gray-200">
              No predictions have been scored yet. Check back after the first match!
            </GlassCard>
          ) : (
            entries.map((entry) => {
              const isCurrentUser = user && user.id === entry.user_id;

              // Rank formatting
              let rankDisplay = <span className="text-gray-400 font-bold">{entry.rank}</span>;
              if (entry.rank === 1) {
                rankDisplay = <Medal className="w-6 h-6 text-wc-gold" />;
              } else if (entry.rank === 2) {
                rankDisplay = <Medal className="w-6 h-6 text-gray-400" />;
              } else if (entry.rank === 3) {
                rankDisplay = <Medal className="w-6 h-6 text-amber-700" />;
              }

              return (
                <div
                  key={entry.user_id}
                  className={`relative p-[1px] rounded-2xl transition-transform ${
                    isCurrentUser
                      ? "bg-gradient-to-r from-wc-purple to-wc-cyan shadow-[0_0_20px_rgba(139,92,246,0.3)] scale-[1.02] z-10"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  <Link 
                    href={`/user/${entry.user_id}`}
                    className={`block bg-white rounded-2xl p-4 sm:p-6 transition-colors hover:bg-gray-50 border border-gray-200 shadow-sm ${isCurrentUser ? "opacity-95" : ""}`}
                  >
                    <div className="flex items-center gap-4 sm:gap-6">
                      {/* Rank */}
                      <div className="w-8 flex justify-center font-display text-xl">
                        {rankDisplay}
                      </div>

                      {/* Avatar & Name */}
                      <div className="flex-1 flex items-center gap-4">
                        <img 
                          src={entry.avatar_url || "/images/default-avatar.png"} 
                          alt={entry.display_name} 
                          className="w-10 h-10 rounded-full object-cover border border-gray-200" 
                        />
                        <div>
                          <div className="font-bold text-lg flex items-center gap-2 text-gray-900">
                            {entry.display_name}
                            {isCurrentUser && (
                              <span className="text-[10px] uppercase tracking-wider bg-purple-100 text-wc-purple px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {entry.total_predictions} match{entry.total_predictions !== 1 && "es"} predicted
                          </div>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="hidden md:flex items-center gap-8 mr-8">
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Exact</div>
                          <div className="font-bold text-wc-green">{entry.exact_scores}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Outcome</div>
                          <div className="font-bold text-wc-purple">{entry.correct_outcomes}</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs text-gray-400 mb-1">Wrong</div>
                          <div className="font-bold text-red-500">{entry.wrong_predictions}</div>
                        </div>
                      </div>

                      {/* Total Points */}
                      <div className="text-right pl-4 border-l border-gray-200">
                        <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider font-semibold">Points</div>
                        <div className="font-display font-black text-2xl sm:text-3xl text-gradient gradient-purple-cyan">
                          {entry.total_points}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
