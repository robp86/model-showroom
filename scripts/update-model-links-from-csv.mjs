import fs from "fs/promises";
import { models } from "../src/data/models.js";

const csvPath = new URL("../data-import/updated-model-specs.csv", import.meta.url);
const outputPath = new URL("../src/data/models.js", import.meta.url);
const reportPath = new URL("./updated-links-report.json", import.meta.url);

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "," && !insideQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toNumber(value) {
  const number = Number(String(value || "").replace(/[^0-9.]/g, ""));
  return Number.isNaN(number) ? "" : number;
}

function cleanUrl(value) {
  const url = String(value || "").trim();

  if (!url.startsWith("http")) {
    return "";
  }

  return url;
}

const csvText = await fs.readFile(csvPath, "utf8");
const lines = csvText
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean);

const header = parseCsvLine(lines[0]).map((column) => column.toLowerCase());

const nameIndex = header.findIndex((column) => column.includes("name"));
const bedsIndex = header.findIndex((column) => column.includes("beds"));
const bathIndex = header.findIndex((column) => column.includes("bath"));
const sqftIndex = header.findIndex(
  (column) => column.includes("sq") || column.includes("feet")
);
const urlIndex = header.findIndex(
  (column) => column.includes("url") || column.includes("image")
);

const csvRows = lines.slice(1).map((line) => {
  const values = parseCsvLine(line);

  return {
    name: values[nameIndex] || "",
    bedrooms: toNumber(values[bedsIndex]),
    bathrooms: toNumber(values[bathIndex]),
    sqft: toNumber(values[sqftIndex]),
    manufacturerUrl: cleanUrl(values[urlIndex]),
  };
});

const csvByName = new Map();

for (const row of csvRows) {
  const key = normalizeName(row.name);

  if (!key) continue;

  if (!csvByName.has(key)) {
    csvByName.set(key, row);
  }
}

const report = {
  totalModels: models.length,
  csvRows: csvRows.length,
  updated: [],
  missingFromCsv: [],
};

const updatedModels = models.map((home) => {
  const key = normalizeName(home.name);
  const csvMatch = csvByName.get(key);

  if (!csvMatch) {
    report.missingFromCsv.push(home.name);
    return home;
  }

  report.updated.push({
    name: home.name,
    oldManufacturerUrl: home.manufacturerUrl || home.imageUrl || home.url || "",
    newManufacturerUrl: csvMatch.manufacturerUrl,
  });

  return {
    ...home,
    bedrooms: csvMatch.bedrooms || home.bedrooms,
    bathrooms: csvMatch.bathrooms || home.bathrooms,
    sqft: csvMatch.sqft || home.sqft,
    manufacturerUrl: csvMatch.manufacturerUrl || home.manufacturerUrl || home.imageUrl || home.url || "",
  };
});

const fileContent = `// Auto-generated model inventory
// Model specs and manufacturer links were updated from data-import/updated-model-specs.csv.
// Existing images were preserved.

export const models = ${JSON.stringify(updatedModels, null, 2)};
`;

await fs.writeFile(outputPath, fileContent, "utf8");
await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

console.log("");
console.log(`CSV rows read: ${csvRows.length}`);
console.log(`Models updated: ${report.updated.length}`);
console.log(`Models missing from CSV: ${report.missingFromCsv.length}`);
console.log("Updated src/data/models.js");
console.log("Created scripts/updated-links-report.json");