import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!SUPABASE_SERVICE_KEY) {
      throw new Error("Missing service role key");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Get all finished matches
    const { data: finishedMatches, error: matchesError } = await supabase
      .from("matches")
      .select("*")
      .eq("status", "FT");

    if (matchesError) throw matchesError;

    let processedMatches = 0;
    let pointsAwarded = 0;

    for (const match of finishedMatches || []) {
      if (match.home_score === null || match.away_score === null) continue;

      const actualHome = match.home_score;
      const actualAway = match.away_score;
      const actualDiff = actualHome - actualAway;

      // 2. Get uncalculated predictions for this match
      const { data: predictions, error: predError } = await supabase
        .from("predictions")
        .select("*")
        .eq("match_id", match.id)
        .is("points_earned", null);

      if (predError) continue;
      if (!predictions || predictions.length === 0) continue;

      processedMatches++;

      // 3. Calculate points
      for (const pred of predictions) {
        let points = 0;
        const predHome = pred.home_prediction;
        const predAway = pred.away_prediction;
        const predDiff = predHome - predAway;

        if (predHome === actualHome && predAway === actualAway) {
          points = 3; // Exact Score
        } else if (
          (actualDiff > 0 && predDiff > 0) || // Home Win
          (actualDiff < 0 && predDiff < 0) || // Away Win
          (actualDiff === 0 && predDiff === 0) // Draw
        ) {
          points = 1; // Correct Outcome
        } else {
          points = 0; // Wrong
        }

        // 4. Update Prediction
        await supabase
          .from("predictions")
          .update({ points_earned: points })
          .eq("id", pred.id);

        pointsAwarded += points;

        // 5. Update User Profile total points
        const { data: profile } = await supabase
          .from("profiles")
          .select("total_points")
          .eq("id", pred.user_id)
          .single();

        if (profile) {
          await supabase
            .from("profiles")
            .update({ total_points: profile.total_points + points })
            .eq("id", pred.user_id);
        }
      }
    }

    return NextResponse.json({
      message: "Scoring calculated successfully",
      processedMatches,
      pointsAwarded,
    });
  } catch (error: any) {
    console.error("Scoring error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
