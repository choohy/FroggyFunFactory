export const VENUE_FEATURES = [
  "Parking",
  "Outdoor Space",
  "Catering Kitchen",
  "Wheelchair Accessible",
  "WiFi",
  "AV Equipment",
  "Dance Floor",
  "Bar",
  "Bridal Suite",
  "Overnight Accommodation",
] as const;

export function parseFeatures(value: string | null | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean);
}

export function serializeFeatures(features: string[]): string | null {
  const clean = features.map((f) => f.trim()).filter(Boolean);
  return clean.length > 0 ? clean.join(",") : null;
}
