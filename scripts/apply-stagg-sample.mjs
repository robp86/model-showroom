import fs from "fs/promises";
import path from "path";
import { models } from "../src/data/models.js";

const modelName = "Stagg";
const modelFolder = path.resolve("public/model-galleries/Stagg");
const outputPath = path.resolve("src/data/models.js");
const auditReportPath = path.resolve("scripts/model-asset-audit-report.json");

const imageExtensions = [".jpg", ".jpeg", ".png", ".webp"];

function isImage(fileName) {
  return imageExtensions.includes(path.extname(fileName).toLowerCase());
}

function makePublicUrl(fileName) {
  return encodeURI(`/model-galleries/Stagg/${fileName}`);
}

function scoreImage(fileName) {
  const lower = fileName.toLowerCase();
  let score = 0;

  if (lower.includes("00header")) score += 1000;
  if (lower.includes("header")) score += 900;
  if (lower.includes("exterior")) score += 800;
  if (lower.includes("elevation")) score += 700;
  if (lower.includes("front")) score += 600;
  if (lower.includes("main")) score += 500;

  if (lower.includes("floor")) score -= 2000;
  if (lower.includes("plan")) score -= 2000;

  return score;
}

function isFloorPlan(fileName) {
  const lower = fileName.toLowerCase();
  return lower.includes("floor") || lower.includes("plan");
}

const files = await fs.readdir(modelFolder);
const imageFiles = files.filter(isImage);

const floorPlanFile = imageFiles.find(isFloorPlan);

const galleryFiles = imageFiles
  .filter((file) => !isFloorPlan(file))
  .sort((a, b) => scoreImage(b) - scoreImage(a) || a.localeCompare(b));

const gallery = galleryFiles.map(makePublicUrl);
const headerImage = gallery[0] || "";

let virtualTour = "";

try {
  const auditReport = JSON.parse(await fs.readFile(auditReportPath, "utf8"));
  virtualTour = auditReport?.recommended?.firstVirtualTour?.url || "";
} catch {
  virtualTour = "";
}

const floorPlan = floorPlanFile ? makePublicUrl(floorPlanFile) : "";

let updated = false;

const updatedModels = models.map((home) => {
  if (home.name !== modelName) return home;

  updated = true;

  return {
    ...home,
    image: headerImage || home.image || "",
    gallery,
    floorPlan,
    virtualTour,
  };
});

if (!updated) {
  console.log(`Could not find ${modelName} in src/data/models.js`);
  process.exit(1);
}

const fileContent = `// Auto-generated model inventory
// Stagg sample gallery, floor plan, and virtual tour were applied.

export const models = ${JSON.stringify(updatedModels, null, 2)};
`;

await fs.writeFile(outputPath, fileContent, "utf8");

console.log(`Updated ${modelName}`);
console.log(`Gallery images: ${gallery.length}`);
console.log(`Header image: ${headerImage || "none"}`);
console.log(`Floor plan: ${floorPlan || "none"}`);
console.log(`Virtual tour: ${virtualTour || "none"}`);