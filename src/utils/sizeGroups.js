// Named size groups — the taxonomy from the reference Native Sun Homes site.
// Shared by the build script (to stamp each model) and the UI (tiles + filter).

export const SIZE_GROUPS = [
  { id: "size-compact", label: "Compact Homes", min: 0, max: 999 },
  { id: "size-efficient", label: "Efficient Homes", min: 1000, max: 1199 },
  { id: "size-classic", label: "Classic Family Homes", min: 1200, max: 1399 },
  { id: "size-popular", label: "Popular Family Homes", min: 1400, max: 1599 },
  { id: "size-spacious", label: "Spacious Homes", min: 1600, max: 1799 },
  { id: "size-large", label: "Large Family Homes", min: 1800, max: 1999 },
  { id: "size-estate", label: "Estate / Grand Homes", min: 2000, max: Infinity },
];

// Returns the group label for a square footage, or "" when unknown.
export function getSizeGroup(sqft) {
  const n = Number(sqft);
  if (!n) return "";
  const g = SIZE_GROUPS.find((x) => n >= x.min && n <= x.max);
  return g ? g.label : "";
}
