// Build pipeline: CSV specs + local gallery scan -> generated model dataset.
//
//   node scripts/buildModelData.mjs
//
// Outputs:
//   src/data/models.generated.js        (the dataset the app imports)
//   src/data/media-audit.generated.json (completeness audit)
//
// Champion media (floor plans / tours / videos scraped from championhomes.com)
// is merged in automatically if src/data/champion-media.generated.json exists
// (produced separately by scripts/scrapeChampionMedia.mjs).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { slugify, normalizeKey, similarity } from "../src/utils/slugify.js";
import {
  parseFolderFlags,
  classifyFolderMedia,
} from "../src/utils/mediaDetection.js";
import { buildMediaBlock, TIER_LABEL } from "../src/utils/modelScoring.js";
import {
  inferSeries,
  inferBuyerTags,
  inferSectionType,
  detectSeriesInText,
} from "../src/utils/inferTags.js";
import { getSizeGroup } from "../src/utils/sizeGroups.js";
import { modelOverrides } from "../src/data/model-overrides.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const GALLERY_ROOT = path.join(ROOT, "public", "model-galleries");
const CSV_PATH = path.join(ROOT, "data-import", "updated-model-specs.csv");
const CHAMPION_PATH = path.join(ROOT, "src", "data", "champion-media.generated.json");
const OUT_DATA = path.join(ROOT, "src", "data", "models.generated.js");
const OUT_AUDIT = path.join(ROOT, "src", "data", "media-audit.generated.json");

const FUZZY_THRESHOLD = 0.72;

/* ------------------------------------------------------------------ CSV ---- */

function readCsv() {
  const raw = fs.readFileSync(CSV_PATH, "utf8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  return lines
    .slice(1)
    .map((line) => {
      const parts = line.split(",");
      const name = (parts[0] || "").trim();
      const beds = Number((parts[1] || "").trim()) || 0;
      const baths = Number((parts[2] || "").trim()) || 0;
      const sqft = Number((parts[3] || "").replace(/[^0-9.]/g, "")) || 0;
      const sourceUrl = (parts.slice(4).join(",") || "").trim();
      return { name, beds, baths, sqft, sourceUrl };
    })
    .filter((r) => r.name);
}

/* ------------------------------------------------------- gallery scan ------ */

function webPath(segments) {
  return "/model-galleries/" + segments.map(encodeURIComponent).join("/");
}

function makeFolderRecord(absPath, segments, parentSeries) {
  const files = fs
    .readdirSync(absPath, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name);
  const leafName = segments[segments.length - 1];
  const flags = parseFolderFlags(leafName);
  const media = classifyFolderMedia(files, { floorPlanOnly: flags.floorPlanOnly });
  const toWeb = (file) => webPath([...segments, file]);
  const seriesHint = detectSeriesInText(files.join(" "));

  return {
    segments,
    leafName,
    cleanName: flags.cleanName,
    parentSeries: parentSeries ? parseFolderFlags(parentSeries).cleanName : null,
    seriesHint,
    floorPlanOnly: flags.floorPlanOnly,
    noPhotos: flags.noPhotos,
    photos: media.photos.map(toWeb),
    floorPlans: media.floorPlans.map(toWeb),
    videos: media.videos.map(toWeb),
    heroImage: media.heroImage ? toWeb(media.heroImage) : "",
    localFolder: webPath(segments),
    key: normalizeKey(leafName),
    matched: false,
  };
}

function scanGalleries() {
  if (!fs.existsSync(GALLERY_ROOT)) return [];
  const records = [];
  for (const top of fs.readdirSync(GALLERY_ROOT, { withFileTypes: true })) {
    if (!top.isDirectory()) continue;
    const topPath = path.join(GALLERY_ROOT, top.name);
    const entries = fs.readdirSync(topPath, { withFileTypes: true });
    const subDirs = entries.filter((e) => e.isDirectory());

    if (subDirs.length > 0) {
      // Grouped series folder: each subdirectory is a model.
      for (const sd of subDirs) {
        records.push(
          makeFolderRecord(path.join(topPath, sd.name), [top.name, sd.name], top.name)
        );
      }
    } else {
      // Flat model folder.
      records.push(makeFolderRecord(topPath, [top.name], null));
    }
  }
  return records;
}

/* ----------------------------------------------------------- matching ------ */

function buildFolderIndex(folders) {
  const byKey = new Map();
  for (const r of folders) if (!byKey.has(r.key)) byKey.set(r.key, r);
  return byKey;
}

function matchFolder(name, folders, byKey) {
  const key = normalizeKey(name);
  const exact = byKey.get(key);
  if (exact && !exact.matched) return { folder: exact, quality: 1 };

  let best = null;
  let bestScore = 0;
  for (const r of folders) {
    if (r.matched) continue;
    const s = similarity(name, r.leafName);
    if (s > bestScore) {
      bestScore = s;
      best = r;
    }
  }
  if (best && bestScore >= FUZZY_THRESHOLD) return { folder: best, quality: bestScore };
  return null;
}

/* ------------------------------------------------------- model assembly ---- */

function assembleModel({ name, beds, baths, sqft, sourceUrl, folder, legacy, champion, quality }) {
  let photos = folder ? folder.photos.slice() : [];
  let floorPlans = folder ? folder.floorPlans.slice() : [];
  const videos = folder ? folder.videos.slice() : [];
  let virtualTours = [];
  let heroImage = folder ? folder.heroImage : "";

  // Legacy data (old models.js) — scene7 cover + any previously applied tour/plan.
  if (legacy) {
    if (!heroImage && legacy.image) heroImage = legacy.image;
    if (legacy.floorPlan && floorPlans.length === 0) floorPlans.push(legacy.floorPlan);
    if (legacy.virtualTour) virtualTours.push(legacy.virtualTour);
  }

  // Champion-scraped media fills gaps: local media wins; Champion fills what's
  // missing (the manufacturer's official photos, floor plans, 3D tours, videos).
  let externalMedia = false;
  if (champion && champion.scrapeStatus === "success") {
    if (photos.length === 0 && champion.photos?.length) {
      photos.push(...champion.photos);
      externalMedia = true;
    }
    if (floorPlans.length === 0 && champion.floorPlans?.length) {
      floorPlans.push(...champion.floorPlans);
      externalMedia = true;
    }
    if (champion.virtualTours?.length) virtualTours.push(...champion.virtualTours);
    if (videos.length === 0 && champion.videos?.length) videos.push(...champion.videos);
    if (!heroImage && champion.heroImage) heroImage = champion.heroImage;
  }
  virtualTours = [...new Set(virtualTours)];

  // Request right-sized images from Champion's scene7 CDN (the raw URLs serve
  // full-resolution originals, which are slow). Local images are left alone.
  const sizeScene7 = (u, w) =>
    /s7d9\.scene7\.com\/is\/image/.test(u) && !u.includes("?")
      ? `${u}?wid=${w}&qlt=82`
      : u;
  photos = photos.map((u) => sizeScene7(u, 1200));
  floorPlans = floorPlans.map((u) => sizeScene7(u, 1400));
  heroImage = sizeScene7(heroImage, 1200);

  if (!heroImage && photos[0]) heroImage = photos[0];

  const id = slugify(name);
  const override = modelOverrides[id] || {};
  if (override.heroImage) heroImage = override.heroImage;
  if (override.sourceUrl) sourceUrl = override.sourceUrl;

  const series =
    override.series || inferSeries(name, folder?.parentSeries, folder?.seriesHint);
  const externalHero = /^https?:/i.test(heroImage);

  const features = [...(champion?.features || []), ...(override.features || [])];
  const hasCompleteSpecs = Boolean(beds && baths && sqft);
  const buyerTags = [
    ...new Set([
      ...inferBuyerTags({
        beds,
        baths,
        sqft,
        features,
        hasVirtualTour: virtualTours.length > 0,
      }),
      ...(override.buyerTags || []),
    ]),
  ];

  const media = buildMediaBlock({
    heroImage,
    photos,
    floorPlans,
    virtualTours,
    videos,
    sourceUrl: sourceUrl || "",
    localGalleryFolder: folder?.localFolder || "",
    floorPlanOnly: folder?.floorPlanOnly || false,
    hasCompleteSpecs,
    hasBuyerInfo: buyerTags.length > 0 || features.length > 0,
  });
  media.externalHero = externalHero;
  media.externalMedia = externalMedia;

  const possibleUrlMismatch = Boolean(folder && quality !== undefined && quality < 0.85);
  const notes = [...(override.notes || [])];
  if (possibleUrlMismatch) {
    notes.push(
      `Gallery folder "${folder.leafName}" matched by similarity (${quality.toFixed(2)}). Verify it is the right home.`
    );
  }

  return {
    id,
    slug: id,
    name,
    series,
    beds,
    baths,
    sqft,
    sizeGroup: getSizeGroup(sqft),
    type: "manufactured",
    sectionType: champion?.sectionType || inferSectionType(name),
    brand: champion?.brand || "",
    sourceUrl: sourceUrl || "",
    businessTags: {
      featured: Boolean(override.featured),
      bestSeller: Boolean(override.bestSeller),
      newArrival: Boolean(override.newArrival),
      moveInReady: Boolean(override.moveInReady ?? champion?.availability?.moveInReady),
      customizable: override.customizable ?? true,
      dealerRecommended: Boolean(override.dealerRecommended),
    },
    buyerTags,
    features,
    media,
    profileStatus: {
      completeProfile: media.mediaTier === "complete",
      missingPhotos: !media.hasPhotos,
      missingFloorPlan: !media.hasFloorPlan,
      missingVirtualTour: !media.hasVirtualTour,
      missingSpecs: !hasCompleteSpecs,
      possibleUrlMismatch,
      notes,
    },
    _meta: {
      hasLocalFolder: Boolean(folder),
      matchQuality: folder ? Number((quality ?? 1).toFixed(3)) : null,
      championStatus: champion?.scrapeStatus || null,
    },
  };
}

/* ------------------------------------------------------------------ run ---- */

async function importMaybe(absPath, named) {
  if (!fs.existsSync(absPath)) return null;
  const mod = await import(pathToFileURL(absPath).href);
  return named ? mod[named] : mod.default ?? mod;
}

async function main() {
  const rows = readCsv();
  const folders = scanGalleries();
  const byKey = buildFolderIndex(folders);

  // Optional enrichment sources.
  const legacyModels = (await importMaybe(path.join(ROOT, "src/data/models.js"), "models")) || [];
  const legacyByKey = new Map();
  for (const m of legacyModels) legacyByKey.set(normalizeKey(m.name), m);

  let championRaw = null;
  try {
    if (fs.existsSync(CHAMPION_PATH))
      championRaw = JSON.parse(fs.readFileSync(CHAMPION_PATH, "utf8"));
  } catch {
    championRaw = null;
  }
  // Match Champion records by the exact source URL (the sheet's link), since the
  // scraped page title often differs from the sheet name.
  const championByUrl = new Map();
  if (championRaw?.models)
    for (const c of championRaw.models) if (c.sourceUrl) championByUrl.set(c.sourceUrl, c);

  const usedIds = new Map();
  const models = [];
  const noFolder = [];
  const duplicateNames = [];
  const seenNames = new Set();

  // 1) CSV models (master list).
  for (const row of rows) {
    if (seenNames.has(normalizeKey(row.name))) duplicateNames.push(row.name);
    seenNames.add(normalizeKey(row.name));

    const match = matchFolder(row.name, folders, byKey);
    if (match) match.folder.matched = true;
    else noFolder.push(row.name);

    const model = assembleModel({
      ...row,
      folder: match?.folder || null,
      quality: match?.quality,
      legacy: legacyByKey.get(normalizeKey(row.name)),
      champion: championByUrl.get(row.sourceUrl),
    });

    // De-dupe ids.
    if (usedIds.has(model.id)) {
      const n = usedIds.get(model.id) + 1;
      usedIds.set(model.id, n);
      model.id = `${model.id}-${n}`;
      model.slug = model.id;
    } else {
      usedIds.set(model.id, 1);
    }
    models.push(model);
  }

  // 2) Orphan gallery folders that never matched a CSV row — keep them as homes
  //    (they have real photos) but flag the missing specs.
  const orphanFolders = [];
  for (const folder of folders) {
    if (folder.matched) continue;
    orphanFolders.push(folder.leafName);
    const model = assembleModel({
      name: folder.cleanName || folder.leafName,
      beds: 0,
      baths: 0,
      sqft: 0,
      sourceUrl: "",
      folder,
      quality: 1,
      legacy: legacyByKey.get(folder.key),
      champion: null,
    });
    model.profileStatus.notes.push("Added from gallery folder — no spreadsheet specs matched.");
    if (usedIds.has(model.id)) {
      const n = usedIds.get(model.id) + 1;
      usedIds.set(model.id, n);
      model.id = `${model.id}-${n}`;
      model.slug = model.id;
    } else {
      usedIds.set(model.id, 1);
    }
    models.push(model);
  }

  // Apply hide overrides.
  const visible = models.filter((m) => !modelOverrides[m.id]?.hide);

  /* ---------------------------------------------------------- write data --- */
  const tierCounts = {};
  for (const m of visible) tierCounts[m.media.mediaTier] = (tierCounts[m.media.mediaTier] || 0) + 1;

  const header =
    `// AUTO-GENERATED by scripts/buildModelData.mjs — do not edit by hand.\n` +
    `// Generated: ${new Date().toISOString()}\n` +
    `// Source: data-import/updated-model-specs.csv + public/model-galleries scan.\n\n`;
  fs.writeFileSync(
    OUT_DATA,
    header +
      `export const models = ${JSON.stringify(visible, null, 2)};\n\n` +
      `export const generatedAt = ${JSON.stringify(new Date().toISOString())};\n`
  );

  /* --------------------------------------------------------- write audit --- */
  const audit = {
    generatedAt: new Date().toISOString(),
    totalModels: visible.length,
    fromSpreadsheet: rows.length,
    fromGalleryOnly: orphanFolders.length,
    galleryFoldersScanned: folders.length,
    tierCounts,
    completeProfiles: visible.filter((m) => m.profileStatus.completeProfile).length,
    missingPhotos: visible.filter((m) => m.profileStatus.missingPhotos).length,
    missingFloorPlan: visible.filter((m) => m.profileStatus.missingFloorPlan).length,
    missingVirtualTour: visible.filter((m) => m.profileStatus.missingVirtualTour).length,
    floorPlanOnly: visible.filter((m) => m.media.mediaTier === "floor-plan-only").length,
    minimalOrBare: visible.filter((m) => ["minimal", "bare"].includes(m.media.mediaTier)).length,
    noLocalFolder: noFolder,
    noChampionUrl: visible.filter((m) => !m.sourceUrl).map((m) => m.name),
    possibleUrlMismatch: visible
      .filter((m) => m.profileStatus.possibleUrlMismatch)
      .map((m) => ({ name: m.name, folder: m.media.localGalleryFolder, quality: m._meta.matchQuality })),
    duplicateNames,
    orphanGalleryFolders: orphanFolders,
    models: visible.map((m) => ({
      id: m.id,
      name: m.name,
      series: m.series,
      mediaTier: m.media.mediaTier,
      mediaTierLabel: TIER_LABEL[m.media.mediaTier],
      mediaScore: m.media.mediaScore,
      photos: m.media.photos.length,
      hasFloorPlan: m.media.hasFloorPlan,
      hasVirtualTour: m.media.hasVirtualTour,
      hasVideo: m.media.hasVideo,
      sourceUrl: m.sourceUrl,
      warnings: m.profileStatus.notes,
      missing: [
        m.profileStatus.missingPhotos && "photos",
        m.profileStatus.missingFloorPlan && "floor plan",
        m.profileStatus.missingVirtualTour && "3D tour",
        m.profileStatus.missingSpecs && "specs",
      ].filter(Boolean),
    })),
  };
  fs.writeFileSync(OUT_AUDIT, JSON.stringify(audit, null, 2));

  /* ----------------------------------------------------------- console ---- */
  console.log(`Built ${visible.length} models (${rows.length} from sheet, ${orphanFolders.length} gallery-only).`);
  console.log(`Gallery folders scanned: ${folders.length}; unmatched sheet rows: ${noFolder.length}.`);
  console.log("Tier breakdown:", tierCounts);
  console.log(`Wrote ${path.relative(ROOT, OUT_DATA)} and ${path.relative(ROOT, OUT_AUDIT)}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
