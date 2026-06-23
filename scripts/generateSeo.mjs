// Generates public/sitemap.xml + public/llms.txt from the model data.
//   node scripts/generateSeo.mjs
// llms.txt is an emerging convention that gives AI answer engines a clean,
// link-rich summary of the site (AIEO).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { models } from "../src/data/models.generated.js";
import { SITE_URL, BUSINESS } from "../src/data/business.js";
import { SIZE_GROUPS } from "../src/utils/sizeGroups.js";
import { slugify } from "../src/utils/slugify.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const xmlEsc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const staticPaths = [
  ["/", 1.0],
  ["/homes", 0.9],
  ["/floor-plans", 0.7],
  ["/series", 0.7],
  ["/find", 0.6],
  ["/financing", 0.6],
  ["/how-it-works", 0.6],
  ["/about", 0.7],
  ["/contact", 0.7],
  ["/category/has-tour", 0.6],
  ["/category/move-in-ready", 0.5],
  ["/category/customizable", 0.5],
];

const seriesSlugs = [...new Set(models.map((m) => slugify(m.series || "Other Models")))];
const sizeCatIds = SIZE_GROUPS.map((g) => g.id);

const urls = [
  ...staticPaths.map(([p, pr]) => ({ loc: p, priority: pr, changefreq: "weekly" })),
  ...seriesSlugs.map((s) => ({ loc: `/series/${s}`, priority: 0.5, changefreq: "weekly" })),
  ...sizeCatIds.map((id) => ({ loc: `/category/${id}`, priority: 0.5, changefreq: "weekly" })),
  ...models.map((m) => ({ loc: `/model/${m.id}`, priority: 0.6, changefreq: "monthly" })),
];

const today = new Date().toISOString().slice(0, 10);
const sitemap =
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  urls
    .map(
      (u) =>
        `  <url><loc>${xmlEsc(SITE_URL + u.loc)}</loc><lastmod>${today}</lastmod>` +
        `<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`
    )
    .join("\n") +
  `\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT, "public", "sitemap.xml"), sitemap);

// ---- llms.txt (AIEO) -------------------------------------------------------
const withMedia = models.filter((m) => m.media.hasVirtualTour || m.media.hasFloorPlan || m.media.hasPhotos);
const llms =
  `# Native Sun Homes LLC\n\n` +
  `> ${BUSINESS.name} sells new manufactured & modular homes across all of Florida, ` +
  `in partnership with Champion Homes (70+ years of craftsmanship). ${BUSINESS.tagline}.\n\n` +
  `- Phone: ${BUSINESS.phone}\n- Email: ${BUSINESS.email}\n- Service area: all of Florida (delivery & installation)\n` +
  `- ${models.length} home models with floor plans, photo galleries, and 3D virtual tours.\n` +
  `- Homes are HUD-certified; financing assistance, customization, delivery and setup available.\n` +
  `- Pricing is provided on request (contact for current pricing and availability).\n\n` +
  `## Key pages\n` +
  `- [Home](${SITE_URL}/): overview and featured homes\n` +
  `- [Our Homes](${SITE_URL}/homes): browse all ${models.length} models with filters\n` +
  `- [Floor Plans](${SITE_URL}/floor-plans): homes with floor plans\n` +
  `- [Virtual Tour Homes](${SITE_URL}/category/has-tour): homes with 3D tours\n` +
  `- [Series](${SITE_URL}/series): browse by collection\n` +
  `- [How It Works](${SITE_URL}/how-it-works): buying process + FAQ\n` +
  `- [Financing](${SITE_URL}/financing): financing guidance\n` +
  `- [About](${SITE_URL}/about): company and Champion partnership\n` +
  `- [Contact](${SITE_URL}/contact): request pricing or a free estimate\n\n` +
  `## Home models (${withMedia.length} with media)\n` +
  withMedia
    .map(
      (m) =>
        `- ${m.name}${m.series && m.series !== "Other Models" ? ` (${m.series})` : ""} — ` +
        `${m.beds || "?"} bd / ${m.baths || "?"} ba / ${m.sqft ? m.sqft.toLocaleString() + " sq ft" : "size on request"}: ${SITE_URL}/model/${m.id}`
    )
    .join("\n") +
  `\n`;
fs.writeFileSync(path.join(ROOT, "public", "llms.txt"), llms);

console.log(`Wrote public/sitemap.xml (${urls.length} URLs) and public/llms.txt (${withMedia.length} models).`);
