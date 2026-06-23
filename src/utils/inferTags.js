// Series detection + buyer-tag inference from specs/media.

// Known series, longest/most-specific first so multi-word names win.
export const KNOWN_SERIES = [
  "Champion Community",
  "Silver Springs Elite",
  "Silver Springs",
  "Grand Slam",
  "Home Run",
  "Lake Manor",
  "Palm Bay",
  "Cypress Manor",
  "Pine Manor",
  "Foundation Limited",
  "Foundation",
  "Prime Grand",
  "Prime Vertex",
  "Prime Apex",
  "Prime Manor",
  "Prime Ridge",
  "Prime",
  "Waycross Express",
  "Key Largo",
  "Freedom",
  "Signature",
  "Icon",
  "Legend",
  "Liberty",
  "Embrace",
  "Helicon",
  "Providence",
  "Pursuit",
  "Riverview",
  "By Regional",
  "Regional Homes",
  "HOMC",
  "HOMA",
  "HC",
  "RH",
];

export function inferSeries(name, parentSeries, seriesHint) {
  if (parentSeries) return parentSeries;
  const lower = String(name).toLowerCase();
  const match = KNOWN_SERIES.find((s) => lower.startsWith(s.toLowerCase()));
  if (match) return match;
  if (seriesHint) return seriesHint;
  return "Other Models";
}

// Look for a known series name anywhere in arbitrary text (e.g. a Champion
// image filename like "239-palm-bay-calloway-239-dining.jpg").
export function detectSeriesInText(text) {
  const hay = String(text).toLowerCase().replace(/[^a-z0-9]+/g, " ");
  for (const s of KNOWN_SERIES) {
    const needle = s.toLowerCase();
    if (needle.length <= 2) continue; // skip "HC"/"RH" — too noisy inside filenames
    if (hay.includes(needle)) return s;
  }
  return null;
}

// Derive buyer-facing lifestyle tags from specs, features and media.
export function inferBuyerTags({
  beds = 0,
  sqft = 0,
  features = [],
  hasVirtualTour = false,
} = {}) {
  const tags = new Set();
  const feat = features.map((f) => String(f).toLowerCase());
  const has = (kw) => feat.some((f) => f.includes(kw));

  if (beds <= 2 && sqft && sqft < 1100) tags.add("starter-home");
  if (sqft && sqft < 1200) tags.add("budget-friendly");
  if (beds >= 3) tags.add("family-friendly");
  if (beds >= 4) tags.add("large-family");
  if (sqft && sqft < 1000) tags.add("compact");
  if (sqft && sqft >= 2000) tags.add("spacious");
  if (sqft && sqft >= 2200) tags.add("luxury-feel");

  if (has("island") || has("kitchen")) tags.add("large-kitchen");
  if (has("porch") || has("outdoor") || has("deck")) tags.add("porch-outdoor");
  if (has("open")) tags.add("open-concept");
  if (hasVirtualTour) tags.add("virtual-tour");

  return [...tags];
}

// Rough section-type guess from a Champion-style code embedded in the name,
// e.g. "...2856..." → double-wide. Returns "" when uncertain.
export function inferSectionType(name) {
  const m = String(name).match(/\b(\d{2})(\d{2})\d*\b/);
  if (!m) return "";
  const width = Number(m[1]);
  if (width <= 18) return "single-wide";
  if (width <= 32) return "double-wide";
  return "multi-section";
}
