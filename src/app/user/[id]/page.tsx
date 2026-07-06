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
    .not("points_earned", "is", null) // Only show processed/finished matches
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen pt-8 pb-24 px-4 sm:px-6 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10 wc-border-gradient p-1 bg-wc-black rounded-[2rem]">
        <div className="p-6 sm:p-12">
          <Link
            href="/leaderboard"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leaderboard
          </Link>

          <div className="text-center mb-12">
            <h1 className="font-fifa text-5xl sm:text-7xl uppercase text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-4">
              {profile.display_name}
            </h1>
            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full border border-wc-cyan/20 bg-wc-cyan/10 text-wc-cyan font-bold text-xl">
              <Trophy className="w-5 h-5" />
              {profile.total_points} PTS
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="font-fifa text-3xl text-white/80 uppercase tracking-widest mb-6">Match History</h2>
            
            {(!predictions || predictions.length === 0) ? (
              <p className="text-white/40 text-center py-8">No finished predictions yet.</p>
            ) : (
              <div className="grid gap-4">
                {predictions.map((pred: any) => {
                  const match = pred.matches;
                  if (!match) return null;
                  
                  return (
                    <div key={pred.id} className="bg-white/5 border border-white/10 p-4 sm:p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                      {/* Teams */}
                      <div className="flex-1 flex items-center justify-between font-fifa text-2xl uppercase">
                        <span className="flex-1 text-right">{match.home_team}</span>
                        <div className="px-6 flex flex-col items-center">
                          <span className="text-wc-cyan text-3xl">
                            {match.home_score} - {match.away_score}
                          </span>
                          <span className="text-white/30 text-sm tracking-widest mt-1">ACTUAL</span>
                        </div>
                        <span className="flex-1 text-left">{match.away_team}</span>
                      </div>
                      
                      {/* Prediction & Points */}
                      <div className="flex flex-col items-center md:items-end min-w-[150px] border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6">
                        <div className="text-sm font-bold text-white/50 uppercase tracking-widest mb-1">Their Pick</div>
                        <div className="font-fifa text-2xl mb-3">
                          {pred.home_prediction} - {pred.away_prediction}
                        </div>
                        
                        {pred.points_earned === 3 ? (
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
