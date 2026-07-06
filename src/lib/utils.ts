export function getFlagPath(countryName: string): string {
  if (!countryName || countryName === "TBD") return "/flags/tbd.png";
  if (countryName === "United States" || countryName === "USA") return "/flags/usa.png";
  return `/flags/${countryName.toLowerCase().replace(/ /g, "-")}.png`;
}
