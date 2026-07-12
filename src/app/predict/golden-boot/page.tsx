// ─────────────────────────────────────────────────────────────
// Golden Boot prediction page (server component wrapper)
//
// Fetches the current top-scorers list from football-data.org
// server-side so the client picker starts hydrated with real
// players. When the API returns nothing we still render the page
// with just the current pick + empty state.
// ─────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTopScorers } from "@/lib/football-data";
import GoldenBootPicker from "./GoldenBootPicker";

export const dynamic = "force-dynamic";

export default async function GoldenBootPredictionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/predict/golden-boot");
  }

  // 100 players is plenty for a picker; football-data limits it further.
  const scorers = await getTopScorers(100).catch(() => []);

  return <GoldenBootPicker userId={user.id} scorers={scorers} />;
}
