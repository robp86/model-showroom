import fs from "fs/promises";
import { chromium } from "playwright";
import { models } from "../src/data/models.js";

const outputPath = new URL("../src/data/models.js", import.meta.url);
const missingOutputPath = new URL("./missing-images.json", import.meta.url);
const reportOutputPath = new URL("./rendered-gallery-image-report.json", import.meta.url);

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

function isBlockedAsset(item) {
  const text = `${item.url} ${item.alt || ""} ${item.className || ""}`.toLowerCase();

  const blockedWords = [
    "logo",
    "icon",
    "favicon",
    "calculator",
    "youtube",
    "vimeo",
    "video",
    "floorplan",
    "floor-plan",
    "floor_plan",
    "floor plan",
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

  return blockedWords.some((word) => text.includes(word));
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

function scoreImage(item, home) {
  const url = item.url.toLowerCase();
  const alt = String(item.alt || "").toLowerCase();
  const className = String(item.className || "").toLowerCase();
  const combined = `${url} ${alt} ${className}`;

  const modelSlug = slugify(home.name);
  const nameParts = getNameParts(home);

  let score = 0;

  // Big visible images are more likely to be gallery/header images.
  if (item.width >= 300) score += 25;
  if (item.height >= 180) score += 25;
  if (item.width >= 600) score += 20;
  if (item.height >= 350) score += 20;

  // If URL/alt/class includes the exact model name, that's excellent.
  if (combined.includes(modelSlug)) score += 120;

  // Partial model-name matches help.
  const matchedParts = nameParts.filter((part) => combined.includes(part));
  score += matchedParts.length * 25;

  // Prefer exterior/header-like images.
  if (combined.includes("exterior")) score += 100;
  if (combined.includes("elevation")) score += 100;
  if (combined.includes("front")) score += 80;
  if (combined.includes("hero")) score += 70;
  if (combined.includes("main")) score += 55;
  if (combined.includes("gallery")) score += 45;
  if (combined.includes("photo")) score += 30;

  // Interior is acceptable only if that's all the page gives us.
  if (combined.includes("kitchen")) score -= 10;
  if (combined.includes("bath")) score -= 20;
  if (combined.includes("bedroom")) score -= 20;
  if (combined.includes("laundry")) score -= 20;
  if (combined.includes("closet")) score -= 20;

  return score;
}

async function collectRenderedImages(page) {
  return await page.evaluate(() => {
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

    const images = [];

    document.querySelectorAll("img").forEach((img) => {
      const rect = img.getBoundingClientRect();

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
          className: img.className || "",
          width: Math.round(rect.width || img.naturalWidth || 0),
          height: Math.round(rect.height || img.naturalHeight || 0),
          source: "img",
        });
      });
    });

    document.querySelectorAll("source").forEach((source) => {
      getSrcsetUrls(source.getAttribute("srcset")).forEach((url) => {
        images.push({
          url,
          alt: "",
          className: source.className || "",
          width: 0,
          height: 0,
          source: "source-srcset",
        });
      });
    });

    document.querySelectorAll("*").forEach((element) => {
      const style = window.getComputedStyle(element);
      const backgroundImage = style.backgroundImage || "";

      const matches = [...backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g)];

      matches.forEach((match) => {
        const rect = element.getBoundingClientRect();

        images.push({
          url: absUrl(match[1]),
          alt: element.getAttribute("aria-label") || "",
          className: element.className || "",
          width: Math.round(rect.width || 0),
          height: Math.round(rect.height || 0),
          source: "background-image",
        });
      });
    });

    return images;
  });
}

async function getRenderedImageForModel(page, home, usedImages) {
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

    // Scroll so lazy-loaded gallery/header images have a chance to appear.
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 500;

        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= document.body.scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 150);
      });
    });

    await wait(1000);

    const rawImages = await collectRenderedImages(page);

    const uniqueImages = [];
    const seen = new Set();

    for (const item of rawImages) {
      const url = cleanImageUrl(item.url);

      if (!url) continue;
      if (!isImageUrl(url)) continue;
      if (isBlockedAsset(item)) continue;
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
      .sort((a, b) => b.score - a.score);

    const best = scoredImages[0];

    if (best && best.score >= 40) {
      console.log(`Found rendered image for ${home.name}: ${best.url}`);
      return best;
    }

    console.log(`No rendered image found for ${home.name}`);
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
const renderedReport = [];

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

  const result = await getRenderedImageForModel(page, home, usedImages);
  const image = result?.url || "";

  if (image) {
    usedImages.add(image);

    renderedReport.push({
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
// Missing images were filled using rendered Champion model pages with Playwright.

export const models = ${JSON.stringify(updatedModels, null, 2)};
`;

await fs.writeFile(outputPath, fileContent, "utf8");
await fs.writeFile(missingOutputPath, JSON.stringify(missingImages, null, 2), "utf8");
await fs.writeFile(reportOutputPath, JSON.stringify(renderedReport, null, 2), "utf8");

const foundCount = updatedModels.filter((home) => home.image).length;

console.log("");
console.log(`Done. Models with images: ${foundCount} of ${models.length}.`);
console.log(`Still missing images: ${missingImages.length}.`);
console.log(`Rendered images added this run: ${renderedReport.length}.`);
console.log("Updated src/data/models.js");
console.log("Updated scripts/missing-images.json");
console.log("Created scripts/rendered-gallery-image-report.json");