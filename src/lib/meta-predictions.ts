// ─────────────────────────────────────────────────────────────
// Meta prediction helpers — thin wrappers over Supabase.
//
// Each helper fetches / upserts one meta pick for the current user
// and returns the strongly-typed payload the UI cares about.
// Locking is enforced client-side for now (checking `locked_at`)
// with server-side locking to follow when we add tournament dates.
// ─────────────────────────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BracketPayload,
  ChampionPayload,
  GoldenBootPayload,
  GroupStandingsPayload,
  MetaPredictionType,
} from "./types";

interface MinimalMetaRow<P> {
  id: string;
  type: MetaPredictionType;
  payload: P;
  locked_at: string | null;
  scored: boolean;
  points_earned: number | null;
}

export async function getChampionPick(
  supabase: SupabaseClient,
  userId: string,
): Promise<MinimalMetaRow<ChampionPayload> | null> {
  const { data } = await supabase
    .from("meta_predictions")
    .select("id, type, payload, locked_at, scored, points_earned")
    .eq("user_id", userId)
    .eq("type", "champion")
    .maybeSingle();
  return (data as MinimalMetaRow<ChampionPayload> | null) ?? null;
}

export async function upsertChampionPick(
  supabase: SupabaseClient,
  userId: string,
  team: string,
): Promise<{ error: Error | null }> {
  const payload: ChampionPayload = { team };
  // We keep the row shape minimal — Supabase upsert will merge on the
  // (user_id, type) unique index defined in migration 002. Since we
  // added tournament_id in migration 007 with a broader uniqueness
  // key, try both conflict columns and fall back gracefully.
  let { error } = await supabase.from("meta_predictions").upsert(
    {
      user_id: userId,
      type: "champion",
      payload,
    },
    { onConflict: "user_id,type,tournament_id" },
  );
  if (error) {
    // Older schema (before migration 007) — retry with the narrower key.
    const retry = await supabase.from("meta_predictions").upsert(
      {
        user_id: userId,
        type: "champion",
        payload,
      },
      { onConflict: "user_id,type" },
    );
    error = retry.error;
  }
  return { error: error ? new Error(error.message) : null };
}

export async function getGoldenBootPick(
  supabase: SupabaseClient,
  userId: string,
): Promise<MinimalMetaRow<GoldenBootPayload> | null> {
  const { data } = await supabase
    .from("meta_predictions")
    .select("id, type, payload, locked_at, scored, points_earned")
    .eq("user_id", userId)
    .eq("type", "golden_boot")
    .maybeSingle();
  return (data as MinimalMetaRow<GoldenBootPayload> | null) ?? null;
}

export async function upsertGoldenBootPick(
  supabase: SupabaseClient,
  userId: string,
  pick: GoldenBootPayload,
): Promise<{ error: Error | null }> {
  let { error } = await supabase.from("meta_predictions").upsert(
    {
      user_id: userId,
      type: "golden_boot",
      payload: pick,
    },
    { onConflict: "user_id,type,tournament_id" },
  );
  if (error) {
    const retry = await supabase.from("meta_predictions").upsert(
      {
        user_id: userId,
        type: "golden_boot",
        payload: pick,
      },
      { onConflict: "user_id,type" },
    );
    error = retry.error;
  }
  return { error: error ? new Error(error.message) : null };
}

export async function getGroupStandingsPick(
  supabase: SupabaseClient,
  userId: string,
): Promise<MinimalMetaRow<GroupStandingsPayload> | null> {
  const { data } = await supabase
    .from("meta_predictions")
    .select("id, type, payload, locked_at, scored, points_earned")
    .eq("user_id", userId)
    .eq("type", "group_standings")
    .maybeSingle();
  return (data as MinimalMetaRow<GroupStandingsPayload> | null) ?? null;
}

export async function upsertGroupStandingsPick(
  supabase: SupabaseClient,
  userId: string,
  payload: GroupStandingsPayload,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("meta_predictions").upsert(
    {
      user_id: userId,
      type: "group_standings",
      payload,
    },
    { onConflict: "user_id,type" },
  );
  return { error: error ? new Error(error.message) : null };
}

export async function getBracketPick(
  supabase: SupabaseClient,
  userId: string,
): Promise<MinimalMetaRow<BracketPayload> | null> {
  const { data } = await supabase
    .from("meta_predictions")
    .select("id, type, payload, locked_at, scored, points_earned")
    .eq("user_id", userId)
    .eq("type", "bracket")
    .maybeSingle();
  return (data as MinimalMetaRow<BracketPayload> | null) ?? null;
}

export async function upsertBracketPick(
  supabase: SupabaseClient,
  userId: string,
  payload: BracketPayload,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.from("meta_predictions").upsert(
    {
      user_id: userId,
      type: "bracket",
      payload,
    },
    { onConflict: "user_id,type" },
  );
  return { error: error ? new Error(error.message) : null };
}
