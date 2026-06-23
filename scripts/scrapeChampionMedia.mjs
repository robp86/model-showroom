// Champion model-page enrichment scraper (Playwright).
//
//   npm run scrape:champion              # scrape only URLs not already cached
//   node scripts/scrapeChampionMedia.mjs --force        # re-scrape everything
//   node scripts/scrapeChampionMedia.mjs --limit=10     # first 10 (for testing)
//
// Writes src/data/champion-media.generated.json. Then re-run
// `npm run build:data` to merge the enrichment into the model dataset.
//
// Design goals (per project spec):
//   * Never crash on a blocked / missing / slow page — record a status instead.
//   * Be polite: one page at a time, a delay between requests, and cache results
//     so unchanged URLs aren't re-scraped unless --force is passed.
//   * Treat the spreadsheet name as the source of truth; if the Champion page
//     name doesn't match, flag possibleMismatch and keep Champion data as
//     external reference only (we store URLs, we don't bulk-download images).

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { similarity } from "../src/utils/slugify.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CSV_PATH = path.join(ROOT, "data-import", "updated-model-specs.csv");
const OUT_PATH = path.join(ROOT, "src", "data", "champion-media.generated.json");

const args = process.argv.slice(2);
const FORCE = args.includes("--force");
const LIMIT = Number((args.find((a) => a.startsWith("--limit=")) || "").split("=")[1]) || 0;
const DELAY_MS = 2500; // polite delay between requests

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readCsv() {
  const raw = fs.readFileSync(CSV_PATH, "utf8");
  return raw
    .split(/\r?\n/)
    .filter((l) => l.trim())
    .slice(1)
    .map((line) => {
      const parts = line.split(",");
      return { name: (parts[0] || "").trim(), url: (parts.slice(4).join(",") || "").trim() };
    })
    .filter((r) => r.name && /^https?:/i.test(r.url));
}

function loadCache() {
  try {
    if (fs.existsSync(OUT_PATH)) return JSON.parse(fs.readFileSync(OUT_PATH, "utf8"));
  } catch {
    /* ignore corrupt cache */
  }
  return { generatedAt: null, models: [] };
}

// Runs inside the page. Pull whatever we can, defensively.
function extractInPage() {
  const text = document.body ? document.body.innerText : "";
  const lower = text.toLowerCase();
  const pick = (re) => {
    const m = text.match(re);
    return m ? m[1] : "";
  };
  const meta = (prop) => {
    const el =
      document.querySelector(`meta[property="${prop}"]`) ||
      document.querySelector(`meta[name="${prop}"]`);
    return el ? el.getAttribute("content") : "";
  };

  const rawName =
    meta("og:title") || (document.querySelector("h1") || {}).innerText || document.title;
  const name = String(rawName).replace(/\s*[-|]\s*Champion Homes\s*$/i, "").trim();

  const beds = Number(pick(/(\d+(?:\.\d+)?)\s*(?:bed|bedroom|br\b)/i)) || null;
  const baths = Number(pick(/(\d+(?:\.\d+)?)\s*(?:bath|bathroom|ba\b)/i)) || null;
  const sqft =
    Number((pick(/([\d,]{3,6})\s*(?:sq\.?\s*ft|square feet|sqft)/i) || "").replace(/,/g, "")) ||
    null;

  const absUrls = (sel, attr) =>
    [...document.querySelectorAll(sel)]
      .map((el) => el.getAttribute(attr))
      .filter(Boolean)
      .map((u) => {
        try {
          return new URL(u, location.href).href;
        } catch {
          return null;
        }
      })
      .filter(Boolean);

  const uniq = (a) => [...new Set(a)];
  const allImgs = uniq([...absUrls("img", "src"), ...absUrls("img", "data-src")]);

  // Real model photos are scene7 image assets for THIS model and carry no query
  // string. Champion's global nav/marketing images all use `?wid=...&hei=...`.
  const isModelImg = (u) =>
    /s7d9\.scene7\.com\/is\/image\/championhomes\//.test(u) && !u.includes("?");
  const floorPlans = uniq(
    allImgs.filter((u) => isModelImg(u) && /main-image|floor-?plan/i.test(u))
  );
  const photos = uniq(
    allImgs.filter((u) => isModelImg(u) && !/main-image|floor-?plan|-elevation/i.test(u))
  );

  const iframes = absUrls("iframe", "src");
  const links = absUrls("a", "href");
  const virtualTours = uniq(
    [...iframes, ...links].filter((u) => /matterport|kuula|cloudpano/i.test(u))
  ).map((u) => u.replace("show/?", "show?")); // normalize matterport variants
  const videos = uniq(
    [
      ...absUrls("video", "src"),
      ...absUrls("video source", "src"),
      ...iframes.filter((u) => /youtube|youtu\.be|vimeo|wistia/i.test(u)),
    ].filter((u) => !/Homepage_Banner|homepage-banner|banner_1/i.test(u))
  );

  // Tabs / sections present on the page.
  const tabs = {
    photos: /\bphotos?\b/i.test(lower),
    virtualTour: /(virtual tour|3d tour|matterport)/i.test(lower),
    floorPlans: /floor ?plans?/i.test(lower),
    videos: /\bvideos?\b/i.test(lower),
  };

  const availability = {
    inStock: /in[-\s]?stock/i.test(lower),
    readyToTour: /ready to tour/i.test(lower),
    moveInReady: /move[-\s]?in[-\s]?ready/i.test(lower),
    financingAvailable: /financing (available|options)/i.test(lower),
  };

  const FEATURE_HINTS = [
    "Kitchen Island",
    "Porch",
    "Outdoor Living",
    "Utility Room",
    "Walk-in Shower",
    "Walk-in Closet",
    "Fireplace",
    "Endwall Entry",
    "Farmhouse Sink",
    "Pantry",
    "Mud Room",
    "Den",
    "Office",
  ];
  const features = FEATURE_HINTS.filter((f) => lower.includes(f.toLowerCase()));

  const brand =
    (text.match(/\b(Athens Park|Genesis|Titan|Ascend|Embark|Foundation|Regional Homes|Champion)\b/i) || [])[1] ||
    "";

  return {
    name: (name || "").trim(),
    beds,
    baths,
    sqft,
    brand,
    sectionType: /(single[-\s]?section|single[-\s]?wide)/i.test(lower)
      ? "single-wide"
      : /(multi[-\s]?section|triple)/i.test(lower)
      ? "multi-section"
      : /(double[-\s]?section|double[-\s]?wide)/i.test(lower)
      ? "double-wide"
      : "",
    heroImage: photos.find((u) => /exterior/i.test(u)) || photos[0] || meta("og:image") || "",
    photos: photos.slice(0, 40),
    floorPlans: floorPlans.slice(0, 6),
    virtualTours,
    videos,
    tabs,
    availability,
    features,
    photoCount: photos.length,
  };
}

async function scrapeOne(page, row) {
  const base = { name: row.name, sourceUrl: row.url, scrapedAt: new Date().toISOString() };
  try {
    const resp = await page.goto(row.url, { waitUntil: "domcontentloaded", timeout: 45000 });
    const status = resp ? resp.status() : 0;
    if (status === 404) return { ...base, scrapeStatus: "not-found", scrapeError: "HTTP 404" };
    if (status === 403 || status === 429)
      return { ...base, scrapeStatus: "blocked", scrapeError: `HTTP ${status}` };

    await page.waitForTimeout(1500); // let lazy content settle
    const data = await page.evaluate(extractInPage);

    const sim = similarity(row.name, data.name);
    const possibleMismatch = sim < 0.55;

    return {
      ...base,
      scrapeStatus: "success",
      scrapeError: "",
      // Spreadsheet name stays authoritative; Champion data is reference.
      externalName: data.name,
      possibleMismatch,
      mismatchReason: possibleMismatch
        ? `Champion page title "${data.name}" differs from sheet name "${row.name}" (sim ${sim.toFixed(2)}).`
        : "",
      ...data,
    };
  } catch (err) {
    return { ...base, scrapeStatus: "failed", scrapeError: String(err.message || err) };
  }
}

async function main() {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.error("Playwright not installed. Run: npm i -D playwright && npx playwright install chromium");
    process.exit(1);
  }

  const rows = readCsv();
  const cache = loadCache();
  const cached = new Map(cache.models.map((m) => [m.sourceUrl, m]));

  let queue = rows.filter((r) => FORCE || !cached.has(r.url) || cached.get(r.url)?.scrapeStatus !== "success");
  if (LIMIT) queue = queue.slice(0, LIMIT);

  console.log(`Scraping ${queue.length} of ${rows.length} Champion URLs (force=${FORCE}, limit=${LIMIT || "none"}).`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NativeSunHomes-DealerBot/1.0 (catalog enrichment)",
  });
  const page = await context.newPage();

  const results = new Map(cached); // keep prior results
  let done = 0;
  for (const row of queue) {
    const rec = await scrapeOne(page, row);
    results.set(row.url, rec);
    done += 1;
    console.log(`  [${done}/${queue.length}] ${rec.scrapeStatus.padEnd(9)} ${row.name}`);
    // Write incrementally so a crash doesn't lose progress.
    writeOut([...results.values()]);
    await sleep(DELAY_MS);
  }

  await browser.close();

  const all = [...results.values()];
  const ok = all.filter((m) => m.scrapeStatus === "success").length;
  console.log(`\nDone. ${ok}/${all.length} successful. Wrote ${path.relative(ROOT, OUT_PATH)}.`);
  console.log("Now run: npm run build:data");
}

function writeOut(models) {
  fs.writeFileSync(
    OUT_PATH,
    JSON.stringify({ generatedAt: new Date().toISOString(), models }, null, 2)
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
