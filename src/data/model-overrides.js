// MANUAL BUSINESS CONTROL
// ----------------------------------------------------------------------------
// Featured / best-seller / availability flags are business decisions and must
// NOT be invented by code. Set them here, keyed by model id (the slug of the
// model name, e.g. "Ace 2.0" -> "ace-2-0").
//
// Supported keys per model:
//   featured, bestSeller, newArrival, moveInReady,
//   customizable, dealerRecommended  -> boolean business tags
//   series        -> override detected series
//   heroImage     -> override the cover image (path under /public or a URL)
//   sourceUrl     -> correct a wrong Champion URL
//   buyerTags     -> extra lifestyle tags (string[])
//   features      -> extra feature bullets (string[])
//   hide          -> true to remove the model from the site
//   notes         -> string[] shown on the audit page
//
// The build script (scripts/buildModelData.mjs) merges these on top of the
// generated data, so re-run `npm run build:data` after editing.

export const modelOverrides = {
  stagg: {
    featured: true,
    bestSeller: true,
    moveInReady: true,
    notes: ["Flagship demo model — full gallery, floor plan and 3D tour."],
  },
  "big-sky": {
    featured: true,
    newArrival: true,
  },
  "casa-grande": {
    bestSeller: true,
    moveInReady: true,
  },
  birchwood: {
    featured: true,
    moveInReady: true,
  },
  stirling: {
    dealerRecommended: true,
    customizable: true,
  },
  "the-aaron": {
    newArrival: true,
  },
  "silver-springs-5006-the-palm": {
    bestSeller: true,
  },
  "cypress-manor-0764b": {
    dealerRecommended: true,
  },
};

export function getOverride(id) {
  return modelOverrides[id] || {};
}
