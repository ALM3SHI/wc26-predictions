// ─────────────────────────────────────────────────────────────
// Mini-league client helpers — thin wrappers over the RPC
// functions defined in migrations/004_mini_leagues.sql.
// Every call goes through supabase.rpc so RLS + SECURITY DEFINER
// rules stay authoritative on the server.
// ─────────────────────────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";

export interface League {
  id: string;
  code: string;
  name: string;
  emoji: string | null;
  owner_id: string;
  member_count: number;
  created_at: string;
}

export interface LeagueMemberRow {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_points: number;
  favorite_team: string | null;
}

export async function createLeague(
  supabase: SupabaseClient,
  name: string,
  emoji?: string,
): Promise<{ id?: string; code?: string; error?: string }> {
  const { data, error } = await supabase.rpc("create_league", {
    p_name: name,
    p_emoji: emoji ?? null,
  });
  if (error) return { error: error.message };
  const row = Array.isArray(data) ? data[0] : data;
  return { id: row?.id, code: row?.code };
}

export async function joinLeague(
  supabase: SupabaseClient,
  code: string,
): Promise<{ id?: string; error?: string }> {
  const { data, error } = await supabase.rpc("join_league", {
    p_code: code,
  });
  if (error) return { error: error.message };
  return { id: data as unknown as string };
}

export async function leaveLeague(
  supabase: SupabaseClient,
  leagueId: string,
): Promise<{ error?: string }> {
  const { error } = await supabase.rpc("leave_league", {
    p_league_id: leagueId,
  });
  if (error) return { error: error.message };
  return {};
}

export async function myLeagues(
  supabase: SupabaseClient,
  userId: string,
): Promise<League[]> {
  const { data } = await supabase
    .from("league_members")
    .select("league_id, leagues(id, code, name, emoji, owner_id, member_count, created_at)")
    .eq("user_id", userId);

  // Supabase's PostgREST join can return the relation as either an
  // object or an array depending on the FK arity — normalize.
  const out: League[] = [];
  for (const row of data ?? []) {
    const lg = (row as { leagues: League | League[] | null }).leagues;
    if (!lg) continue;
    if (Array.isArray(lg)) {
      for (const item of lg) if (item) out.push(item);
    } else {
      out.push(lg);
    }
  }
  return out.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export async function getLeague(
  supabase: SupabaseClient,
  leagueId: string,
): Promise<League | null> {
  const { data } = await supabase
    .from("leagues")
    .select("id, code, name, emoji, owner_id, member_count, created_at")
    .eq("id", leagueId)
    .maybeSingle();
  return (data as League | null) ?? null;
}

export async function getLeagueMembers(
  supabase: SupabaseClient,
  leagueId: string,
): Promise<LeagueMemberRow[]> {
  // Two-hop: fetch member user_ids then hydrate profile rows in a
  // single follow-up query. Keeps the SQL simple and RLS predictable.
  const { data: members } = await supabase
    .from("league_members")
    .select("user_id")
    .eq("league_id", leagueId);
  const userIds = (members ?? []).map((m) => m.user_id as string);
  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, total_points, favorite_team")
    .in("id", userIds);

  return (profiles ?? [])
    .map((p) => ({
      user_id: p.id as string,
      display_name: (p.display_name as string) ?? "",
      avatar_url: (p.avatar_url as string | null) ?? null,
      total_points: (p.total_points as number) ?? 0,
      favorite_team: (p.favorite_team as string | null) ?? null,
    }))
    .sort((a, b) => b.total_points - a.total_points);
}
