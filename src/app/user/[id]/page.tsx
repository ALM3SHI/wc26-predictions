import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, Trophy } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function UserProfilePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const userId = params.id;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch Profile
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    notFound();
  }

  // Fetch Predictions with Match details
  // Note: Supabase JS client doesn't directly support nested joins without foreign keys setup perfectly,
  // we will fetch both and join in JS for simplicity, or we can try a direct join.
  const { data: predictions } = await supabase
    .from("predictions")
    .select(`
      id,
      home_prediction,
      away_prediction,
      points_earned,
      scored,
      matches (
        id,
        home_team,
        away_team,
        home_team_logo,
        away_team_logo,
        home_score,
        away_score,
        start_time,
        status
      )
    `)
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen pt-8 pb-6 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10 wc-border-gradient p-1 bg-white rounded-[2rem] shadow-sm">
        <div className="p-6 sm:p-12">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leaderboard
          </Link>

          <div className="text-center mb-12 flex flex-col items-center">
            <img 
              src={profile.avatar_url || "/images/default-avatar.png"} 
              alt={profile.display_name} 
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-6" 
            />
            <h1 className="font-fifa text-5xl sm:text-7xl uppercase text-gray-900 mb-4">
              {profile.display_name}
            </h1>
            <div className="flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-wc-cyan/20 bg-wc-cyan/10 text-wc-cyan font-bold text-xl">
                <Trophy className="w-5 h-5" />
                {profile.total_points} PTS
              </div>
              {(profile.legacy_points && profile.legacy_points > 0) ? (
                <p className="mt-3 text-sm font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                  Includes {profile.legacy_points} Legacy Points
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-fifa text-3xl text-gray-900 uppercase tracking-widest mb-6">Match History</h2>
            
            {(!predictions || predictions.length === 0) ? (
              <p className="text-gray-400 text-center py-8">No finished predictions yet.</p>
            ) : (
              <div className="grid gap-4">
                {predictions.map((pred: any) => {
                  const match = pred.matches;
                  if (!match) return null;
                  
                  return (
                    <div key={pred.id} className="bg-gray-50 border border-gray-200 p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                      {/* Teams */}
                      <div className="w-full flex-1 flex flex-col sm:flex-row items-center justify-between font-fifa text-xl sm:text-2xl uppercase text-gray-900 gap-1 sm:gap-0">
                        <span className="w-full sm:flex-1 text-center sm:text-right truncate px-2">{match.home_team}</span>
                        <div className="px-2 sm:px-6 flex flex-col items-center flex-shrink-0">
                          {match.status === 'FT' || match.status === 'AET' || match.status === 'PEN' ? (
                            <>
                              <span className="text-wc-cyan text-2xl sm:text-3xl">
                                {match.home_score} - {match.away_score}
                              </span>
                              <span className="text-gray-400 text-[10px] sm:text-sm tracking-widest mt-1">ACTUAL</span>
                            </>
                          ) : (
                            <>
                              <span className="text-gray-400 text-2xl sm:text-3xl">-</span>
                              <span className="text-gray-400 text-[10px] sm:text-sm tracking-widest mt-1">
                                {match.status === 'NS' ? 'UPCOMING' : 'LIVE'}
                              </span>
                            </>
                          )}
                        </div>
                        <span className="w-full sm:flex-1 text-center sm:text-left truncate px-2">{match.away_team}</span>
                      </div>
                      
                      {/* Prediction & Points */}
                      <div className="flex flex-col items-center md:items-end min-w-[150px] border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6">
                        <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Their Pick</div>
                        <div className="font-fifa text-2xl mb-3 text-gray-900">
                          {pred.home_prediction} - {pred.away_prediction}
                        </div>
                        
                        {!pred.scored ? (
                          <div className="flex items-center gap-1.5 text-gray-500 bg-gray-100 px-3 py-1 rounded-md text-sm font-bold">
                            PENDING
                          </div>
                        ) : pred.points_earned === 3 ? (
                          <div className="flex items-center gap-1.5 text-wc-green bg-wc-green/10 px-3 py-1 rounded-md text-sm font-bold">
                            <CheckCircle2 className="w-4 h-4" /> EXACT (+3)
                          </div>
                        ) : pred.points_earned === 1 ? (
                          <div className="flex items-center gap-1.5 text-wc-cyan bg-wc-cyan/10 px-3 py-1 rounded-md text-sm font-bold">
                            <CheckCircle2 className="w-4 h-4" /> OUTCOME (+1)
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-wc-red bg-wc-red/10 px-3 py-1 rounded-md text-sm font-bold">
                            <XCircle className="w-4 h-4" /> FAILED (0)
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
