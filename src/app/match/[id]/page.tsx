import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, CalendarDays, MapPin } from "lucide-react";
import PredictionForm from "./PredictionForm";

// Force dynamic since it relies on user session and real-time DB data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function MatchPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const matchId = params.id;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/match/" + matchId);
  }

  // Fetch match details
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (matchError || !match) {
    notFound();
  }

  // Fetch existing prediction
  const { data: prediction } = await supabase
    .from("predictions")
    .select("*")
    .eq("match_id", matchId)
    .eq("user_id", user.id)
    .single();

  const date = new Date(match.start_time);
  const formattedDate = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const formattedTime = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const isLive = ["1H", "HT", "2H", "ET", "BT", "P"].includes(match.status);
  const isFinished = ["FT", "AET", "PEN"].includes(match.status);

  return (
    <div className="min-h-screen pt-8 pb-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-0 right-[-20%] w-[600px] h-[600px] bg-wc-green/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-[-20%] w-[600px] h-[600px] bg-wc-purple/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 wc-border-gradient p-1 bg-wc-black rounded-[2rem] shadow-2xl">
        <div className="p-6 sm:p-12 relative z-10">
          <Link
            href="/bracket"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-12"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bracket
          </Link>

          {/* Massive MATCH STATS Header */}
          <div className="text-center mb-12">
            <h1 className="font-fifa text-6xl sm:text-8xl tracking-tighter mb-6 uppercase text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]">
              MATCH STATS
            </h1>
            
            <div className="inline-flex items-center gap-4 text-wc-yellow text-sm font-bold tracking-widest uppercase mb-4">
              <span className="flex items-center gap-2"><CalendarDays className="w-4 h-4" /> {formattedDate}</span>
              <span>|</span>
              <span className="text-wc-green">{match.round}</span>
            </div>
            
            {match.venue && (
              <div className="flex items-center justify-center gap-2 text-white/50 text-xs font-semibold tracking-widest uppercase">
                <MapPin className="w-3.5 h-3.5" />
                {match.venue}
              </div>
            )}
          </div>

          {/* Big Score / Team Display */}
          <div className="flex flex-col items-center justify-center mb-16">
            
            <div className="text-wc-cyan font-bold tracking-[0.2em] mb-6">
              {isLive ? <span className="animate-pulse">LIVE NOW</span> : isFinished ? "FULL TIME" : "UPCOMING"}
            </div>

            <div className="flex items-center justify-center gap-2 sm:gap-6 bg-white/5 p-4 sm:p-6 rounded-full border border-white/10 shadow-2xl">
              
              {/* Home Team */}
              <div className="flex items-center gap-4">
                {match.home_team_logo ? (
                  <img src={match.home_team_logo} alt={match.home_team} className="w-16 h-12 sm:w-20 sm:h-14 object-cover rounded-tr-2xl rounded-bl-2xl rounded-tl-sm rounded-br-sm border-2 border-white/10" />
                ) : (
                  <div className="w-16 h-12 sm:w-20 sm:h-14 bg-white/10 rounded-tr-2xl rounded-bl-2xl rounded-tl-sm rounded-br-sm" />
                )}
                <span className="hidden sm:block font-fifa text-4xl uppercase">{match.home_team.slice(0, 3)}</span>
              </div>

              {/* Score Box */}
              <div className="flex items-center bg-wc-cyan rounded-[1.5rem] px-4 py-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] text-black">
                {isLive || isFinished ? (
                  <div className="flex items-center gap-4 font-fifa text-5xl sm:text-6xl">
                    <span>{match.home_score}</span>
                    <div className="flex flex-col items-center justify-center w-8 h-12 bg-black rounded-lg text-white">
                      <span className="text-[0.5rem] font-bold tracking-widest text-white/50 mb-1">26</span>
                    </div>
                    <span>{match.away_score}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 font-fifa text-5xl sm:text-6xl text-black/40">
                    <span>-</span>
                    <div className="flex flex-col items-center justify-center w-8 h-12 bg-black/20 rounded-lg text-black/50">
                      <span className="text-[0.5rem] font-bold tracking-widest mb-1">VS</span>
                    </div>
                    <span>-</span>
                  </div>
                )}
              </div>

              {/* Away Team */}
              <div className="flex items-center gap-4">
                <span className="hidden sm:block font-fifa text-4xl uppercase">{match.away_team.slice(0, 3)}</span>
                {match.away_team_logo ? (
                  <img src={match.away_team_logo} alt={match.away_team} className="w-16 h-12 sm:w-20 sm:h-14 object-cover rounded-tr-2xl rounded-bl-2xl rounded-tl-sm rounded-br-sm border-2 border-white/10" />
                ) : (
                  <div className="w-16 h-12 sm:w-20 sm:h-14 bg-white/10 rounded-tr-2xl rounded-bl-2xl rounded-tl-sm rounded-br-sm" />
                )}
              </div>
            </div>

            {/* Full Team Names Below */}
            <div className="flex justify-between w-full max-w-sm mt-6 font-fifa text-2xl text-white/60 uppercase">
              <span className="flex-1 text-center">{match.home_team}</span>
              <span className="w-20"></span>
              <span className="flex-1 text-center">{match.away_team}</span>
            </div>
          </div>

          {/* Form */}
          <PredictionForm match={match} prediction={prediction || null} userId={user.id} />
          
          {/* Post-match result view */}
          {isFinished && prediction && (
            <div className="mt-8 text-center">
              <h4 className="font-display font-bold text-xl mb-2">Points Earned</h4>
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-purple-cyan neon-glow-purple font-display font-black text-4xl">
                +{prediction.points_earned}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
