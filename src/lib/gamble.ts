// ─────────────────────────────────────────────────────────────
// WC26 Gamble Ledger
// Client-only stake picker + risk/reward math. Server-side scoring
// is untouched — this only affects the "Personal Gamble Score" shown
// in the UI. Flip SERVER_STAKE_ENABLED to true after running the
// optional migration in supabase/migrations/001_gamble_stake.sql.
// ─────────────────────────────────────────────────────────────

export const SERVER_STAKE_ENABLED = false;

export type StakeId = "safe" | "bold" | "legend" | "allin";

export interface Stake {
  id: StakeId;
  mult: number;
  label: string;
  tagline: string;
  color: string;      // host palette hex
  ring: string;       // ring color hex
  glow: string;       // rgba glow
}

export const STAKES: Stake[] = [
  {
    id: "safe",
    mult: 1,
    label: "Safe",
    tagline: "No risk. No glory.",
    color: "#006847",
    ring: "#0FA968",
    glow: "rgba(16, 185, 129, 0.45)",
  },
  {
    id: "bold",
    mult: 2,
    label: "Bold",
    tagline: "Double or nothing.",
    color: "#002868",
    ring: "#3D6BD8",
    glow: "rgba(6, 132, 220, 0.5)",
  },
  {
    id: "legend",
    mult: 3,
    label: "Legend",
    tagline: "Triple the write-up.",
    color: "#C8102E",
    ring: "#F04058",
    glow: "rgba(239, 68, 68, 0.55)",
  },
  {
    id: "allin",
    mult: 5,
    label: "All-In",
    tagline: "Hall of Fame or bust.",
    color: "#FFB81C",
    ring: "#FFD154",
    glow: "rgba(255, 184, 28, 0.6)",
  },
];

export function getStakeById(id: StakeId | string | null | undefined): Stake {
  return STAKES.find((s) => s.id === id) ?? STAKES[0];
}

const STORAGE_KEY = "wc26.stakes";

type StakeMap = Record<string, StakeId>;

function readMap(): StakeMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed ? (parsed as StakeMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: StakeMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // storage full or blocked — silently ignore
  }
}

export function getStake(matchId: string): StakeId {
  const map = readMap();
  return map[matchId] ?? "safe";
}

export function setStake(matchId: string, id: StakeId): void {
  const map = readMap();
  map[matchId] = id;
  writeMap(map);
}

export function getAllStakes(): StakeMap {
  return readMap();
}

/**
 * Compute the personal gamble outcome for a finished prediction.
 *   - null           → match not scored yet
 *   - positive int   → points won (points_earned × mult)
 *   - negative int   → points lost (−(mult − 1)) on a wrong pick
 * Safe (1x) never loses points and mirrors the base scoring.
 */
export function computeGambleScore(
  pointsEarned: number,
  scored: boolean,
  stakeMult: number,
): number | null {
  if (!scored) return null;
  if (pointsEarned > 0) return pointsEarned * stakeMult;
  if (stakeMult <= 1) return 0;
  return -(stakeMult - 1);
}

/**
 * Preview text used inside the StakeSelector. Given a stake and the
 * base scoring rules, describe the win / loss range succinctly.
 */
export function stakePreview(stakeMult: number) {
  const exact = 3 * stakeMult;
  const outcome = 1 * stakeMult;
  const loss = stakeMult <= 1 ? 0 : -(stakeMult - 1);
  return { exact, outcome, loss };
}
