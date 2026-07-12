import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────────────────────
// GET /api/admin/stats
// Aggregates the numbers the dashboard tab needs. Every query is
// scoped by the caller's auth, then gated by an is_admin check so
// non-admins never see anything.
// ─────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [todayRes, weekRes, upcomingRes, finishedRes, hotRes] =
    await Promise.all([
      supabase
        .from("predictions")
        .select("id", { count: "exact", head: true })
        .gte("updated_at", startOfDay.toISOString()),
      supabase
        .from("predictions")
        .select("user_id")
        .gte("updated_at", sevenDaysAgo.toISOString()),
      supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .gt("start_time", now.toISOString()),
      supabase
        .from("matches")
        .select("home_score, away_score")
        .in("status", ["FT", "AET", "PEN"]),
      supabase
        .from("predictions")
        .select("match_id, matches(home_team, away_team)")
        .gt("updated_at", startOfDay.toISOString())
        .limit(500),
    ]);

  // DAU — unique users in the 7d window
  const uniq = new Set<string>();
  ((weekRes.data ?? []) as Array<{ user_id: string }>).forEach((r) =>
    uniq.add(r.user_id),
  );

  // Avg goals across finished matches
  const finished =
    (finishedRes.data as Array<{
      home_score: number | null;
      away_score: number | null;
    }> | null) ?? [];
  const goalSum = finished.reduce(
    (s, m) => s + ((m.home_score ?? 0) + (m.away_score ?? 0)),
    0,
  );
  const avgGoals = finished.length > 0 ? goalSum / finished.length : 0;

  // Hot match — most predicted since midnight
  const counts = new Map<
    string,
    { count: number; home: string; away: string }
  >();
  const hotRows =
    (hotRes.data as Array<{
      match_id: string;
      matches: { home_team: string; away_team: string } | null;
    }> | null) ?? [];
  for (const r of hotRows) {
    if (!r.matches) continue;
    const cur = counts.get(r.match_id);
    if (cur) cur.count += 1;
    else
      counts.set(r.match_id, {
        count: 1,
        home: r.matches.home_team,
        away: r.matches.away_team,
      });
  }
  let hotMatch: { home: string; away: string; count: number } | null = null;
  for (const v of counts.values()) {
    if (!hotMatch || v.count > hotMatch.count) hotMatch = v;
  }

  // Active streaks — anyone with ≥3 recent correct predictions.
  // Cheap approximation: count profiles whose last 3 scored predictions
  // are all winners. For now, use xp_events with source='outcome' as
  // a strong signal (they got a correct outcome).
  const { data: streakRows } = await supabase
    .from("xp_events")
    .select("user_id")
    .eq("source", "outcome")
    .gte("created_at", sevenDaysAgo.toISOString());
  const streakUniq = new Set<string>();
  ((streakRows ?? []) as Array<{ user_id: string }>).forEach((r) =>
    streakUniq.add(r.user_id),
  );

  return NextResponse.json({
    dau: uniq.size,
    today: todayRes.count ?? 0,
    streaks: streakUniq.size,
    matchesLeft: upcomingRes.count ?? 0,
    avgGoals,
    hotMatch,
  });
}
