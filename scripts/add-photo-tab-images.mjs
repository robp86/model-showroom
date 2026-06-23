import fs from "fs/promises";
import { chromium } from "playwright";
import { models } from "../src/data/models.js";

const outputPath = new URL("../src/data/models.js", import.meta.url);
const missingOutputPath = new URL("./missing-images.json", import.meta.url);
const reportOutputPath = new URL("./photo-tab-image-report.json", import.meta.url);

const FILL_MISSING_ONLY = true;
const AVOID_DUPLICATE_IMAGES = true;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function cleanImageUrl(url) {
  return String(url || "").split("?")[0].trim();
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

function getNameParts(home) {
  return slugify(home.name)
    .split("-")
    .filter((part) => part.length >= 3);
}

function isImageUrl(url) {
  const lower = url.toLowerCase();

  return (
    lower.includes("s7d9.scene7.com/is/image/championhomes") ||
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".png") ||
    lower.includes(".webp")
  );
}

function looksLikeFloorPlanText(text) {
  const lower = String(text || "").toLowerCase();

  const floorPlanWords = [
    "floor plan",
    "floorplan",
    "floor-plan",
    "floor_plan",
    "view floor",
    "download floor",
    "plan view",
  ];

  return floorPlanWords.some((word) => lower.includes(word));
}

function isBlockedAsset(item) {
  const text = `
    ${item.url || ""}
    ${item.alt || ""}
    ${item.className || ""}
    ${item.parentText || ""}
    ${item.source || ""}
  `.toLowerCase();

  const blockedWords = [
    "logo",
    "icon",
    "favicon",
    "calculator",
    "youtube",
    "vimeo",
    "video",
    "pdf",
    "sprite",
    "placeholder",
    "dealer",
    "map",
    "facebook",
    "instagram",
    "twitter",
    "linkedin",
  ];

  if (blockedWords.some((word) => text.includes(word))) {
    return true;
  }

  if (looksLikeFloorPlanText(text)) {
    return true;
  }

  return false;
}

function scoreImage(item, home) {
  const url = String(item.url || "").toLowerCase();
  const alt = String(item.alt || "").toLowerCase();
  const className = String(item.className || "").toLowerCase();
  const parentText = String(item.parentText || "").toLowerCase();
  const combined = `${url} ${alt} ${className} ${parentText}`;

  const modelSlug = slugify(home.name);
  const nameParts = getNameParts(home);

  let score = 0;

  // Prefer large visible photos.
  if (item.width >= 250) score += 20;
  if (item.height >= 160) score += 20;
  if (item.width >= 500) score += 20;
  if (item.height >= 300) score += 20;

  // Strong model match.
  if (combined.includes(modelSlug)) score += 100;

  const matchedParts = nameParts.filter((part) => combined.includes(part));
  score += matchedParts.length * 25;

  // Best card/header signals.
  if (combined.includes("exterior")) score += 100;
  if (combined.includes("elevation")) score += 90;
  if (combined.includes("front")) score += 75;
  if (combined.includes("hero")) score += 60;
  if (combined.includes("main")) score += 50;
  if (combined.includes("photo")) score += 40;
  if (combined.includes("gallery")) score += 35;

  // Interior photos are allowed, but less ideal.
  if (combined.includes("kitchen")) score -= 5;
  if (combined.includes("bath")) score -= 15;
  if (combined.includes("bedroom")) score -= 15;
  if (combined.includes("laundry")) score -= 15;
  if (combined.includes("closet")) score -= 15;

  // Hard penalty for anything that smells like a floor plan.
  if (looksLikeFloorPlanText(combined)) score -= 500;

  return score;
}

async function tryClickTab(page, label) {
  const patterns = [
    new RegExp(`^${label}$`, "i"),
    new RegExp(label, "i"),
  ];

  for (const pattern of patterns) {
    try {
      const button = page.getByRole("button", { name: pattern }).first();
      if (await button.count()) {
        await button.click({ timeout: 3000 });
        await wait(1000);
        return true;
      }
    } catch {}

    try {
      const tab = page.getByRole("tab", { name: pattern }).first();
      if (await tab.count()) {
        await tab.click({ timeout: 3000 });
        await wait(1000);
        return true;
      }
    } catch {}

    try {
      const link = page.getByRole("link", { name: pattern }).first();
      if (await link.count()) {
        await link.click({ timeout: 3000 });
        await wait(1000);
        return true;
      }
    } catch {}

    try {
      const text = page.getByText(pattern).first();
      if (await text.count()) {
        await text.click({ timeout: 3000 });
        await wait(1000);
        return true;
      }
    } catch {}
  }

  return false;
}

async function collectVisibleImages(page, sourceLabel) {
  return await page.evaluate((sourceLabel) => {
    function absUrl(url) {
      try {
        return new URL(url, window.location.href).href;
      } catch {
        return "";
      }
    }

    function getSrcsetUrls(srcset) {
      if (!srcset) return [];

      return srcset
        .split(",")
        .map((part) => part.trim().split(/\s+/)[0])
        .filter(Boolean)
        .map(absUrl);
    }

    function getUsefulParentText(element) {
      let current = element;
      let text = "";

      for (let i = 0; i < 5 && current; i++) {
        const aria = current.getAttribute?.("aria-label") || "";
        const title = current.getAttribute?.("title") || "";
        const className =
          typeof current.className === "string" ? current.className : "";

        text += ` ${aria} ${title} ${className}`;

        current = current.parentElement;
      }

      return text.trim();
    }

    const images = [];

    document.querySelectorAll("img").forEach((img) => {
      const rect = img.getBoundingClientRect();

      const isVisible =
        rect.width > 100 &&
        rect.height > 80 &&
        rect.bottom > 0 &&
        rect.right > 0 &&
        rect.top < window.innerHeight * 2;

      if (!isVisible) return;

      const urls = [
        img.currentSrc,
        img.src,
        img.getAttribute("data-src"),
        img.getAttribute("data-lazy-src"),
        img.getAttribute("data-original"),
        ...getSrcsetUrls(img.getAttribute("srcset")),
      ]
        .filter(Boolean)
        .map(absUrl);

      urls.forEach((url) => {
        images.push({
          url,
          alt: img.alt || "",
          className: typeof img.className === "string" ? img.className : "",
          parentText: getUsefulParentText(img),
          width: Math.round(rect.width || img.naturalWidth || 0),
          height: Math.round(rect.height || img.naturalHeight || 0),
          source: sourceLabel,
        });
      });
    });

    return images;
  }, sourceLabel);
}

async function getPhotoTabImageForModel(page, home, usedImages) {
  const manufacturerUrl = getManufacturerUrl(home);

  if (!manufacturerUrl) {
    console.log(`Skipped ${home.name}: no manufacturer URL`);
    return null;
  }

  try {
    await page.goto(manufacturerUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });

    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

    // Move down the page so lazy sections start loading.
    await page.mouse.wheel(0, 800);
    await wait(800);

    const collected = [];

    // Important: do not click Floor Plans.
    const clickedPhotos = await tryClickTab(page, "Photos");
    if (clickedPhotos) {
      collected.push(...(await collectVisibleImages(page, "photos-tab")));
    }

    const clickedElevations = await tryClickTab(page, "Elevations");
    if (clickedElevations) {
      collected.push(...(await collectVisibleImages(page, "elevations-tab")));
    }

    // If tabs were not clickable, collect visible page images as fallback,
    // but still reject floor-plan-like items.
    if (!clickedPhotos && !clickedElevations) {
      collected.push(...(await collectVisibleImages(page, "visible-page")));
    }

    const uniqueImages = [];
    const seen = new Set();

    for (const item of collected) {
      const url = cleanImageUrl(item.url);

      if (!url) continue;
      if (!isImageUrl(url)) continue;
      if (isBlockedAsset({ ...item, url })) continue;
      if (AVOID_DUPLICATE_IMAGES && usedImages.has(url)) continue;
      if (seen.has(url)) continue;

      seen.add(url);

      uniqueImages.push({
        ...item,
        url,
      });
    }

    const scoredImages = uniqueImages
      .map((item) => ({
        ...item,
        score: scoreImage(item, home),
      }))
      .filter((item) => item.score >= 35)
      .sort((a, b) => b.score - a.score);

    const best = scoredImages[0];

    if (best) {
      console.log(`Found photo-tab image for ${home.name}: ${best.url}`);
      return best;
    }

    console.log(`No photo-tab image found for ${home.name}`);
    return null;
  } catch (error) {
    console.log(`Skipped ${home.name}: ${error.message}`);
    return null;
  }
}

const browser = await chromium.launch({
  headless: true,
});

const page = await browser.newPage({
  viewport: { width: 1440, height: 1200 },
});

const usedImages = new Set(
  models
    .map((home) => cleanImageUrl(home.image))
    .filter((image) => image.startsWith("http"))
);

const updatedModels = [];
const missingImages = [];
const report = [];

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

  const result = await getPhotoTabImageForModel(page, home, usedImages);
  const image = result?.url || "";

  if (image) {
    usedImages.add(image);

    report.push({
      name: home.name,
      image,
      score: result.score,
      source: result.source,
      width: result.width,
      height: result.height,
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

await browser.close();

const fileContent = `// Auto-generated model inventory
// Existing images are preserved.
// Missing images were filled from Photos/Elevations tabs only.
// Floor-plan-like images are rejected.

export const models = ${JSON.stringify(updatedModels, null, 2)};
`;

await fs.writeFile(outputPath, fileContent, "utf8");
await fs.writeFile(missingOutputPath, JSON.stringify(missingImages, null, 2), "utf8");
await fs.writeFile(reportOutputPath, JSON.stringify(report, null, 2), "utf8");

const foundCount = updatedModels.filter((home) => home.image).length;

console.log("");
console.log(`Done. Models with images: ${foundCount} of ${models.length}.`);
console.log(`Still missing images: ${missingImages.length}.`);
console.log(`Photo-tab images added this run: ${report.length}.`);
console.log("Updated src/data/models.js");
console.log("Updated scripts/missing-images.json");
console.log("Created scripts/photo-tab-image-report.json");