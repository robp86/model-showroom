// Showroom category definitions. Each category is a predicate over a model plus
// display metadata. Series are derived from data (buildSeries). Categories follow
// the reference Native Sun Homes taxonomy: Series + named Size groups + Bed/Bath,
// plus business + positive media filters. Completeness is NEVER a user-facing
// category — it only drives ordering (see modelFilters.defaultCompare).

import { slugify } from "../utils/slugify";
import { SIZE_GROUPS } from "../utils/sizeGroups";

const sizeCategories = SIZE_GROUPS.map((g) => ({
  id: g.id,
  label: g.label,
  group: "Size",
  blurb:
    g.max === Infinity
      ? `Our largest homes — ${g.min.toLocaleString()}+ sq ft.`
      : `${g.min.toLocaleString()}–${g.max.toLocaleString()} sq ft.`,
  match: (m) => m.sizeGroup === g.label,
}));

export const CATEGORIES = [
  // ---- Business --------------------------------------------------------
  { id: "featured", label: "Featured", group: "Business", blurb: "Homes our team is spotlighting right now.", match: (m) => m.businessTags.featured },
  { id: "best-sellers", label: "Best Sellers", group: "Business", blurb: "Our most popular floor plans with buyers.", match: (m) => m.businessTags.bestSeller },
  { id: "new-arrivals", label: "New Arrivals", group: "Business", blurb: "The newest models added to the lineup.", match: (m) => m.businessTags.newArrival },
  { id: "move-in-ready", label: "Move-In Ready", group: "Business", blurb: "Ready to deliver and live in soon.", match: (m) => m.businessTags.moveInReady },
  { id: "customizable", label: "Customizable", group: "Business", blurb: "Make it yours with options and upgrades.", match: (m) => m.businessTags.customizable },
  { id: "dealer-recommended", label: "Dealer Recommended", group: "Business", blurb: "Hand-picked favorites from Native Sun Homes.", match: (m) => m.businessTags.dealerRecommended },

  // ---- Media (positive selling points only) ---------------------------
  { id: "has-tour", label: "Virtual Tour Homes", group: "Media", blurb: "Walk through these homes in 3D.", match: (m) => m.media.hasVirtualTour },
  { id: "has-floor-plan", label: "With Floor Plans", group: "Media", blurb: "Homes with a floor plan to study.", match: (m) => m.media.hasFloorPlan },
  { id: "has-photos", label: "With Photo Galleries", group: "Media", blurb: "Homes with a full photo gallery.", match: (m) => m.media.hasPhotos },
  { id: "has-video", label: "With Video", group: "Media", blurb: "Homes with video walkthroughs.", match: (m) => m.media.hasVideo },

  // ---- Size (reference taxonomy) --------------------------------------
  ...sizeCategories,

  // ---- Bedrooms -------------------------------------------------------
  { id: "1-bedroom", label: "1 Bedroom", group: "Bedrooms", blurb: "One-bedroom homes.", match: (m) => m.beds === 1 },
  { id: "2-bedroom", label: "2 Bedroom", group: "Bedrooms", blurb: "Two-bedroom homes.", match: (m) => m.beds === 2 },
  { id: "3-bedroom", label: "3 Bedroom", group: "Bedrooms", blurb: "Three-bedroom homes.", match: (m) => m.beds === 3 },
  { id: "4-plus-bedroom", label: "4+ Bedroom", group: "Bedrooms", blurb: "Four or more bedrooms.", match: (m) => m.beds >= 4 },

  // ---- Bathrooms ------------------------------------------------------
  { id: "1-bath", label: "1 Bathroom", group: "Bathrooms", blurb: "One-bathroom homes.", match: (m) => m.baths >= 1 && m.baths < 2 },
  { id: "2-bath", label: "2 Bathroom", group: "Bathrooms", blurb: "Two-bathroom homes.", match: (m) => m.baths >= 2 && m.baths < 3 },
  { id: "3-plus-bath", label: "3+ Bathroom", group: "Bathrooms", blurb: "Three or more bathrooms.", match: (m) => m.baths >= 3 },

  // ---- Construction ---------------------------------------------------
  { id: "single-wide", label: "Single-Wide", group: "Construction", blurb: "Single-section homes.", match: (m) => m.sectionType === "single-wide" },
  { id: "double-wide", label: "Double-Wide", group: "Construction", blurb: "Double-section homes.", match: (m) => m.sectionType === "double-wide" },
  { id: "multi-section", label: "Multi-Section", group: "Construction", blurb: "Multi-section homes.", match: (m) => m.sectionType === "multi-section" },
];

export const CATEGORY_GROUPS = ["Business", "Media", "Size", "Bedrooms", "Bathrooms", "Construction"];

export function getCategory(id) {
  return CATEGORIES.find((c) => c.id === id) || null;
}

export function categoriesByGroup() {
  const out = {};
  for (const g of CATEGORY_GROUPS) out[g] = CATEGORIES.filter((c) => c.group === g);
  return out;
}

// Derive the list of series present in the data, with counts and slugs.
export function buildSeries(models) {
  const map = new Map();
  for (const m of models) {
    const name = m.series || "Other Models";
    if (!map.has(name)) map.set(name, { name, slug: slugify(name), count: 0 });
    map.get(name).count += 1;
  }
  return [...map.values()].sort((a, b) => {
    if (a.name === "Other Models") return 1;
    if (b.name === "Other Models") return -1;
    return b.count - a.count || a.name.localeCompare(b.name);
  });
}
