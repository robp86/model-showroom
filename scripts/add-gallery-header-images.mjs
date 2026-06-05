import fs from "fs/promises";
import { models } from "../src/data/models.js";

const outputPath = new URL("../src/data/models.js", import.meta.url);
const missingOutputPath = new URL("./missing-images.json", import.meta.url);
const reportOutputPath = new URL("./gallery-header-image-report.json", import.meta.url);

const FILL_MISSING_ONLY = true;
const AVOID_DUPLICATE_IMAGES = true;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function cleanImageUrl(url) {
  return String(url || "").split("?")[0].trim();
}

function getManufacturerUrl(home) {
  return (
    home.manufacturerUrl ||
    home.url ||
    home.imageUrl ||
    home.modelUrl ||
    ""
  );
}

function getModelNameParts(home) {
  return slugify(home.name)
    .split("-")
    .filter((part) => part.length >= 3);
}

function getImageUrlsFromHtml(html) {
  const scene7Matches =
    html.match(/https:\/\/s7d9\.scene7\.com\/is\/image\/championhomes\/[^"'\\\s<)]+/g) || [];

  const normalImageMatches =
    html.match(/https?:\/\/[^"'\\\s<)]+\.(jpg|jpeg|png|webp)[^"'\\\s<)]*/gi) || [];

  return [...new Set([...scene7Matches, ...normalImageMatches].map(cleanImageUrl))];
}

function isBlockedAsset(url) {
  const lower = url.toLowerCase();

  const blockedWords = [
    "logo",
    "icon",
    "favicon",
    "calculator",
    "video",
    "youtube",
    "vimeo",
    "floorplan",
    "floor-plan",
    "floor_plan",
    "floor",
    "plan",
    "pdf",
    "sprite",
    "placeholder",
    "dealer",
    "map",
  ];

  return blockedWords.some((word) => lower.includes(word));
}

function isInteriorImage(url) {
  const lower = url.toLowerCase();

  const interiorWords = [
    "kitchen",
    "bath",
    "bathroom",
    "bedroom",
    "interior",
    "living",
    "utility",
    "laundry",
    "closet",
    "dining",
    "family-room",
    "familyroom",
  ];

  return interiorWords.some((word) => lower.includes(word));
}

function matchesModelName(url, home) {
  const lower = url.toLowerCase();
  const modelSlug = slugify(home.name);
  const parts = getModelNameParts(home);

  if (lower.includes(modelSlug)) {
    return true;
  }

  const matchedParts = parts.filter((part) => lower.includes(part));

  // Require at least one useful piece of the model name.
  // This keeps us from grabbing random shared page images.
  return matchedParts.length >= 1;
}

function scoreGalleryImage(url, home) {
  const lower = url.toLowerCase();
  const modelSlug = slugify(home.name);
  const parts = getModelNameParts(home);

  let score = 0;

  if (lower.includes(modelSlug)) score += 150;

  const matchedParts = parts.filter((part) => lower.includes(part));
  score += matchedParts.length * 40;

  // Best header/card image signals
  if (lower.includes("exterior")) score += 120;
  if (lower.includes("elevation")) score += 120;
  if (lower.includes("front")) score += 90;
  if (lower.includes("hero")) score += 70;
  if (lower.includes("main")) score += 60;
  if (lower.includes("gallery")) score += 45;
  if (lower.includes("photo")) score += 35;

  // Acceptable but less ideal
  if (isInteriorImage(url)) score += 5;

  // Penalize common interior-only words
  if (lower.includes("kitchen")) score -= 15;
  if (lower.includes("bath")) score -= 25;
  if (lower.includes("bedroom")) score -= 25;
  if (lower.includes("laundry")) score -= 20;

  return score;
}

function findGalleryHeaderImage(html, home, usedImages) {
  const urls = getImageUrlsFromHtml(html);

  const candidates = urls
    .filter((url) => !isBlockedAsset(url))
    .filter((url) => matchesModelName(url, home))
    .filter((url) => {
      if (!AVOID_DUPLICATE_IMAGES) return true;
      return !usedImages.has(url);
    })
    .map((url) => ({
      url,
      score: scoreGalleryImage(url, home),
    }))
    .sort((a, b) => b.score - a.score);

  const bestExterior = candidates.find((candidate) => {
    const lower = candidate.url.toLowerCase();

    return (
      lower.includes("exterior") ||
      lower.includes("elevation") ||
      lower.includes("front") ||
      lower.includes("hero") ||
      lower.includes("main")
    );
  });

  if (bestExterior && bestExterior.score >= 70) {
    return bestExterior;
  }

  const bestFallback = candidates[0];

  if (bestFallback && bestFallback.score >= 40) {
    return bestFallback;
  }

  return null;
}

async function getGalleryHeaderImageForModel(home, usedImages) {
  const manufacturerUrl = getManufacturerUrl(home);

  if (!manufacturerUrl) {
    console.log(`Skipped ${home.name}: no manufacturer URL`);
    return null;
  }

  try {
    const response = await fetch(manufacturerUrl);

    if (!response.ok) {
      console.log(`Skipped ${home.name}: page returned ${response.status}`);
      return null;
    }

    const html = await response.text();
    const result = findGalleryHeaderImage(html, home, usedImages);

    if (result?.url) {
      console.log(`Found gallery header for ${home.name}: ${result.url}`);
      return result;
    }

    console.log(`No gallery header found for ${home.name}`);
    return null;
  } catch (error) {
    console.log(`Skipped ${home.name}: ${error.message}`);
    return null;
  }
}

const usedImages = new Set(
  models
    .map((home) => cleanImageUrl(home.image))
    .filter((image) => image.startsWith("http"))
);

const updatedModels = [];
const missingImages = [];
const galleryReport = [];

for (let index = 0; index < models.length; index++) {
  const home = models[index];
  const existingImage = cleanImageUrl(home.image);

  console.log(`Checking ${index + 1}/${models.length}: ${home.name}`);

  if (FILL_MISSING_ONLY && existingImage) {
    console.log(`Keeping existing image for ${home.name}`);

    updatedModels.push({
      ...home,
      image: existingImage,
    });

    usedImages.add(existingImage);
    continue;
  }

  const result = await getGalleryHeaderImageForModel(home, usedImages);
  const image = result?.url || "";

  if (image) {
    usedImages.add(image);

    galleryReport.push({
      name: home.name,
      image,
      score: result.score,
      manufacturerUrl: getManufacturerUrl(home),
    });
  } else {
    missingImages.push({
      name: home.name,
      bedrooms: home.bedrooms,
      bathrooms: home.bathrooms,
      sqft: home.sqft,
      manufacturerUrl: getManufacturerUrl(home),
    });
  }

  updatedModels.push({
    ...home,
    image,
  });

  await wait(300);
}

const fileContent = `// Auto-generated model inventory
// Existing images are preserved.
// Missing images were filled from model gallery/header image candidates.

export const models = ${JSON.stringify(updatedModels, null, 2)};
`;

await fs.writeFile(outputPath, fileContent, "utf8");
await fs.writeFile(missingOutputPath, JSON.stringify(missingImages, null, 2), "utf8");
await fs.writeFile(reportOutputPath, JSON.stringify(galleryReport, null, 2), "utf8");

const foundCount = updatedModels.filter((home) => home.image).length;

console.log("");
console.log(`Done. Models with images: ${foundCount} of ${models.length}.`);
console.log(`Still missing images: ${missingImages.length}.`);
console.log(`Gallery header images added this run: ${galleryReport.length}.`);
console.log("Updated src/data/models.js");
console.log("Updated scripts/missing-images.json");
console.log("Created scripts/gallery-header-image-report.json");