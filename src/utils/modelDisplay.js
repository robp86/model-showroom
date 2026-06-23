// Pure display helpers shared by model components (kept out of component files
// so React Fast Refresh stays happy).

import { TIER_LABEL } from "./modelScoring";

export function specsLine(model) {
  const parts = [];
  if (model.beds) parts.push(`${model.beds} bd`);
  if (model.baths) parts.push(`${model.baths} ba`);
  if (model.sqft) parts.push(`${model.sqft.toLocaleString()} sqft`);
  return parts.length ? parts.join("  •  ") : "Specs available on request";
}

export function tierBadgeVariant(tier) {
  if (tier === "complete") return "complete";
  if (tier === "strong") return "green";
  if (tier === "partial") return "muted";
  if (tier === "floor-plan-only") return "warn";
  return "muted";
}

// Positive selling-point badges only. Completeness/tier is NEVER shown to
// buyers — it only drives ordering.
export function getModelBadges(model) {
  const b = [];
  const { businessTags: t, media } = model;

  if (t.featured) b.push({ label: "Featured", variant: "gold" });
  if (t.bestSeller) b.push({ label: "Best Seller", variant: "gold" });
  if (t.newArrival) b.push({ label: "New Arrival", variant: "info" });
  if (t.moveInReady) b.push({ label: "Move-In Ready", variant: "green" });

  if (media.hasVirtualTour) b.push({ label: "3D Tour", variant: "info" });
  if (media.hasFloorPlan) b.push({ label: "Floor Plan", variant: "muted" });
  if (media.hasVideo) b.push({ label: "Video", variant: "muted" });
  return b;
}

export { TIER_LABEL };
