import fs from "fs/promises";
import { chromium } from "playwright";
import { models } from "../src/data/models.js";

const targetName = process.argv.slice(2).join(" ") || "Stagg";
const reportPath = new URL("./model-asset-audit-report.json", import.meta.url);

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function cleanUrl(url) {
  return String(url || "").split("?")[0].trim();
}

function getManufacturerUrl(home) {
  return home.manufacturerUrl || home.url || home.modelUrl || "";
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function clickIfExists(page, label) {
  const pattern = new RegExp(label, "i");

  const locators = [
    page.getByRole("tab", { name: pattern }).first(),
    page.getByRole("button", { name: pattern }).first(),
    page.getByRole("link", { name: pattern }).first(),
    page.getByText(pattern).first(),
  ];

  for (const locator of locators) {
    try {
      if ((await locator.count()) > 0) {
        await locator.click({ timeout: 4000 });
        await wait(1200);
        return true;
      }
    } catch {}
  }

  return false;
}

async function collectAssets(page, source) {
  return await page.evaluate((source) => {
    function absUrl(value) {
      try {
        return new URL(value, window.location.href).href;
      } catch {
        return "";
      }
    }

    function parentText(element) {
      let current = element;
      let text = "";

      for (let i = 0; i < 5 && current; i++) {
        text += " " + (current.textContent || "");
        text += " " + (current.getAttribute?.("aria-label") || "");
        text += " " + (current.getAttribute?.("title") || "");
        text += " " + (typeof current.className === "string" ? current.className : "");
        current = current.parentElement;
      }

      return text.trim().replace(/\s+/g, " ").slice(0, 400);
    }

    const assets = [];

    document.querySelectorAll("img").forEach((img) => {
      const rect = img.getBoundingClientRect();

      const urls = [
        img.currentSrc,
        img.src,
        img.getAttribute("data-src"),
        img.getAttribute("data-lazy-src"),
        img.getAttribute("data-original"),
      ].filter(Boolean);

      urls.forEach((url) => {
        assets.push({
          type: "image",
          source,
          url: absUrl(url),
          alt: img.alt || "",
          title: img.title || "",
          text: parentText(img),
          width: Math.round(rect.width || img.naturalWidth || 0),
          height: Math.round(rect.height || img.naturalHeight || 0),
        });
      });
    });

    document.querySelectorAll("a").forEach((link) => {
      const href = absUrl(link.getAttribute("href") || "");
      if (!href) return;

      assets.push({
        type: "link",
        source,
        url: href,
        alt: "",
        title: link.title || "",
        text: (link.textContent || "").trim().replace(/\s+/g, " ").slice(0, 400),
        width: 0,
        height: 0,
      });
    });

    document.querySelectorAll("iframe").forEach((frame) => {
      const src = absUrl(frame.getAttribute("src") || "");
      if (!src) return;

      assets.push({
        type: "iframe",
        source,
        url: src,
        alt: "",
        title: frame.title || "",
        text: parentText(frame),
        width: 0,
        height: 0,
      });
    });

    return assets;
  }, source);
}

function classify(asset) {
  const text = `
    ${asset.url}
    ${asset.alt}
    ${asset.title}
    ${asset.text}
    ${asset.source}
  `.toLowerCase();

  const floorPlanWords = [
    "floor plan",
    "floorplan",
    "floor-plan",
    "floor_plan",
    "standard",
    "plan",
  ];

  const tourWords = [
    "virtual",
    "3d",
    "tour",
    "matterport",
    "kuula",
    "iframe",
    "walkthrough",
  ];

  const photoWords = [
    "photo",
    "gallery",
    "exterior",
    "elevation",
    "kitchen",
    "bedroom",
    "bath",
    "living",
    "interior",
  ];

  return {
    ...asset,
    isFloorPlan: floorPlanWords.some((word) => text.includes(word)),
    isVirtualTour: tourWords.some((word) => text.includes(word)),
    isPhoto: photoWords.some((word) => text.includes(word)),
  };
}

function dedupe(items) {
  const seen = new Set();

  return items.filter((item) => {
    const key = `${item.type}-${cleanUrl(item.url)}`;
    if (!item.url || seen.has(key)) return false;
    seen.add(key);
    item.url = cleanUrl(item.url);
    return true;
  });
}

const targetModel =
  models.find((home) => normalizeName(home.name) === normalizeName(targetName)) ||
  models.find((home) => normalizeName(home.name).includes(normalizeName(targetName)));

if (!targetModel) {
  console.log(`Could not find model: ${targetName}`);
  process.exit(1);
}

const manufacturerUrl = getManufacturerUrl(targetModel);

if (!manufacturerUrl) {
  console.log(`Model found, but no manufacturerUrl exists for: ${targetModel.name}`);
  process.exit(1);
}

console.log(`Auditing: ${targetModel.name}`);
console.log(`URL: ${manufacturerUrl}`);

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

const assets = [];

await page.goto(manufacturerUrl, {
  waitUntil: "domcontentloaded",
  timeout: 60000,
});

await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
await page.mouse.wheel(0, 900);
await wait(1000);

assets.push(...(await collectAssets(page, "initial-page")));

for (const label of ["Photos", "Gallery", "Elevations", "Floor Plans", "Floor Plan", "Virtual Tour", "3D Tour", "Tour"]) {
  const clicked = await clickIfExists(page, label);

  if (clicked) {
    console.log(`Clicked section: ${label}`);
    assets.push(...(await collectAssets(page, label)));
  }
}

await browser.close();

const usefulAssets = dedupe(assets)
  .filter((asset) => {
    const lower = asset.url.toLowerCase();

    return (
      !lower.includes("logo") &&
      !lower.includes("favicon") &&
      !lower.includes("icon") &&
      !lower.includes("facebook") &&
      !lower.includes("instagram") &&
      !lower.includes("twitter") &&
      !lower.includes("linkedin")
    );
  })
  .map(classify);

const photoCandidates = usefulAssets.filter(
  (asset) => asset.type === "image" && asset.isPhoto && !asset.isFloorPlan
);

const floorPlanCandidates = usefulAssets.filter((asset) => asset.isFloorPlan);

const virtualTourCandidates = usefulAssets.filter(
  (asset) => asset.isVirtualTour && ["link", "iframe"].includes(asset.type)
);

const report = {
  model: targetModel.name,
  manufacturerUrl,
  summary: {
    totalUsefulAssets: usefulAssets.length,
    photoCandidates: photoCandidates.length,
    floorPlanCandidates: floorPlanCandidates.length,
    virtualTourCandidates: virtualTourCandidates.length,
  },
  recommended: {
    firstPhoto: photoCandidates[0] || null,
    firstFloorPlan: floorPlanCandidates[0] || null,
    firstVirtualTour: virtualTourCandidates[0] || null,
  },
  photoCandidates,
  floorPlanCandidates,
  virtualTourCandidates,
  allUsefulAssets: usefulAssets,
};

await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

console.log("");
console.log("Audit complete.");
console.log(`Photos found: ${photoCandidates.length}`);
console.log(`Floor plans found: ${floorPlanCandidates.length}`);
console.log(`Virtual tours found: ${virtualTourCandidates.length}`);
console.log("Created scripts/model-asset-audit-report.json");

if (report.recommended.firstFloorPlan) {
  console.log("");
  console.log("First floor plan candidate:");
  console.log(report.recommended.firstFloorPlan.url);
}

if (report.recommended.firstVirtualTour) {
  console.log("");
  console.log("First virtual tour candidate:");
  console.log(report.recommended.firstVirtualTour.url);
}