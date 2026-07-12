import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WeeklySummary from "./WeeklySummary";

export const dynamic = "force-dynamic";

export default async function SummaryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/summary");

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [profileRes, predsRes, xpRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_url, favorite_team, current_tier, xp_total")
      .eq("id", user.id)
      .single(),
    supabase
      .from("predictions")
      .select(
        "home_prediction, away_prediction, points_earned, scored, stake_multiplier, matches(home_team, away_team, home_score, away_score, status, start_time)",
      )
      .eq("user_id", user.id)
      .gte("updated_at", sevenDaysAgo.toISOString()),
    supabase
      .from("xp_events")
      .select("amount")
      .eq("user_id", user.id)
      .gte("created_at", sevenDaysAgo.toISOString()),
  ]);

  const preds =
    (predsRes.data as
      | Array<{
          home_prediction: number;
          away_prediction: number;
          points_earned: number;
          scored: boolean;
          stake_multiplier: number | null;
          matches: {
            home_team: string;
            away_team: string;
            home_score: number | null;
            away_score: number | null;
            status: string;
            start_time: string;
          } | null;
        }>
      | null) ?? [];

  const scored = preds.filter((p) => p.scored);
  const hits = scored.filter((p) => p.points_earned > 0).length;
  const accuracy = scored.length > 0 ? Math.round((hits / scored.length) * 100) : 0;

  let biggestWin = 0;
  let biggestHome: string | null = null;
  let biggestAway: string | null = null;
  let biggestScoreHome = 0;
  let biggestScoreAway = 0;
  for (const p of scored) {
    const gain = p.points_earned * (p.stake_multiplier ?? 1);
    if (gain > biggestWin) {
      biggestWin = gain;
      biggestHome = p.matches?.home_team ?? null;
      biggestAway = p.matches?.away_team ?? null;
      biggestScoreHome = p.matches?.home_score ?? 0;
      biggestScoreAway = p.matches?.away_score ?? 0;
    }
  }

  const xpGained = ((xpRes.data as { amount: number }[] | null) ?? []).reduce(
    (s, r) => s + r.amount,
    0,
  );

  return (
    <WeeklySummary
      displayName={profileRes.data?.display_name ?? ""}
      avatarUrl={profileRes.data?.avatar_url ?? null}
      favoriteTeam={profileRes.data?.favorite_team ?? null}
      tier={profileRes.data?.current_tier ?? 1}
      picks={preds.length}
      scored={scored.length}
      accuracy={accuracy}
      xpGained={xpGained}
      biggestWin={biggestWin}
      biggestHome={biggestHome}
      biggestAway={biggestAway}
      biggestScoreHome={biggestScoreHome}
      biggestScoreAway={biggestScoreAway}
    />
  );
}
