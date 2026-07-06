import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { getCached, setCached, getCacheKey, LIVE_SCORE_TTL } from "@/lib/cache";
import type { APIFixture, APIFootballResponse } from "@/lib/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY!;
const API_FOOTBALL_HOST = process.env.API_FOOTBALL_HOST || "v3.football.api-sports.io";

// Statuses that indicate a match is live
const LIVE_STATUS_CODES = ["1H", "HT", "2H", "ET", "BT", "P"];
// Statuses that indicate a match has finished
const FINISHED_STATUS_CODES = ["FT", "AET", "PEN"];

/**
 * CRON: Update Live Scores
 * Triggered by QStash every 2 minutes during match windows.
 *
 * 1. Check if any matches are currently live or recently started
 * 2. Fetch live scores from API-Football
 * 3. Update Supabase matches table
 * 4. If match finished → auto-scoring triggers via DB trigger
 */
async function handler(req: Request) {
  const startTime = Date.now();

  try {
    // Create service-role Supabase client (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Step 1: Check for active matches in our database
    // Get matches that are live OR started within the last 4 hours (to catch recently finished)
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const { data: activeMatches, error: dbError } = await supabase
      .from("matches")
      .select("id, api_fixture_id, status, start_time")
      .or(
        `status.in.(${LIVE_STATUS_CODES.join(",")}),` +
        `and(start_time.gte.${fourHoursAgo},status.eq.NS)`
      )
      .order("start_time", { ascending: true });

    if (dbError) {
      console.error("DB error fetching active matches:", dbError);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    // No active matches → nothing to do
    if (!activeMatches || activeMatches.length === 0) {
      return NextResponse.json({
        message: "No active matches to update",
        duration: Date.now() - startTime,
      });
    }

    // Step 2: Check cache for live scores
    const cacheKey = getCacheKey("live-scores");
    let liveFixtures = await getCached<APIFixture[]>(cacheKey);

    if (!liveFixtures) {
      // Fetch live World Cup scores from API-Football
      const url = `https://${API_FOOTBALL_HOST}/fixtures?league=1&season=2026`;
      const response = await fetch(url, {
        headers: {
          "x-apisports-key": API_FOOTBALL_KEY,
        },
        next: { revalidate: 0 },
      });

      if (!response.ok) {
        console.error("API-Football error:", response.status, await response.text());
        return NextResponse.json({ error: "API fetch failed" }, { status: 502 });
      }

      const data: APIFootballResponse<APIFixture> = await response.json();

      if (data.errors && Object.keys(data.errors).length > 0) {
        console.error("API-Football errors:", data.errors);
        return NextResponse.json({ error: "API returned errors" }, { status: 502 });
      }

      liveFixtures = data.response;

      // Cache for 2 minutes
      await setCached(cacheKey, liveFixtures, LIVE_SCORE_TTL);
    }

    // Step 3: Update each active match with live data
    let updatedCount = 0;
    let finishedCount = 0;

    for (const dbMatch of activeMatches) {
      const apiFixture = liveFixtures.find(
        (f) => f.fixture.id === dbMatch.api_fixture_id
      );

      if (!apiFixture) continue;

      const newStatus = apiFixture.fixture.status.short;
      const homeScore = apiFixture.goals.home;
      const awayScore = apiFixture.goals.away;

      // Only update if something changed
      if (newStatus === dbMatch.status && homeScore === null && awayScore === null) {
        continue;
      }

      const { error: updateError } = await supabase
        .from("matches")
        .update({
          status: newStatus,
          home_score: homeScore,
          away_score: awayScore,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dbMatch.id);

      if (updateError) {
        console.error(`Error updating match ${dbMatch.id}:`, updateError);
        continue;
      }

      updatedCount++;

      // Track if match just finished (the DB trigger will handle auto-scoring)
      if (
        FINISHED_STATUS_CODES.includes(newStatus) &&
        !FINISHED_STATUS_CODES.includes(dbMatch.status)
      ) {
        finishedCount++;
        console.log(
          `Match ${dbMatch.api_fixture_id} finished: ${homeScore}-${awayScore} (${newStatus})`
        );
      }
    }

    return NextResponse.json({
      message: "Scores updated",
      activeMatches: activeMatches.length,
      updated: updatedCount,
      finished: finishedCount,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    console.error("Cron update-scores error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Wrap with QStash signature verification for security
export const POST = verifySignatureAppRouter(handler, {
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "dummy_current_key",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "dummy_next_key",
});

// Allow GET for manual testing in development
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  return handler(req);
}
