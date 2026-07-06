export function getFlagPath(countryName: string): string {
  if (!countryName || countryName === "TBD") return "/flags/tbd.png";
  return `/flags/${countryName.toLowerCase().replace(/ /g, "-")}.png`;
}
