import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import type { APIFixture, APIFootballResponse, MatchRound } from "@/lib/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_FOOTBALL_KEY = process.env.API_FOOTBALL_KEY!;
const API_FOOTBALL_HOST =
  process.env.API_FOOTBALL_HOST || "v3.football.api-sports.io";

// Knockout round names from API-Football → our MatchRound type
const KNOCKOUT_ROUND_MAP: Record<string, MatchRound> = {
  "Round of 32": "Round of 32",
  "Round of 16": "Round of 16",
  "Quarter-finals": "Quarter-finals",
  "Quarter-final": "Quarter-finals",
  "Semi-finals": "Semi-finals",
  "Semi-final": "Semi-finals",
  "3rd Place": "3rd Place",
  "Third-place match": "3rd Place",
  Final: "Final",
};

/**
 * POST /api/fixtures/sync
 * Syncs World Cup 2026 knockout fixtures from API-Football into Supabase.
 * Triggered once daily by QStash, or manually.
 *
 * This is the ONLY endpoint that writes to the matches table.
 */
async function handler(req: Request) {
  const startTime = Date.now();

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Fetch ALL World Cup 2026 fixtures in one request
    const url = `https://${API_FOOTBALL_HOST}/fixtures?league=1&season=2026`;
    const response = await fetch(url, {
      headers: {
        "x-apisports-key": API_FOOTBALL_KEY,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API-Football error:", response.status, errorText);
      return NextResponse.json(
        { error: "API fetch failed", details: errorText },
        { status: 502 }
      );
    }

    const data: APIFootballResponse<APIFixture> = await response.json();

    if (data.errors && Object.keys(data.errors).length > 0) {
      console.error("API-Football errors:", data.errors);
      return NextResponse.json(
        { error: "API returned errors", details: data.errors },
        { status: 502 }
      );
    }

    // Filter to knockout rounds only
    const knockoutFixtures = data.response.filter((fixture) => {
      const round = fixture.league.round;
      return Object.keys(KNOCKOUT_ROUND_MAP).some(
        (kr) => round.toLowerCase().includes(kr.toLowerCase())
      );
    });

    if (knockoutFixtures.length === 0) {
      return NextResponse.json({
        message: "No knockout fixtures found in API response",
        totalFixtures: data.results,
        duration: Date.now() - startTime,
      });
    }

    // Upsert each fixture into the matches table
    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const fixture of knockoutFixtures) {
      // Map API round name to our MatchRound type
      let mappedRound: MatchRound = "Round of 32";
      for (const [apiRound, ourRound] of Object.entries(KNOCKOUT_ROUND_MAP)) {
        if (fixture.league.round.toLowerCase().includes(apiRound.toLowerCase())) {
          mappedRound = ourRound;
          break;
        }
      }

      const matchData = {
        api_fixture_id: fixture.fixture.id,
        round: mappedRound,
        home_team: fixture.teams.home.name,
        away_team: fixture.teams.away.name,
        home_team_logo: fixture.teams.home.logo,
        away_team_logo: fixture.teams.away.logo,
        home_score: fixture.goals.home,
        away_score: fixture.goals.away,
        start_time: fixture.fixture.date,
        status: fixture.fixture.status.short,
        venue: fixture.fixture.venue
          ? `${fixture.fixture.venue.name}, ${fixture.fixture.venue.city}`
          : null,
        updated_at: new Date().toISOString(),
      };

      // Upsert: insert if new, update if exists (by api_fixture_id)
      const { data: existing } = await supabase
        .from("matches")
        .select("id")
        .eq("api_fixture_id", fixture.fixture.id)
        .single();

      if (existing) {
        // Update existing match
        const { error } = await supabase
          .from("matches")
          .update(matchData)
          .eq("api_fixture_id", fixture.fixture.id);

        if (error) {
          console.error(`Error updating fixture ${fixture.fixture.id}:`, error);
          errorCount++;
        } else {
          updatedCount++;
        }
      } else {
        // Insert new match
        const { error } = await supabase.from("matches").insert(matchData);

        if (error) {
          console.error(`Error inserting fixture ${fixture.fixture.id}:`, error);
          errorCount++;
        } else {
          insertedCount++;
        }
      }
    }

    return NextResponse.json({
      message: "Fixtures synced",
      totalFromAPI: data.results,
      knockoutFixtures: knockoutFixtures.length,
      inserted: insertedCount,
      updated: updatedCount,
      errors: errorCount,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    console.error("Fixtures sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Wrap with QStash signature verification
export const POST = verifySignatureAppRouter(handler, {
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "dummy_current_key",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "dummy_next_key",
});

// Allow GET for manual testing/initial sync in development
export async function GET(req: Request) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }
  return handler(req);
}
