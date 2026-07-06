import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { MatchRound } from "@/lib/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const API_KEY = process.env.FOOTBALL_DATA_KEY || "a72b258b9b784e0ca8b1d909a0f09af1";

// Map football-data.org stages to our MatchRound type
const STAGE_MAP: Record<string, MatchRound> = {
  "LAST_16": "Round of 16",
  "QUARTER_FINALS": "Quarter-finals",
  "SEMI_FINALS": "Semi-finals",
  "THIRD_PLACE": "3rd Place",
  "FINAL": "Final",
};

export async function GET(req: Request) {
  return handler(req);
}

export async function POST(req: Request) {
  return handler(req);
}

async function handler(req: Request) {
  const startTime = Date.now();

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const url = `http://api.football-data.org/v4/competitions/WC/matches`;
    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": API_KEY,
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("football-data.org error:", response.status, errorText);
      return NextResponse.json(
        { error: "API fetch failed", details: errorText },
        { status: 502 }
      );
    }

    const data = await response.json();

    if (!data.matches) {
      return NextResponse.json(
        { error: "API returned no matches array", details: data },
        { status: 502 }
      );
    }

    // Filter out group stage matches and map to our knockout rounds
    const knockoutFixtures = data.matches.filter((match: any) => {
      return STAGE_MAP[match.stage] !== undefined;
    });

    if (knockoutFixtures.length === 0) {
      return NextResponse.json({
        message: "No knockout fixtures found in API response",
        totalFixtures: data.matches.length,
        duration: Date.now() - startTime,
      });
    }

    let insertedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;

    for (const match of knockoutFixtures) {
      const mappedRound = STAGE_MAP[match.stage] || "Round of 32";
      
      const homeScore = match.score?.fullTime?.home;
      const awayScore = match.score?.fullTime?.away;
      
      // Determine if a match is "live" based on football-data statuses
      // football-data.org uses IN_PLAY, PAUSED, FINISHED, TIMED, SCHEDULED
      let mappedStatus = "NS";
      if (match.status === "FINISHED") mappedStatus = "FT";
      else if (match.status === "IN_PLAY" || match.status === "PAUSED") mappedStatus = "2H"; // generic live status
      else if (match.status === "TIMED" || match.status === "SCHEDULED") mappedStatus = "NS";

      const matchData = {
        api_fixture_id: match.id,
        round: mappedRound,
        home_team: match.homeTeam?.name || "TBD",
        away_team: match.awayTeam?.name || "TBD",
        home_team_logo: match.homeTeam?.crest || null,
        away_team_logo: match.awayTeam?.crest || null,
        home_score: homeScore !== undefined ? homeScore : null,
        away_score: awayScore !== undefined ? awayScore : null,
        start_time: match.utcDate,
        status: mappedStatus,
        venue: null,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from("matches")
        .select("id")
        .eq("api_fixture_id", match.id)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("matches")
          .update(matchData)
          .eq("api_fixture_id", match.id);

        if (error) {
          console.error(`Error updating fixture ${match.id}:`, error);
          errorCount++;
        } else {
          updatedCount++;
        }
      } else {
        const { error } = await supabase.from("matches").insert(matchData);

        if (error) {
          console.error(`Error inserting fixture ${match.id}:`, error);
          errorCount++;
        } else {
          insertedCount++;
        }
      }
    }

    return NextResponse.json({
      message: "Fixtures synced with football-data.org",
      totalFromAPI: data.matches.length,
      knockoutFixtures: knockoutFixtures.length,
      inserted: insertedCount,
      updated: updatedCount,
      errors: errorCount,
      duration: Date.now() - startTime,
    });
  } catch (err: any) {
    console.error("Unhandled sync error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err.message },
      { status: 500 }
    );
  }
}
