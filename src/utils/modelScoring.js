// Single source of truth for media completeness scoring + tiering.
// Imported by the build script (Node) and the runtime UI (browser).

export const TIERS = [
  "complete",
  "strong",
  "partial",
  "floor-plan-only",
  "minimal",
  "bare",
];

export const TIER_ORDER = {
  complete: 0,
  strong: 1,
  partial: 2,
  "floor-plan-only": 3,
  minimal: 4,
  bare: 5,
};

export const TIER_LABEL = {
  complete: "Complete Profile",
  strong: "Strong Profile",
  partial: "Partial Profile",
  "floor-plan-only": "Floor Plan Only",
  minimal: "Minimal Info",
  bare: "Listing Only",
};

// Business priority order used as a secondary sort within a tier.
export const BUSINESS_PRIORITY = [
  "featured",
  "bestSeller",
  "moveInReady",
  "newArrival",
];

export function scoreModel({
  heroImage,
  photosCount = 0,
  floorPlansCount = 0,
  virtualToursCount = 0,
  videosCount = 0,
  hasCompleteSpecs = false,
  hasBuyerInfo = false,
}) {
  let s = 0;
  if (heroImage) s += 15;
  if (photosCount >= 5) s += 20;
  if (photosCount >= 12) s += 10; // bonus
  if (floorPlansCount >= 1) s += 25;
  if (virtualToursCount >= 1) s += 30;
  if (videosCount >= 1) s += 10;
  if (hasCompleteSpecs) s += 10;
  if (hasBuyerInfo) s += 10;
  return s;
}

export function computeMediaTier({
  photosCount = 0,
  floorPlansCount = 0,
  virtualToursCount = 0,
  floorPlanOnly = false,
  hasCompleteSpecs = false,
  sourceUrl = "",
}) {
  const hasFloorPlan = floorPlansCount >= 1;
  const hasTour = virtualToursCount >= 1;
  const hasPhotos = photosCount >= 1;

  if (photosCount >= 5 && hasFloorPlan && hasTour) return "complete";
  if (photosCount >= 5 && (hasFloorPlan || hasTour)) return "strong";
  if ((floorPlanOnly || hasFloorPlan) && !hasPhotos && !hasTour)
    return "floor-plan-only";
  if (hasPhotos || hasFloorPlan || hasTour) return "partial";
  if (hasCompleteSpecs || sourceUrl) return "minimal";
  return "bare";
}

// Build the `media` block + a few derived flags from raw inputs.
export function buildMediaBlock({
  heroImage = "",
  photos = [],
  floorPlans = [],
  virtualTours = [],
  videos = [],
  sourceUrl = "",
  localGalleryFolder = "",
  floorPlanOnly = false,
  hasCompleteSpecs = false,
  hasBuyerInfo = false,
}) {
  const photosCount = photos.length;
  const floorPlansCount = floorPlans.length;
  const virtualToursCount = virtualTours.length;
  const videosCount = videos.length;

  const hasPhotos = photosCount >= 1;
  const hasFloorPlan = floorPlansCount >= 1;
  const hasVirtualTour = virtualToursCount >= 1;
  const hasVideo = videosCount >= 1;

  const mediaScore = scoreModel({
    heroImage,
    photosCount,
    floorPlansCount,
    virtualToursCount,
    videosCount,
    hasCompleteSpecs,
    hasBuyerInfo,
  });

  const mediaTier = computeMediaTier({
    photosCount,
    floorPlansCount,
    virtualToursCount,
    floorPlanOnly,
    hasCompleteSpecs,
    sourceUrl,
  });

  return {
    heroImage,
    photos,
    floorPlans,
    virtualTours,
    videos,
    sourceUrl,
    localGalleryFolder,
    hasPhotos,
    hasFloorPlan,
    hasVirtualTour,
    hasVideo,
    floorPlanOnly: floorPlanOnly && !hasPhotos,
    missingMedia:
      !heroImage && !hasPhotos && !hasFloorPlan && !hasVirtualTour && !hasVideo,
    mediaScore,
    mediaTier,
  };
}
