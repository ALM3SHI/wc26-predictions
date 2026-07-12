// ─────────────────────────────────────────────────────────────
// Group standings prediction page
//
// Server-fetches the current group draws from football-data.org
// (so we don't have to hand-code them once FIFA publishes the
// draw), then hands them to the client picker for ordering.
// ─────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStandings } from "@/lib/football-data";
import GroupsPicker from "./GroupsPicker";

export const dynamic = "force-dynamic";

export default async function GroupsPredictionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/predict/groups");
  }

  const standings = await getStandings().catch(() => []);

  // Slim the payload for the client — the picker only needs group name
  // and team names.
  const groups = standings.map((g) => ({
    group: g.group,
    teams: g.table.map((r) => r.team.name),
  }));

  return <GroupsPicker userId={user.id} groups={groups} />;
}
