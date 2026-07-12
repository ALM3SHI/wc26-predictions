// ─────────────────────────────────────────────────────────────
// Confirmed + likely WC26 participants (48-team format).
// Names match the keys in i18n-data.ts TEAMS_AR so translation
// and flag lookup both work without extra plumbing.
// ─────────────────────────────────────────────────────────────

export interface WC26Team {
  name: string; // canonical English name — used everywhere
  confederation: "AFC" | "CAF" | "CONCACAF" | "CONMEBOL" | "OFC" | "UEFA";
}

export const WC26_TEAMS: WC26Team[] = [
  // Hosts
  { name: "USA", confederation: "CONCACAF" },
  { name: "Canada", confederation: "CONCACAF" },
  { name: "Mexico", confederation: "CONCACAF" },
  // UEFA — historically the largest bloc
  { name: "France", confederation: "UEFA" },
  { name: "England", confederation: "UEFA" },
  { name: "Spain", confederation: "UEFA" },
  { name: "Portugal", confederation: "UEFA" },
  { name: "Germany", confederation: "UEFA" },
  { name: "Italy", confederation: "UEFA" },
  { name: "Netherlands", confederation: "UEFA" },
  { name: "Belgium", confederation: "UEFA" },
  { name: "Croatia", confederation: "UEFA" },
  { name: "Denmark", confederation: "UEFA" },
  { name: "Serbia", confederation: "UEFA" },
  { name: "Switzerland", confederation: "UEFA" },
  { name: "Sweden", confederation: "UEFA" },
  { name: "Poland", confederation: "UEFA" },
  { name: "Norway", confederation: "UEFA" },
  { name: "Ukraine", confederation: "UEFA" },
  { name: "Wales", confederation: "UEFA" },
  { name: "Scotland", confederation: "UEFA" },
  { name: "Ireland", confederation: "UEFA" },
  { name: "Austria", confederation: "UEFA" },
  { name: "Hungary", confederation: "UEFA" },
  { name: "Czech Republic", confederation: "UEFA" },
  { name: "Turkey", confederation: "UEFA" },
  { name: "Greece", confederation: "UEFA" },
  // CONMEBOL
  { name: "Argentina", confederation: "CONMEBOL" },
  { name: "Brazil", confederation: "CONMEBOL" },
  { name: "Uruguay", confederation: "CONMEBOL" },
  { name: "Colombia", confederation: "CONMEBOL" },
  { name: "Ecuador", confederation: "CONMEBOL" },
  { name: "Paraguay", confederation: "CONMEBOL" },
  { name: "Peru", confederation: "CONMEBOL" },
  { name: "Chile", confederation: "CONMEBOL" },
  { name: "Venezuela", confederation: "CONMEBOL" },
  { name: "Bolivia", confederation: "CONMEBOL" },
  // CAF
  { name: "Morocco", confederation: "CAF" },
  { name: "Senegal", confederation: "CAF" },
  { name: "Nigeria", confederation: "CAF" },
  { name: "Egypt", confederation: "CAF" },
  { name: "Algeria", confederation: "CAF" },
  { name: "Cameroon", confederation: "CAF" },
  { name: "Ghana", confederation: "CAF" },
  { name: "Mali", confederation: "CAF" },
  { name: "Ivory Coast", confederation: "CAF" },
  // AFC
  { name: "Japan", confederation: "AFC" },
  { name: "South Korea", confederation: "AFC" },
  { name: "Saudi Arabia", confederation: "AFC" },
  { name: "Iran", confederation: "AFC" },
  { name: "Australia", confederation: "AFC" },
  { name: "Qatar", confederation: "AFC" },
  { name: "UAE", confederation: "AFC" },
  { name: "Iraq", confederation: "AFC" },
  { name: "Oman", confederation: "AFC" },
  { name: "Uzbekistan", confederation: "AFC" },
  { name: "China", confederation: "AFC" },
  // OFC
  { name: "New Zealand", confederation: "OFC" },
];

export function findTeamByName(name: string): WC26Team | undefined {
  return WC26_TEAMS.find((t) => t.name === name);
}
