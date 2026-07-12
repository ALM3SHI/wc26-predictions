// ─────────────────────────────────────────────────────────────
// Battle Pass — 20 tiers, mixed cosmetic + functional rewards.
//
// Thresholds MUST stay in sync with the tier_for_xp() SQL
// function in migrations/003_xp_battle_pass.sql — the DB is
// authoritative for "am I this tier?", the client uses this
// map only to render the path and next-tier preview.
// ─────────────────────────────────────────────────────────────

export type RewardKind = "cosmetic" | "functional" | "milestone";

export interface Tier {
  level: number;
  xp: number; // threshold — reach this to unlock
  titleKey: string; // i18n key: "bp.tier.X.title"
  rewardKey: string; // i18n key: "bp.tier.X.reward"
  kind: RewardKind;
  color: string; // accent for the tile
  icon: string; // emoji shorthand
}

export const TIERS: Tier[] = [
  { level: 1,  xp: 0,    titleKey: "bp.tier.1.title",  rewardKey: "bp.tier.1.reward",  kind: "milestone",  color: "#94A3B8", icon: "🎉" },
  { level: 2,  xp: 45,   titleKey: "bp.tier.2.title",  rewardKey: "bp.tier.2.reward",  kind: "cosmetic",   color: "#94A3B8", icon: "🎨" },
  { level: 3,  xp: 80,   titleKey: "bp.tier.3.title",  rewardKey: "bp.tier.3.reward",  kind: "cosmetic",   color: "#B45309", icon: "🥉" },
  { level: 4,  xp: 115,  titleKey: "bp.tier.4.title",  rewardKey: "bp.tier.4.reward",  kind: "functional", color: "#0EA5E9", icon: "📊" },
  { level: 5,  xp: 150,  titleKey: "bp.tier.5.title",  rewardKey: "bp.tier.5.reward",  kind: "cosmetic",   color: "#10B981", icon: "🏴" },

  { level: 6,  xp: 190,  titleKey: "bp.tier.6.title",  rewardKey: "bp.tier.6.reward",  kind: "cosmetic",   color: "#94A3B8", icon: "🥈" },
  { level: 7,  xp: 235,  titleKey: "bp.tier.7.title",  rewardKey: "bp.tier.7.reward",  kind: "functional", color: "#F97316", icon: "😀" },
  { level: 8,  xp: 285,  titleKey: "bp.tier.8.title",  rewardKey: "bp.tier.8.reward",  kind: "functional", color: "#6366F1", icon: "👀" },
  { level: 9,  xp: 340,  titleKey: "bp.tier.9.title",  rewardKey: "bp.tier.9.reward",  kind: "functional", color: "#3B82F6", icon: "📈" },
  { level: 10, xp: 400,  titleKey: "bp.tier.10.title", rewardKey: "bp.tier.10.reward", kind: "milestone",  color: "#EAB308", icon: "⚡" },

  { level: 11, xp: 460,  titleKey: "bp.tier.11.title", rewardKey: "bp.tier.11.reward", kind: "cosmetic",   color: "#EAB308", icon: "🥇" },
  { level: 12, xp: 530,  titleKey: "bp.tier.12.title", rewardKey: "bp.tier.12.reward", kind: "functional", color: "#0EA5E9", icon: "🛡️" },
  { level: 13, xp: 610,  titleKey: "bp.tier.13.title", rewardKey: "bp.tier.13.reward", kind: "functional", color: "#8B5CF6", icon: "👥" },
  { level: 14, xp: 700,  titleKey: "bp.tier.14.title", rewardKey: "bp.tier.14.reward", kind: "cosmetic",   color: "#EC4899", icon: "✨" },
  { level: 15, xp: 800,  titleKey: "bp.tier.15.title", rewardKey: "bp.tier.15.reward", kind: "milestone",  color: "#EF4444", icon: "🔥" },

  { level: 16, xp: 920,  titleKey: "bp.tier.16.title", rewardKey: "bp.tier.16.reward", kind: "cosmetic",   color: "#06B6D4", icon: "💠" },
  { level: 17, xp: 1060, titleKey: "bp.tier.17.title", rewardKey: "bp.tier.17.reward", kind: "cosmetic",   color: "#8B5CF6", icon: "🌈" },
  { level: 18, xp: 1220, titleKey: "bp.tier.18.title", rewardKey: "bp.tier.18.reward", kind: "functional", color: "#0284C7", icon: "🆚" },
  { level: 19, xp: 1400, titleKey: "bp.tier.19.title", rewardKey: "bp.tier.19.reward", kind: "cosmetic",   color: "#F59E0B", icon: "🎨" },
  { level: 20, xp: 1600, titleKey: "bp.tier.20.title", rewardKey: "bp.tier.20.reward", kind: "milestone",  color: "#FFB81C", icon: "👑" },
];

export const MAX_TIER = 20;

export function tierForXp(xp: number): number {
  for (let i = TIERS.length - 1; i >= 0; i -= 1) {
    if (xp >= TIERS[i].xp) return TIERS[i].level;
  }
  return 1;
}

export function nextTier(currentLevel: number): Tier | null {
  return TIERS.find((t) => t.level === currentLevel + 1) ?? null;
}

export function tierByLevel(level: number): Tier {
  return TIERS.find((t) => t.level === level) ?? TIERS[0];
}

// Progress inside the current tier (0-1). Returns 1 at max tier.
export function tierProgress(xp: number, level: number): number {
  const cur = tierByLevel(level);
  const nxt = nextTier(level);
  if (!nxt) return 1;
  const range = nxt.xp - cur.xp;
  if (range <= 0) return 1;
  return Math.min(1, Math.max(0, (xp - cur.xp) / range));
}

// XP still needed to hit the next tier.
export function xpToNext(xp: number, level: number): number {
  const nxt = nextTier(level);
  if (!nxt) return 0;
  return Math.max(0, nxt.xp - xp);
}
