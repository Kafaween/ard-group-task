// City names may contain letters, spaces, apostrophes, hyphens, and periods
// (e.g. "New York", "Winston-Salem", "O'Fallon", "St. Louis"), but never digits
// or other symbols.
const CITY_NAME_PATTERN = /^\p{L}(?:[\p{L}\s'.-]*\p{L})?$/u;

export function isValidCityName(city: string): boolean {
  const trimmed = city.trim();
  if (!trimmed) return false;
  return CITY_NAME_PATTERN.test(trimmed);
}
