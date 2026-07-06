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
    <div className="min-h-screen bg-wc-black pt-8 pb-24 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute top-0 right-[-20%] w-[600px] h-[600px] bg-wc-green/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-[-20%] w-[600px] h-[600px] bg-wc-purple/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <Link
          href="/bracket"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Bracket
        </Link>

        {/* Match Info Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm font-medium mb-6">
            <span className="text-wc-cyan">{match.round}</span>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 text-white/60 text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              {formattedDate}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {formattedTime}
            </div>
            {match.venue && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {match.venue}
              </div>
            )}
          </div>
        </div>

        {/* Big Score / Team Display */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 mb-12">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-4 flex-1">
            {match.home_team_logo ? (
              <img src={match.home_team_logo} alt={match.home_team} className="w-24 h-24 object-contain" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10" />
            )}
            <h2 className="font-display font-black text-2xl sm:text-3xl text-center">
              {match.home_team}
            </h2>
          </div>

          {/* VS / Score */}
          <div className="flex flex-col items-center">
            {isLive || isFinished ? (
              <div className="flex items-center gap-6 font-display font-black text-5xl sm:text-7xl">
                <span className={isLive ? "text-wc-green neon-text-green" : "text-white"}>
                  {match.home_score}
                </span>
                <span className="text-white/20 text-3xl">-</span>
                <span className={isLive ? "text-wc-green neon-text-green" : "text-white"}>
                  {match.away_score}
                </span>
              </div>
            ) : (
              <span className="font-display font-black text-4xl text-white/20">VS</span>
            )}
            
            {isLive && (
              <div className="mt-4 px-4 py-1 rounded-full bg-wc-green/10 border border-wc-green/20 text-wc-green font-bold text-sm animate-pulse">
                {match.status} (LIVE)
              </div>
            )}
            {isFinished && (
              <div className="mt-4 px-4 py-1 rounded-full bg-white/10 text-white/60 font-bold text-sm">
                FULL TIME
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-4 flex-1">
            {match.away_team_logo ? (
              <img src={match.away_team_logo} alt={match.away_team} className="w-24 h-24 object-contain" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10" />
            )}
            <h2 className="font-display font-black text-2xl sm:text-3xl text-center">
              {match.away_team}
            </h2>
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
  );
}
