// ─────────────────────────────────────────────────────────────
// WC26 Host Theme
// Colors + gradients derived from the three host nations:
// USA (red / white / blue), Canada (red), Mexico (green).
// ─────────────────────────────────────────────────────────────

export const HOST_RED = "#C8102E";
export const HOST_BLUE = "#002868";
export const HOST_GREEN = "#006847";
export const HOST_GOLD = "#FFB81C";
export const HOST_WHITE = "#FFFFFF";

export const HOST_TRI_GRADIENT = `linear-gradient(90deg, ${HOST_RED} 0%, ${HOST_RED} 33%, ${HOST_BLUE} 33%, ${HOST_BLUE} 66%, ${HOST_GREEN} 66%, ${HOST_GREEN} 100%)`;

export const HOST_SWEEP_GRADIENT = `linear-gradient(90deg, ${HOST_RED}, ${HOST_BLUE}, ${HOST_GREEN}, ${HOST_GOLD}, ${HOST_RED})`;

export const HOST_STADIUM_GRADIENT = `radial-gradient(circle at 30% 20%, ${HOST_RED}22, transparent 40%), radial-gradient(circle at 70% 60%, ${HOST_BLUE}22, transparent 45%), radial-gradient(circle at 40% 90%, ${HOST_GREEN}22, transparent 50%)`;

export const HOST_COUNTRIES = [
  { code: "usa", name: "United States", color: HOST_BLUE },
  { code: "canada", name: "Canada", color: HOST_RED },
  { code: "mexico", name: "Mexico", color: HOST_GREEN },
] as const;
