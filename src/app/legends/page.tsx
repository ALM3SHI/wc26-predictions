import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ArrowLeft, Sparkles, Flame } from "lucide-react";
import { HostSeal } from "@/components/ui/HostSeal";
import { Ticker } from "@/components/ui/Ticker";
import { LegendCard } from "./LegendCard";
import { HOST_TRI_GRADIENT } from "@/lib/wc26-theme";
import { getServerT } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LegendsPage() {
  const [supabase, i18n] = await Promise.all([createClient(), getServerT()]);
  const { t, dir } = i18n;

  const sixHoursAgoIso = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  const [exactsRes, tickerRes] = await Promise.all([
    supabase
      .from("predictions")
      .select(
        `
        id,
        user_id,
        match_id,
        home_prediction,
        away_prediction,
        points_earned,
        created_at,
        matches (
          id,
          home_team,
          away_team,
          home_score,
          away_score,
          start_time,
          round,
          status
        ),
        profiles (
          display_name,
          avatar_url
        )
      `,
      )
      .eq("points_earned", 3)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("matches")
      .select("id,home_team,away_team,home_score,away_score,start_time,status")
      .gte("start_time", sixHoursAgoIso)
      .order("start_time", { ascending: true })
      .limit(20),
  ]);

  const exacts = exactsRes.data;
  const tickerMatches = tickerRes.data;

  const rows = (exacts || []).filter((e: any) => e.matches && e.profiles);

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
        style={{ background: "radial-gradient(circle, #C8102E, transparent)" }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
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

        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-widest text-red-500">
            <Flame className="w-4 h-4" /> {t("legends.pre")}
          </div>
          <h1 className="font-fifa text-5xl sm:text-7xl uppercase text-gray-900 leading-none mb-3">
            {t("legends.title")}
          </h1>
          <div
            className="mx-auto tri-underline mb-4"
            style={{ width: 240, background: HOST_TRI_GRADIENT }}
          />
          <p className="text-gray-500 max-w-xl mx-auto">{t("legends.sub")}</p>
        </div>

        <div className="mb-10">
          <Ticker
            matches={tickerMatches || []}
            emptyText={t("legends.ticker.empty")}
          />
        </div>

        {/* Cards */}
        {rows.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center">
            <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-4" />
            <div className="font-fifa text-2xl text-gray-700 uppercase mb-2">
              {t("legends.empty")}
            </div>
            <p className="text-gray-500 text-sm">{t("legends.emptysub")}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {rows.map((row: any, i: number) => (
              <LegendCard
                key={row.id}
                rank={i + 1}
                displayName={row.profiles.display_name}
                avatarUrl={row.profiles.avatar_url}
                userId={row.user_id}
                homeTeam={row.matches.home_team}
                awayTeam={row.matches.away_team}
                homeScore={row.matches.home_score ?? 0}
                awayScore={row.matches.away_score ?? 0}
                matchId={row.matches.id}
                matchDate={row.matches.start_time}
                round={row.matches.round}
                isTop={i === 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
