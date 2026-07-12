// ─────────────────────────────────────────────────────────────
// Battle Pass — full 20-tier season path
//
// Server-fetches the user's xp_total and current_tier so the
// path renders correctly on first paint (no unlock flicker).
// Silently short-circuits if the xp column doesn't exist yet
// (migration 003 not applied) — every user shows as tier 1 XP 0.
// ─────────────────────────────────────────────────────────────

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BattlePassPath from "./BattlePassPath";

export const dynamic = "force-dynamic";

export default async function BattlePassPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/battle-pass");

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp_total, current_tier, display_name, favorite_team")
    .eq("id", user.id)
    .single();

  return (
    <BattlePassPath
      xp={profile?.xp_total ?? 0}
      tier={profile?.current_tier ?? 1}
      displayName={profile?.display_name ?? ""}
    />
  );
}
