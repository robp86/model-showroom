import fs from "fs/promises";
import { models } from "../src/data/models.js";

const outputPath = new URL("../src/data/models.js", import.meta.url);
const missingOutputPath = new URL("./missing-images.json", import.meta.url);
const reportOutputPath = new URL("./loose-image-report.json", import.meta.url);

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

function getManufacturerUrl(home) {
  return (
    home.manufacturerUrl ||
    home.url ||
    home.imageUrl ||
    home.modelUrl ||
    ""
  );
}

function cleanImageUrl(url) {
  return String(url || "").split("?")[0].trim();
}

function getNameParts(home) {
  return slugify(home.name)
    .split("-")
    .filter((part) => part.length >= 3);
}

function hasLooseNameMatch(url, home) {
  const lower = url.toLowerCase();
  const parts = getNameParts(home);

  if (parts.length === 0) return false;

  const exactSlug = slugify(home.name);

  if (lower.includes(exactSlug)) {
    return true;
  }

  const matchedParts = parts.filter((part) => lower.includes(part));

  // Looser rule:
  // If the image URL matches at least one strong piece of the model name,
  // we allow it as a candidate.
  return matchedParts.length >= 1;
}

function getImageUrlsFromHtml(html) {
  const scene7Matches =
    html.match(/https:\/\/s7d9\.scene7\.com\/is\/image\/championhomes\/[^"'\\\s<)]+/g) || [];

  const metaMatches =
    html.match(/https?:\/\/[^"'\\\s<)]+\.(jpg|jpeg|png|webp)[^"'\\\s<)]*/gi) || [];

  return [...new Set([...scene7Matches, ...metaMatches].map(cleanImageUrl))];
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
    "floorplan",
    "floor-plan",
    "floor_plan",
    "floor",
    "plan",
    "pdf",
    "sprite",
    "placeholder",
    "dealer",
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
  ];

  return interiorWords.some((word) => lower.includes(word));
}

function scoreImage(url, home) {
  const lower = url.toLowerCase();
  const exactSlug = slugify(home.name);
  const parts = getNameParts(home);

  let score = 0;

  if (lower.includes(exactSlug)) score += 120;

  const matchedParts = parts.filter((part) => lower.includes(part));
  score += matchedParts.length * 35;

  if (lower.includes("exterior")) score += 100;
  if (lower.includes("elevation")) score += 100;
  if (lower.includes("front")) score += 75;
  if (lower.includes("hero")) score += 55;
  if (lower.includes("main")) score += 45;

  if (isInteriorImage(url)) score += 10;

  if (lower.includes("kitchen")) score -= 10;
  if (lower.includes("bath")) score -= 20;
  if (lower.includes("bedroom")) score -= 20;

  return score;
}

function findLooseImage(html, home, usedImages) {
  const urls = getImageUrlsFromHtml(html);

  const candidates = urls
    .filter((url) => !isBlockedAsset(url))
    .filter((url) => hasLooseNameMatch(url, home))
    .filter((url) => {
      if (!AVOID_DUPLICATE_IMAGES) return true;
      return !usedImages.has(url);
    })
    .map((url) => ({
      url,
      score: scoreImage(url, home),
    }))
    .sort((a, b) => b.score - a.score);

  const best = candidates[0];

  // This threshold is intentionally looser than before,
  // but still prevents totally random page images.
  if (best && best.score >= 35) {
    return best;
  }

  return null;
}

async function getImageForModel(home, usedImages) {
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
    const result = findLooseImage(html, home, usedImages);

    if (result?.url) {
      console.log(`Found loose image for ${home.name}: ${result.url}`);
      return result;
    }

    console.log(`No loose image found for ${home.name}`);
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
const looseReport = [];

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

  const result = await getImageForModel(home, usedImages);
  const image = result?.url || "";

  if (image) {
    usedImages.add(image);

    looseReport.push({
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
// Missing images were filled with looser model-name matching.

export const models = ${JSON.stringify(updatedModels, null, 2)};
`;

await fs.writeFile(outputPath, fileContent, "utf8");
await fs.writeFile(missingOutputPath, JSON.stringify(missingImages, null, 2), "utf8");
await fs.writeFile(reportOutputPath, JSON.stringify(looseReport, null, 2), "utf8");

const foundCount = updatedModels.filter((home) => home.image).length;

console.log("");
console.log(`Done. Models with images: ${foundCount} of ${models.length}.`);
console.log(`Still missing images: ${missingImages.length}.`);
console.log(`Loose images added this run: ${looseReport.length}.`);
console.log("Updated src/data/models.js");
console.log("Updated scripts/missing-images.json");
console.log("Created scripts/loose-image-report.json");