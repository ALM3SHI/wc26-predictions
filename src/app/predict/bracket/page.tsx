// ─────────────────────────────────────────────────────────────
// Bracket Predictor — knockout round-by-round winner picks
//
// Loads every knockout match that already has both teams set
// (i.e., the draw has resolved) and hands them to the client
// picker grouped by round. The final row also captures the
// champion pick to stay consistent with the champion meta type.
// ─────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BracketPicker from "./BracketPicker";

export const dynamic = "force-dynamic";

const KNOCKOUT_ROUNDS = [
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
] as const;

export default async function BracketPredictionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/predict/bracket");
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("id, round, home_team, away_team, start_time, status")
    .in("round", [...KNOCKOUT_ROUNDS])
    .order("start_time", { ascending: true });

  return (
    <BracketPicker
      userId={user.id}
      matches={
        (matches ?? []).filter(
          (m) =>
            m.home_team &&
            m.away_team &&
            m.home_team !== "TBD" &&
            m.away_team !== "TBD",
        )
      }
    />
  );
}
