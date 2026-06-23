// Filtering + sorting for the showroom. The default ordering is the heart of
// the "smart showroom": complete profiles first, then business priority, then
// media score, then alphabetical.

import { TIER_ORDER, BUSINESS_PRIORITY } from "./modelScoring";

function businessRank(model) {
  for (let i = 0; i < BUSINESS_PRIORITY.length; i++) {
    if (model.businessTags?.[BUSINESS_PRIORITY[i]]) return i;
  }
  return BUSINESS_PRIORITY.length;
}

// The canonical comparator (a < b means a ranks higher / shows first).
export function defaultCompare(a, b) {
  const tierA = TIER_ORDER[a.media.mediaTier] ?? 99;
  const tierB = TIER_ORDER[b.media.mediaTier] ?? 99;
  if (tierA !== tierB) return tierA - tierB;

  const bizA = businessRank(a);
  const bizB = businessRank(b);
  if (bizA !== bizB) return bizA - bizB;

  if (b.media.mediaScore !== a.media.mediaScore)
    return b.media.mediaScore - a.media.mediaScore;

  return a.name.localeCompare(b.name);
}

export const SORT_OPTIONS = [
  { id: "best-match", label: "Best Match" },
  { id: "featured-first", label: "Featured First" },
  { id: "best-sellers", label: "Best Sellers First" },
  { id: "newest", label: "Newest First" },
  { id: "sqft-asc", label: "Sq Ft: Low to High" },
  { id: "sqft-desc", label: "Sq Ft: High to Low" },
  { id: "beds", label: "Bedrooms" },
  { id: "baths", label: "Bathrooms" },
  { id: "az", label: "Name A–Z" },
  { id: "za", label: "Name Z–A" },
];

const SORTERS = {
  "best-match": defaultCompare,
  "complete-first": defaultCompare,
  "featured-first": (a, b) =>
    Number(b.businessTags.featured) - Number(a.businessTags.featured) ||
    defaultCompare(a, b),
  "best-sellers": (a, b) =>
    Number(b.businessTags.bestSeller) - Number(a.businessTags.bestSeller) ||
    defaultCompare(a, b),
  newest: (a, b) =>
    Number(b.businessTags.newArrival) - Number(a.businessTags.newArrival) ||
    defaultCompare(a, b),
  "sqft-asc": (a, b) => (a.sqft || 0) - (b.sqft || 0) || defaultCompare(a, b),
  "sqft-desc": (a, b) => (b.sqft || 0) - (a.sqft || 0) || defaultCompare(a, b),
  beds: (a, b) => (b.beds || 0) - (a.beds || 0) || defaultCompare(a, b),
  baths: (a, b) => (b.baths || 0) - (a.baths || 0) || defaultCompare(a, b),
  az: (a, b) => a.name.localeCompare(b.name),
  za: (a, b) => b.name.localeCompare(a.name),
};

export function sortModels(models, sortId = "best-match") {
  const sorter = SORTERS[sortId] || defaultCompare;
  return [...models].sort(sorter);
}

// Text search across name, series, features and tags.
function matchesQuery(model, q) {
  if (!q) return true;
  const hay = [
    model.name,
    model.series,
    ...(model.features || []),
    ...(model.buyerTags || []),
  ]
    .join(" ")
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term));
}

/**
 * Filter a model list.
 * filters: {
 *   query, series, beds (number|""), baths (number|""),
 *   minSqft, maxSqft, tiers: string[],
 *   hasPhotos, hasFloorPlan, hasTour,
 *   moveInReady, featured, bestSeller, newArrival,
 *   sectionType
 * }
 */
export function filterModels(models, filters = {}) {
  return models.filter((m) => {
    if (!matchesQuery(m, filters.query)) return false;
    if (filters.series && m.series !== filters.series) return false;

    if (filters.beds === "4") {
      if (m.beds < 4) return false;
    } else if (filters.beds) {
      if (m.beds !== Number(filters.beds)) return false;
    }

    if (filters.baths === "3") {
      if (m.baths < 3) return false;
    } else if (filters.baths) {
      const b = Number(filters.baths);
      if (!(m.baths >= b && m.baths < b + 1)) return false;
    }

    if (filters.minSqft && m.sqft && m.sqft < Number(filters.minSqft)) return false;
    if (filters.maxSqft && m.sqft && m.sqft > Number(filters.maxSqft)) return false;
    if (filters.sizeGroup && m.sizeGroup !== filters.sizeGroup) return false;

    if (filters.hasPhotos && !m.media.hasPhotos) return false;
    if (filters.hasFloorPlan && !m.media.hasFloorPlan) return false;
    if (filters.hasTour && !m.media.hasVirtualTour) return false;

    if (filters.moveInReady && !m.businessTags.moveInReady) return false;
    if (filters.featured && !m.businessTags.featured) return false;
    if (filters.bestSeller && !m.businessTags.bestSeller) return false;
    if (filters.newArrival && !m.businessTags.newArrival) return false;

    if (filters.sectionType && m.sectionType !== filters.sectionType) return false;

    return true;
  });
}

export const EMPTY_FILTERS = {
  query: "",
  series: "",
  sizeGroup: "",
  beds: "",
  baths: "",
  minSqft: "",
  maxSqft: "",
  hasPhotos: false,
  hasFloorPlan: false,
  hasTour: false,
  moveInReady: false,
  featured: false,
  bestSeller: false,
  newArrival: false,
  sectionType: "",
};

export function countActiveFilters(filters) {
  let n = 0;
  for (const [k, v] of Object.entries(filters)) {
    if (k === "query") continue;
    if (Array.isArray(v)) n += v.length;
    else if (v) n += 1;
  }
  return n;
}
