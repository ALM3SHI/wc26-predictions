// ─────────────────────────────────────────────────────────────
// Flag path resolver
//
// Team names arrive from many sources — football-data.org, api-football,
// manually-entered admin rows — and each spells the same country a
// little differently. Normalize aggressively here so a valid flag PNG
// under public/flags/ is returned whenever we own the country.
// ─────────────────────────────────────────────────────────────

// Aliases from external / display names → our canonical filename slug.
// Keys are lowercased before lookup.
const FLAG_ALIASES: Record<string, string> = {
  // United States
  "united states": "usa",
  "united states of america": "usa",
  us: "usa",

  // Korea
  "korea republic": "south-korea",
  "republic of korea": "south-korea",
  korea: "south-korea",
  "south korea": "south-korea",

  // Iran
  "ir iran": "iran",
  "islamic republic of iran": "iran",

  // Bosnia
  "bosnia and herzegovina": "tbd", // no flag PNG yet
  "bosnia-herzegovina": "tbd",
  bosnia: "tbd",

  // Türkiye
  türkiye: "turkey",

  // Ivory Coast
  "côte d'ivoire": "ivory-coast",
  "cote d'ivoire": "ivory-coast",

  // UAE
  "united arab emirates": "uae",

  // Czech
  czechia: "czech-republic",

  // Ireland
  "republic of ireland": "ireland",

  // Countries we don't have flag PNGs for yet — map to TBD explicitly so the
  // user sees a graceful placeholder rather than a broken image.
  "south africa": "tbd",
  russia: "tbd",
  slovakia: "tbd",
  romania: "tbd",
  slovenia: "tbd",
  finland: "tbd",
  iceland: "tbd",
  albania: "tbd",
  kosovo: "tbd",
  montenegro: "tbd",
  "dr congo": "tbd",
  "cape verde": "tbd",
  gabon: "tbd",
  angola: "tbd",
  zambia: "tbd",
  kenya: "tbd",
  uganda: "tbd",
  tanzania: "tbd",
  burkina: "tbd",
  "burkina faso": "tbd",
  guinea: "tbd",
  tunisia: "tbd",
  georgia: "tbd",
};

function toSlug(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "-");
}

export function getFlagPath(countryName: string): string {
  if (!countryName || countryName === "TBD") return "/flags/tbd.png";

  const key = countryName.trim().toLowerCase();
  const aliased = FLAG_ALIASES[key];
  if (aliased) return `/flags/${aliased}.png`;

  return `/flags/${toSlug(countryName)}.png`;
}
