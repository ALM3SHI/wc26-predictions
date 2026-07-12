// ─────────────────────────────────────────────────────────────
// football-data.org v4 — typed server-side client
// Aggressively cached via Upstash Redis. All functions are safe to
// call from Server Components; they never leak the API key to the
// browser and gracefully degrade on error (return null / empty array).
// ─────────────────────────────────────────────────────────────

import {
  getCached,
  setCached,
  getCacheKey,
  FIXTURES_TTL,
  LIVE_SCORE_TTL,
  FINISHED_MATCH_TTL,
  TEAMS_TTL,
} from "@/lib/cache";

const BASE = "https://api.football-data.org/v4";
const KEY = process.env.FOOTBALL_DATA_KEY || "a72b258b9b784e0ca8b1d909a0f09af1";
const COMP = "WC";

// ─────────────────────────────────────────────────────────────
// Response types (only the fields we use)
// ─────────────────────────────────────────────────────────────

export interface FDArea {
  id: number;
  name: string;
  code: string;
  flag: string | null;
}

export interface FDCompetitionRef {
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string;
}

export interface FDSeason {
  id: number;
  startDate: string;
  endDate: string;
  currentMatchday: number | null;
  winner: FDTeam | null;
}

export interface FDTeam {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
  address?: string;
  website?: string;
  founded?: number;
  clubColors?: string;
  venue?: string | null;
  lastUpdated?: string;
}

export interface FDReferee {
  id: number;
  name: string;
  type: string;
  nationality: string;
}

export type FDMatchStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED"
  | "AWARDED";

export type FDStage =
  | "GROUP_STAGE"
  | "LAST_16"
  | "QUARTER_FINALS"
  | "SEMI_FINALS"
  | "THIRD_PLACE"
  | "FINAL"
  | string;

export type FDDuration = "REGULAR" | "EXTRA_TIME" | "PENALTY_SHOOTOUT";

export interface FDMatch {
  id: number;
  utcDate: string;
  status: FDMatchStatus;
  matchday: number | null;
  stage: FDStage;
  group: string | null;
  lastUpdated: string;
  homeTeam: FDTeam;
  awayTeam: FDTeam;
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    duration: FDDuration;
    fullTime: { home: number | null; away: number | null };
    halfTime: { home: number | null; away: number | null };
    regularTime?: { home: number | null; away: number | null };
    extraTime?: { home: number | null; away: number | null };
    penalties?: { home: number | null; away: number | null };
  };
  referees: FDReferee[];
}

export interface FDMatchesResponse {
  filters: { season: string };
  resultSet: { count: number; first: string; last: string; played: number };
  competition: FDCompetitionRef;
  matches: FDMatch[];
}

export interface FDScorer {
  player: {
    id: number;
    name: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    section: string;
    position: string | null;
    shirtNumber: number | null;
  };
  team: FDTeam;
  playedMatches: number;
  goals: number;
  assists: number | null;
  penalties: number | null;
}

export interface FDScorersResponse {
  count: number;
  filters: { season: string; limit: number };
  competition: FDCompetitionRef;
  season: FDSeason;
  scorers: FDScorer[];
}

export interface FDStandingRow {
  position: number;
  team: FDTeam;
  playedGames: number;
  form: string | null;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

export interface FDStandingGroup {
  stage: string;
  type: string;
  group: string;
  table: FDStandingRow[];
}

export interface FDStandingsResponse {
  filters: { season: string };
  area: FDArea;
  competition: FDCompetitionRef;
  season: FDSeason;
  standings: FDStandingGroup[];
}

export interface FDCompetitionResponse {
  area: FDArea;
  id: number;
  name: string;
  code: string;
  type: string;
  emblem: string;
  currentSeason: FDSeason;
  seasons: FDSeason[];
}

// ─────────────────────────────────────────────────────────────
// Private fetcher
// ─────────────────────────────────────────────────────────────

// Hard cap so a slow/dead upstream never blocks a Server Component render.
// football-data.org has occasional 5-10s tail latency; we'd rather show a
// missing badge than a frozen page.
const FD_TIMEOUT_MS = 2500;

async function fdFetch<T>(path: string): Promise<T | null> {
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), FD_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { "X-Auth-Token": KEY },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[football-data] ${path} → ${res.status}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      console.error(`[football-data] ${path} timed out after ${FD_TIMEOUT_MS}ms`);
    } else {
      console.error(`[football-data] ${path} threw`, err);
    }
    return null;
  } finally {
    clearTimeout(abortTimer);
  }
}

async function withCache<T>(
  key: string,
  ttl: number,
  loader: () => Promise<T | null>,
): Promise<T | null> {
  const cached = await getCached<T>(key);
  if (cached) return cached;
  const fresh = await loader();
  if (fresh) await setCached(key, fresh, ttl);
  return fresh;
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/** All WC matches this season (group + knockout). Cached for LIVE_SCORE_TTL. */
export async function getAllMatches(): Promise<FDMatch[]> {
  const data = await withCache<FDMatchesResponse>(
    getCacheKey("fd", "matches"),
    LIVE_SCORE_TTL,
    () => fdFetch<FDMatchesResponse>(`/competitions/${COMP}/matches`),
  );
  return data?.matches ?? [];
}

/** Rich data for a single match (halftime, referee, group, matchday). */
export async function getMatchByApiId(
  apiFixtureId: number,
): Promise<FDMatch | null> {
  const cached = await getCached<FDMatch>(
    getCacheKey("fd", "match", String(apiFixtureId)),
  );
  if (cached) return cached;

  const all = await getAllMatches();
  const one = all.find((m) => m.id === apiFixtureId) ?? null;
  if (one) {
    const ttl = one.status === "FINISHED" ? FINISHED_MATCH_TTL : LIVE_SCORE_TTL;
    await setCached(getCacheKey("fd", "match", String(apiFixtureId)), one, ttl);
  }
  return one;
}

/** Live matches — subset of all where status is IN_PLAY / PAUSED. */
export async function getLiveMatches(): Promise<FDMatch[]> {
  const all = await getAllMatches();
  return all.filter((m) => m.status === "IN_PLAY" || m.status === "PAUSED");
}

/** Golden Boot race — top scorers. */
export async function getTopScorers(limit = 10): Promise<FDScorer[]> {
  const data = await withCache<FDScorersResponse>(
    getCacheKey("fd", "scorers", String(limit)),
    FIXTURES_TTL,
    () => fdFetch<FDScorersResponse>(`/competitions/${COMP}/scorers?limit=${limit}`),
  );
  return data?.scorers ?? [];
}

/** Group standings (12 groups of 4). */
export async function getStandings(): Promise<FDStandingGroup[]> {
  const data = await withCache<FDStandingsResponse>(
    getCacheKey("fd", "standings"),
    FIXTURES_TTL,
    () => fdFetch<FDStandingsResponse>(`/competitions/${COMP}/standings`),
  );
  return data?.standings ?? [];
}

/** Competition metadata — used for historic winners. */
export async function getCompetition(): Promise<FDCompetitionResponse | null> {
  return withCache<FDCompetitionResponse>(
    getCacheKey("fd", "competition"),
    TEAMS_TTL,
    () => fdFetch<FDCompetitionResponse>(`/competitions/${COMP}`),
  );
}

/** Historic winners — every prior WC with the winning team. */
export async function getHistoricWinners(): Promise<
  Array<{ year: number; season: FDSeason }>
> {
  const comp = await getCompetition();
  if (!comp) return [];
  return comp.seasons
    .filter((s) => s.winner)
    .map((s) => ({ year: new Date(s.startDate).getFullYear(), season: s }))
    .sort((a, b) => b.year - a.year);
}
