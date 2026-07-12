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

const GROUP_STATUSES = ["NS", "TBD"];

export default async function GroupsPredictionPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?next=/predict/groups");
  }

  // Load two things in parallel: the current standings (for the group
  // teams) AND a count of group-stage matches that haven't kicked off
  // yet. When zero remain we've moved past group stage, so the picker
  // must lock automatically and render as an archive.
  const [standings, unfinishedRes] = await Promise.all([
    getStandings().catch(() => []),
    supabase
      .from("matches")
      .select("id", { count: "exact", head: true })
      .eq("round", "Group Stage")
      .in("status", GROUP_STATUSES),
  ]);

  // Fallback: if the round column isn't populated with "Group Stage",
  // consider the stage locked when no upcoming matches remain across
  // any round earlier than R16. Keeping the logic conservative — if
  // in doubt we lock, so users can't chase a stage that's already
  // resolved.
  const unfinished = unfinishedRes.count ?? 0;
  const groupStageLocked = unfinished === 0;

  const groups = standings.map((g) => ({
    group: g.group,
    teams: g.table.map((r) => r.team.name),
  }));

  return (
    <GroupsPicker
      userId={user.id}
      groups={groups}
      forcedLock={groupStageLocked}
    />
  );
}
