import fs from "fs/promises";
import { models } from "../src/data/models.js";

const outputPath = new URL("../src/data/models.js", import.meta.url);
const missingOutputPath = new URL("./missing-images.json", import.meta.url);

const FILL_MISSING_ONLY = true;
const AVOID_DUPLICATE_IMAGES = true;
const ALLOW_MODEL_SPECIFIC_INTERIORS = true;

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

function imageMatchesModel(url, home) {
  const lower = url.toLowerCase();
  const modelSlug = slugify(home.name);

  if (lower.includes(modelSlug)) {
    return true;
  }

  const importantParts = modelSlug
    .split("-")
    .filter((part) => part.length >= 3);

  return importantParts.length > 0 && importantParts.every((part) => lower.includes(part));
}

function getImageUrlsFromHtml(html) {
  const matches =
    html.match(/https:\/\/s7d9\.scene7\.com\/is\/image\/championhomes\/[^"'\\\s<)]+/g) || [];

  return [...new Set(matches.map(cleanImageUrl))];
}

function isBlockedAsset(url) {
  const lower = url.toLowerCase();

  const blockedWords = [
    "logo",
    "icon",
    "favicon",
    "calculator",
    "video",
    "floorplan",
    "floor-plan",
    "floor_plan",
    "floor",
    "plan",
    "pdf",
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
  let score = 0;

  if (imageMatchesModel(url, home)) score += 100;

  if (lower.includes("exterior")) score += 90;
  if (lower.includes("elevation")) score += 90;
  if (lower.includes("front")) score += 60;
  if (lower.includes("hero")) score += 45;
  if (lower.includes("main")) score += 35;

  if (isInteriorImage(url)) score -= 25;

  return score;
}

function findBestImage(html, home, usedImages) {
  const urls = getImageUrlsFromHtml(html);

  const candidates = urls
    .filter((url) => !isBlockedAsset(url))
    .filter((url) => imageMatchesModel(url, home))
    .filter((url) => {
      if (!AVOID_DUPLICATE_IMAGES) return true;
      return !usedImages.has(url);
    });

  const exteriorCandidates = candidates
    .filter((url) => {
      const lower = url.toLowerCase();
      return (
        lower.includes("exterior") ||
        lower.includes("elevation") ||
        lower.includes("front") ||
        lower.includes("hero") ||
        lower.includes("main")
      );
    })
    .sort((a, b) => scoreImage(b, home) - scoreImage(a, home));

  if (exteriorCandidates.length > 0) {
    return exteriorCandidates[0];
  }

  if (ALLOW_MODEL_SPECIFIC_INTERIORS) {
    const fallbackCandidates = candidates.sort(
      (a, b) => scoreImage(b, home) - scoreImage(a, home)
    );

    if (fallbackCandidates.length > 0) {
      return fallbackCandidates[0];
    }
  }

  return "";
}

async function getImageForModel(home, usedImages) {
  const manufacturerUrl = getManufacturerUrl(home);

  if (!manufacturerUrl) {
    console.log(`Skipped ${home.name}: no manufacturer URL`);
    return "";
  }

  try {
    const response = await fetch(manufacturerUrl);

    if (!response.ok) {
      console.log(`Skipped ${home.name}: page returned ${response.status}`);
      return "";
    }

    const html = await response.text();
    const image = findBestImage(html, home, usedImages);

    if (image) {
      console.log(`Found image for ${home.name}: ${image}`);
    } else {
      console.log(`No usable image found for ${home.name}`);
    }

    return image;
  } catch (error) {
    console.log(`Skipped ${home.name}: ${error.message}`);
    return "";
  }
}

const usedImages = new Set(
  models
    .map((home) => cleanImageUrl(home.image))
    .filter((image) => image.startsWith("http"))
);

const updatedModels = [];
const missingImages = [];

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

  const image = await getImageForModel(home, usedImages);

  if (image) {
    usedImages.add(image);
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
// Missing images are filled only when a model-matching image is found.

export const models = ${JSON.stringify(updatedModels, null, 2)};
`;

await fs.writeFile(outputPath, fileContent, "utf8");
await fs.writeFile(missingOutputPath, JSON.stringify(missingImages, null, 2), "utf8");

const foundCount = updatedModels.filter((home) => home.image).length;

console.log("");
console.log(`Done. Models with images: ${foundCount} of ${models.length}.`);
console.log(`Still missing images: ${missingImages.length}.`);
console.log("Updated src/data/models.js");
console.log("Created scripts/missing-images.json");